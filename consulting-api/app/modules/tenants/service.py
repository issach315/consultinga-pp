import io
import os
import re
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.common.schemas import PaginatedResponse, PaginationMeta
from app.core.config import get_settings
from app.core.database import new_uuid
from app.core.exceptions import AppError, ConflictError, InvalidInvitationError, NotFoundError
from app.core.security import hash_password, hash_token
from app.core.storage import get_storage_client
from app.modules.auth.constants import RoleCode
from app.modules.auth.models import User, UserRole
from app.modules.auth.repository import RoleRepository, UserRepository
from app.modules.auth.schemas import LoginResponse, UserOut
from app.modules.auth.service import AuthService
from app.modules.employees.constants import EmployeeStatus
from app.modules.employees.repository import EmployeeRepository
from app.modules.tenants.constants import LOGO_CONTENT_TYPES, LOGO_MAX_BYTES
from app.modules.tenants.models import Tenant, TenantInvitation
from app.modules.tenants.repository import TenantInvitationRepository, TenantRepository
from app.modules.tenants.schemas import (
    InvitationDetailOut,
    LogoUploadResponse,
    TenantCreateRequest,
    TenantListItemOut,
    TenantOut,
    TenantUpdateRequest,
)

settings = get_settings()


def _safe_filename(filename: str | None) -> str:
    name = os.path.basename(filename or "logo")
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)


class TenantService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.tenants = TenantRepository(db)
        self.invitations = TenantInvitationRepository(db)
        self.users = UserRepository(db)
        self.roles = RoleRepository(db)
        self.employees = EmployeeRepository(db)
        self.storage = get_storage_client()

    def create_tenant(self, payload: TenantCreateRequest) -> tuple[TenantOut, str]:
        """Creates the tenant, its admin user, and a pending invitation.

        Returns (tenant_out, raw_invite_token) — the raw token exists only for
        this one call (only its hash is persisted); the router uses it to
        send the invite email.
        """
        tenant_code = payload.company_details.tenant_code.strip().upper()
        if self.tenants.get_by_code(tenant_code) is not None:
            raise ConflictError(f"Tenant code '{tenant_code}' is already in use")

        subdomain = payload.company_details.subdomain
        if self.tenants.get_by_subdomain(subdomain) is not None:
            raise ConflictError(f"Subdomain '{subdomain}' is already in use")

        work_email = payload.tenant_admin.work_email.lower().strip()
        if self.users.get_by_email(work_email) is not None:
            raise ConflictError(f"'{work_email}' is already registered")

        tenant_admin_role = self.roles.get_by_code(RoleCode.TENANT_ADMIN)
        if tenant_admin_role is None:
            raise AppError(
                "Tenant Admin role is not configured", code="ROLE_NOT_CONFIGURED", status_code=500
            )

        admin_user = User(
            email=work_email,
            password_hash=hash_password(secrets.token_urlsafe(24)),
            first_name=payload.tenant_admin.first_name,
            last_name=payload.tenant_admin.last_name,
            is_active=True,
        )
        self.db.add(admin_user)
        self.db.flush()
        self.db.add(UserRole(user_id=admin_user.id, role_id=tenant_admin_role.id))

        tenant = Tenant(
            legal_company_name=payload.company_details.legal_company_name,
            display_name=payload.company_details.display_name,
            tenant_code=tenant_code,
            subdomain=subdomain,
            industry=payload.company_details.industry,
            tenant_type=payload.company_details.tenant_type.value,
            company_email=payload.company_details.company_email,
            phone=payload.company_details.phone,
            website=payload.company_details.website,
            country=payload.location.country,
            state=payload.location.state,
            city=payload.location.city,
            postal_code=payload.location.postal_code,
            timezone=payload.location.timezone,
            currency=payload.location.currency,
            business_address=payload.location.business_address,
            enabled_modules=payload.modules,
            plan=payload.configuration.plan.value,
            employee_limit=payload.configuration.employee_limit,
            logo_object_key=payload.branding.logo_object_key,
            primary_brand_color=payload.branding.primary_brand_color,
            email_sender_name=payload.branding.email_sender_name,
            support_email=payload.branding.support_email,
            admin_user_id=admin_user.id,
        )
        tenant.employee_id_prefix = tenant_code[:3].upper()
        self.tenants.create(tenant)
        admin_user.tenant_id = tenant.id

        raw_token = secrets.token_urlsafe(32)
        invitation = TenantInvitation(
            user_id=admin_user.id,
            tenant_id=tenant.id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(UTC) + timedelta(days=settings.invitation_expiry_days),
        )
        self.invitations.create(invitation)

        self.db.commit()
        self.db.refresh(tenant)
        self.db.refresh(admin_user)

        return self._to_tenant_out(tenant, admin_user), raw_token

    def list_tenants(
        self,
        page: int,
        page_size: int,
        search: str | None,
        is_active: bool | None = None,
        plan: str | None = None,
        tenant_type: str | None = None,
    ) -> PaginatedResponse[TenantListItemOut]:
        tenants, total_items = self.tenants.list_paginated(
            page, page_size, search, is_active, plan, tenant_type
        )
        admins = {u.id: u for u in self.users.get_by_ids([t.admin_user_id for t in tenants])}

        items = [
            TenantListItemOut(
                id=t.id,
                legal_company_name=t.legal_company_name,
                tenant_code=t.tenant_code,
                subdomain=t.subdomain,
                plan=t.plan,
                employee_limit=t.employee_limit,
                admin_email=admins[t.admin_user_id].email if t.admin_user_id in admins else "",
                is_active=t.is_active,
                created_at=t.created_at,
            )
            for t in tenants
        ]
        total_pages = max((total_items + page_size - 1) // page_size, 1)
        return PaginatedResponse(
            items=items,
            meta=PaginationMeta(
                page=page, page_size=page_size, total_items=total_items, total_pages=total_pages
            ),
        )

    def get_tenant(self, tenant_id: str) -> TenantOut:
        tenant = self.tenants.get_by_id(tenant_id)
        if tenant is None:
            raise NotFoundError("Tenant not found")
        admin = self.users.get_by_id(tenant.admin_user_id)
        if admin is None:
            raise NotFoundError("Tenant admin not found")
        return self._to_tenant_out(tenant, admin)

    def set_active(self, tenant_id: str, is_active: bool) -> TenantOut:
        tenant = self.tenants.get_by_id(tenant_id)
        if tenant is None:
            raise NotFoundError("Tenant not found")
        admin = self.users.get_by_id(tenant.admin_user_id)
        if admin is None:
            raise NotFoundError("Tenant admin not found")

        tenant.is_active = is_active
        self.db.commit()
        self.db.refresh(tenant)
        return self._to_tenant_out(tenant, admin)

    def update_tenant(self, tenant_id: str, payload: TenantUpdateRequest) -> TenantOut:
        tenant = self.tenants.get_by_id(tenant_id)
        if tenant is None:
            raise NotFoundError("Tenant not found")

        tenant_code = payload.company_details.tenant_code.strip().upper()
        by_code = self.tenants.get_by_code(tenant_code)
        if by_code is not None and by_code.id != tenant.id:
            raise ConflictError(f"Tenant code '{tenant_code}' is already in use")

        subdomain = payload.company_details.subdomain
        by_subdomain = self.tenants.get_by_subdomain(subdomain)
        if by_subdomain is not None and by_subdomain.id != tenant.id:
            raise ConflictError(f"Subdomain '{subdomain}' is already in use")

        tenant.legal_company_name = payload.company_details.legal_company_name
        tenant.display_name = payload.company_details.display_name
        tenant.tenant_code = tenant_code
        tenant.subdomain = subdomain
        tenant.industry = payload.company_details.industry
        tenant.tenant_type = payload.company_details.tenant_type.value
        tenant.company_email = payload.company_details.company_email
        tenant.phone = payload.company_details.phone
        tenant.website = payload.company_details.website
        tenant.country = payload.location.country
        tenant.state = payload.location.state
        tenant.city = payload.location.city
        tenant.postal_code = payload.location.postal_code
        tenant.timezone = payload.location.timezone
        tenant.currency = payload.location.currency
        tenant.business_address = payload.location.business_address
        tenant.enabled_modules = payload.modules
        tenant.plan = payload.configuration.plan.value
        tenant.employee_limit = payload.configuration.employee_limit
        tenant.logo_object_key = payload.branding.logo_object_key
        tenant.primary_brand_color = payload.branding.primary_brand_color
        tenant.email_sender_name = payload.branding.email_sender_name
        tenant.support_email = payload.branding.support_email
        tenant.is_active = payload.is_active

        self.db.commit()
        self.db.refresh(tenant)

        admin = self.users.get_by_id(tenant.admin_user_id)
        if admin is None:
            raise NotFoundError("Tenant admin not found")
        return self._to_tenant_out(tenant, admin)

    def update_employee_id_prefix(self, tenant_id: str, prefix: str) -> TenantOut:
        tenant = self.tenants.get_by_id(tenant_id)
        if tenant is None:
            raise NotFoundError("Tenant not found")

        tenant.employee_id_prefix = prefix
        self.db.commit()
        self.db.refresh(tenant)

        admin = self.users.get_by_id(tenant.admin_user_id)
        if admin is None:
            raise NotFoundError("Tenant admin not found")
        return self._to_tenant_out(tenant, admin)

    def delete_tenant(self, tenant_id: str) -> None:
        tenant = self.tenants.get_by_id(tenant_id)
        if tenant is None:
            raise NotFoundError("Tenant not found")

        admin = self.users.get_by_id(tenant.admin_user_id)
        self.tenants.delete(tenant)
        self.db.flush()
        if admin is not None:
            self.db.delete(admin)
        self.db.commit()

    async def upload_logo(self, file: UploadFile) -> LogoUploadResponse:
        if file.content_type not in LOGO_CONTENT_TYPES:
            raise AppError("Unsupported file type", code="INVALID_FILE_TYPE", status_code=400)

        contents = await file.read()
        if len(contents) > LOGO_MAX_BYTES:
            raise AppError("File exceeds the 2MB limit", code="FILE_TOO_LARGE", status_code=400)

        object_key = f"tenant-logos/{new_uuid()}-{_safe_filename(file.filename)}"
        self.storage.ensure_bucket()
        self.storage.upload(object_key, io.BytesIO(contents), len(contents), file.content_type)
        return LogoUploadResponse(
            logo_object_key=object_key, preview_url=self.storage.presigned_url(object_key)
        )

    def get_invitation_detail(self, token: str) -> InvitationDetailOut:
        invitation = self._get_valid_invitation(token)
        user = self.users.get_by_id(invitation.user_id)
        tenant = self.tenants.get_by_id(invitation.tenant_id)
        if user is None or tenant is None:
            raise InvalidInvitationError()
        role_name = user.roles[0].name if user.roles else "User"
        return InvitationDetailOut(
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            tenant_name=tenant.display_name or tenant.legal_company_name,
            role_name=role_name,
            expires_at=invitation.expires_at,
        )

    def accept_invitation(self, token: str, password: str) -> LoginResponse:
        invitation = self._get_valid_invitation(token)
        user = self.users.get_by_id(invitation.user_id)
        if user is None:
            raise InvalidInvitationError()

        user.password_hash = hash_password(password)
        invitation.accepted_at = datetime.now(UTC)

        employee = self.employees.get_by_user_id(user.id)
        if employee is not None and employee.status == EmployeeStatus.INVITED.value:
            employee.status = EmployeeStatus.ACTIVE.value

        self.db.commit()

        auth_service = AuthService(self.db)
        tokens = auth_service.issue_token_pair(user.id)
        return LoginResponse(**tokens.model_dump(), user=UserOut.model_validate(user))

    def _get_valid_invitation(self, token: str) -> TenantInvitation:
        invitation = self.invitations.get_by_token_hash(hash_token(token))
        if invitation is None or invitation.is_accepted:
            raise InvalidInvitationError()
        if invitation.expires_at.replace(tzinfo=UTC) < datetime.now(UTC):
            raise InvalidInvitationError()
        return invitation

    def _to_tenant_out(self, tenant: Tenant, admin: User) -> TenantOut:
        return TenantOut(
            id=tenant.id,
            legal_company_name=tenant.legal_company_name,
            display_name=tenant.display_name,
            tenant_code=tenant.tenant_code,
            subdomain=tenant.subdomain,
            industry=tenant.industry,
            tenant_type=tenant.tenant_type,
            company_email=tenant.company_email,
            phone=tenant.phone,
            website=tenant.website,
            country=tenant.country,
            state=tenant.state,
            city=tenant.city,
            postal_code=tenant.postal_code,
            timezone=tenant.timezone,
            currency=tenant.currency,
            business_address=tenant.business_address,
            enabled_modules=tenant.enabled_modules,
            plan=tenant.plan,
            employee_limit=tenant.employee_limit,
            employee_id_prefix=tenant.employee_id_prefix,
            logo_url=self.storage.presigned_url(tenant.logo_object_key)
            if tenant.logo_object_key
            else None,
            logo_object_key=tenant.logo_object_key,
            primary_brand_color=tenant.primary_brand_color,
            email_sender_name=tenant.email_sender_name,
            support_email=tenant.support_email,
            is_active=tenant.is_active,
            admin_first_name=admin.first_name,
            admin_last_name=admin.last_name,
            admin_email=admin.email,
            created_at=tenant.created_at,
            updated_at=tenant.updated_at,
        )
