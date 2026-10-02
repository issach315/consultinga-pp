import io
import os
import re
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.common.schemas import PaginatedResponse, PaginationMeta
from app.core.config import get_settings
from app.core.database import new_uuid
from app.core.exceptions import AppError, ConflictError, NotFoundError
from app.core.security import hash_password, hash_token
from app.core.storage import get_storage_client
from app.modules.auth.constants import RoleCode
from app.modules.auth.models import User, UserRole
from app.modules.auth.repository import RoleRepository, UserRepository
from app.modules.employees.constants import (
    PERMISSION_ACTION_REQUIRES,
    PHOTO_CONTENT_TYPES,
    PHOTO_MAX_BYTES,
    EmployeeStatus,
    PermissionAction,
    role_codes_for_tenant_type,
)
from app.modules.employees.models import Employee
from app.modules.employees.repository import EmployeeRepository
from app.modules.employees.schemas import (
    EmployeeCreateRequest,
    EmployeeOut,
    EmployeePermissionIn,
    EmployeePhotoUploadResponse,
    EmployeeSummaryOut,
    EmployeeUpdateRequest,
)
from app.modules.requirements.constants import REQUIREMENTS_MODULE_KEY, REQUIREMENTS_SUB_MODULE_KEYS
from app.modules.tenants.models import Tenant, TenantInvitation
from app.modules.tenants.repository import TenantInvitationRepository, TenantRepository

settings = get_settings()


def _safe_filename(filename: str | None) -> str:
    name = os.path.basename(filename or "photo")
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)


@dataclass
class BulkOnboardResult:
    index: int
    status: str  # "created" | "failed"
    employee: EmployeeOut | None = None
    raw_token: str | None = None
    error: str | None = None


class EmployeeService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.employees = EmployeeRepository(db)
        self.tenants = TenantRepository(db)
        self.invitations = TenantInvitationRepository(db)
        self.users = UserRepository(db)
        self.roles = RoleRepository(db)
        self.storage = get_storage_client()

    def _get_tenant(self, tenant_id: str) -> Tenant:
        tenant = self.tenants.get_by_id(tenant_id)
        if tenant is None:
            raise NotFoundError("Tenant not found")
        return tenant

    def _validate_role(self, tenant: Tenant, role: str) -> None:
        allowed = role_codes_for_tenant_type(tenant.tenant_type)
        if role not in allowed:
            raise AppError(
                f"'{role}' is not a valid role for this tenant",
                code="INVALID_ROLE",
                status_code=400,
            )

    def _normalize_permissions(
        self, tenant: Tenant, permissions: list[EmployeePermissionIn]
    ) -> list[dict]:
        """Validates modules against the tenant's enabled modules and
        re-derives the CREATE/UPDATE/DELETE -> READ dependency server-side —
        never trusts the client's matrix state as-is."""
        normalized: list[dict] = []
        for entry in permissions:
            if entry.module not in tenant.enabled_modules:
                raise AppError(
                    f"Module '{entry.module}' is not enabled for this tenant",
                    code="INVALID_MODULE",
                    status_code=400,
                )
            if entry.module == REQUIREMENTS_MODULE_KEY:
                if entry.sub_module not in REQUIREMENTS_SUB_MODULE_KEYS:
                    raise AppError(
                        f"'{entry.sub_module}' is not a valid Requirements sub-module",
                        code="INVALID_SUB_MODULE",
                        status_code=400,
                    )
            elif entry.sub_module is not None:
                raise AppError(
                    f"Module '{entry.module}' does not support sub-modules",
                    code="INVALID_SUB_MODULE",
                    status_code=400,
                )
            actions = set(entry.actions)
            for action in list(actions):
                requires = PERMISSION_ACTION_REQUIRES.get(action)
                if requires:
                    actions.add(requires)
            if actions:
                normalized.append(
                    {
                        "module": entry.module,
                        "sub_module": entry.sub_module,
                        "actions": sorted(a.value for a in actions),
                    }
                )
        return normalized

    def onboard_employee(
        self, tenant_id: str, payload: EmployeeCreateRequest
    ) -> tuple[EmployeeOut, str]:
        """Creates the employee's User + Employee record and a pending
        invitation, mirroring TenantService.create_tenant's transaction shape.

        Returns (employee_out, raw_invite_token) for the router to email.
        """
        tenant = self._get_tenant(tenant_id)
        self._validate_role(tenant, payload.role)

        work_email = payload.work_email.lower().strip()
        if self.users.get_by_email(work_email) is not None:
            raise ConflictError(f"'{work_email}' is already registered")

        employee_role = self.roles.get_by_code(RoleCode.EMPLOYEE)
        if employee_role is None:
            raise AppError(
                "Employee role is not configured", code="ROLE_NOT_CONFIGURED", status_code=500
            )

        user = User(
            email=work_email,
            password_hash=hash_password(secrets.token_urlsafe(24)),
            first_name=payload.first_name,
            last_name=payload.last_name,
            is_active=True,
            tenant_id=tenant.id,
        )
        self.db.add(user)
        self.db.flush()
        self.db.add(UserRole(user_id=user.id, role_id=employee_role.id))

        tenant.employee_sequence += 1
        employee_code = f"{tenant.employee_id_prefix}-EMP-{tenant.employee_sequence:05d}"

        employee = Employee(
            tenant_id=tenant.id,
            user_id=user.id,
            employee_code=employee_code,
            role=payload.role,
            status=EmployeeStatus.INVITED.value,
            permissions=self._normalize_permissions(tenant, payload.permissions),
            **self._profile_and_employment_fields(payload),
        )
        self.employees.create(employee)

        raw_token = secrets.token_urlsafe(32)
        invitation = TenantInvitation(
            user_id=user.id,
            tenant_id=tenant.id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(UTC) + timedelta(days=settings.invitation_expiry_days),
        )
        self.invitations.create(invitation)

        self.db.commit()
        self.db.refresh(employee)
        self.db.refresh(user)

        return self._to_employee_out(employee, user), raw_token

    def _profile_and_employment_fields(
        self, payload: EmployeeCreateRequest | EmployeeUpdateRequest
    ) -> dict:
        """New optional profile/employment attributes, shared by onboard_employee
        and bulk_onboard_employees so both stay in sync as fields are added."""
        return {
            "joining_date": payload.joining_date,
            "department": payload.department,
            "designation": payload.designation,
            "employment_type": payload.employment_type,
            "work_location": payload.work_location,
            "work_mode": payload.work_mode,
            "reporting_manager_id": payload.reporting_manager_id,
            "preferred_name": payload.preferred_name,
            "personal_email": payload.personal_email,
            "phone": payload.phone,
            "date_of_birth": payload.date_of_birth,
            "gender": payload.gender,
            "address_line": payload.address_line,
            "city": payload.city,
            "state": payload.state,
            "postal_code": payload.postal_code,
            "profile_photo_key": payload.profile_photo_key,
        }

    async def upload_employee_photo(self, file: UploadFile) -> EmployeePhotoUploadResponse:
        if file.content_type not in PHOTO_CONTENT_TYPES:
            raise AppError("Unsupported file type", code="INVALID_FILE_TYPE", status_code=400)
        contents = await file.read()
        if len(contents) > PHOTO_MAX_BYTES:
            raise AppError("File exceeds the 2MB limit", code="FILE_TOO_LARGE", status_code=400)
        object_key = f"employee-photos/{new_uuid()}-{_safe_filename(file.filename)}"
        self.storage.ensure_bucket()
        self.storage.upload(object_key, io.BytesIO(contents), len(contents), file.content_type)
        return EmployeePhotoUploadResponse(
            photo_object_key=object_key, preview_url=self.storage.presigned_url(object_key)
        )

    def bulk_onboard_employees(
        self, tenant_id: str, payloads: list[EmployeeCreateRequest]
    ) -> list[BulkOnboardResult]:
        """Same logic as onboard_employee, run per-row against one loaded
        Tenant so employee_sequence increments correctly across the whole
        batch. Each row runs inside its own SAVEPOINT so one bad row (a
        duplicate email, an invalid role) doesn't abort the others — and
        because the sequence increment happens after validation, a failed
        row never burns an employee_code."""
        tenant = self._get_tenant(tenant_id)
        results: list[BulkOnboardResult] = []

        for index, payload in enumerate(payloads):
            savepoint = self.db.begin_nested()
            try:
                self._validate_role(tenant, payload.role)

                work_email = payload.work_email.lower().strip()
                if self.users.get_by_email(work_email) is not None:
                    raise ConflictError(f"'{work_email}' is already registered")

                employee_role = self.roles.get_by_code(RoleCode.EMPLOYEE)
                if employee_role is None:
                    raise AppError(
                        "Employee role is not configured",
                        code="ROLE_NOT_CONFIGURED",
                        status_code=500,
                    )

                user = User(
                    email=work_email,
                    password_hash=hash_password(secrets.token_urlsafe(24)),
                    first_name=payload.first_name,
                    last_name=payload.last_name,
                    is_active=True,
                    tenant_id=tenant.id,
                )
                self.db.add(user)
                self.db.flush()
                self.db.add(UserRole(user_id=user.id, role_id=employee_role.id))

                tenant.employee_sequence += 1
                employee = Employee(
                    tenant_id=tenant.id,
                    user_id=user.id,
                    employee_code=f"{tenant.employee_id_prefix}-EMP-{tenant.employee_sequence:05d}",
                    role=payload.role,
                    status=EmployeeStatus.INVITED.value,
                    permissions=self._normalize_permissions(tenant, payload.permissions),
                    **self._profile_and_employment_fields(payload),
                )
                self.employees.create(employee)

                raw_token = secrets.token_urlsafe(32)
                invitation = TenantInvitation(
                    user_id=user.id,
                    tenant_id=tenant.id,
                    token_hash=hash_token(raw_token),
                    expires_at=datetime.now(UTC) + timedelta(days=settings.invitation_expiry_days),
                )
                self.invitations.create(invitation)

                savepoint.commit()
                self.db.refresh(employee)
                self.db.refresh(user)
                results.append(
                    BulkOnboardResult(
                        index=index,
                        status="created",
                        employee=self._to_employee_out(employee, user),
                        raw_token=raw_token,
                    )
                )
            except AppError as exc:
                savepoint.rollback()
                results.append(BulkOnboardResult(index=index, status="failed", error=exc.message))

        self.db.commit()
        return results

    def get_summary(self, tenant_id: str) -> EmployeeSummaryOut:
        tenant = self._get_tenant(tenant_id)
        status_counts = self.employees.get_status_counts(tenant_id)
        total = sum(status_counts.values())
        permission_rows = sum(
            len(REQUIREMENTS_SUB_MODULE_KEYS) if module == REQUIREMENTS_MODULE_KEY else 1
            for module in tenant.enabled_modules
        )
        denominator = permission_rows * len(PermissionAction)

        avg_pct = 0.0
        if total and denominator:
            rows = self.employees.get_permissions_for_tenant(tenant_id)
            granted = sum(len(entry.get("actions", [])) for row in rows for entry in row)
            avg_pct = round((granted / (denominator * total)) * 100, 1)

        return EmployeeSummaryOut(
            total=total,
            active=status_counts.get(EmployeeStatus.ACTIVE.value, 0),
            invited=status_counts.get(EmployeeStatus.INVITED.value, 0),
            inactive=status_counts.get(EmployeeStatus.INACTIVE.value, 0),
            avg_permission_grant_pct=avg_pct,
        )

    def list_employees(
        self,
        tenant_id: str,
        page: int,
        page_size: int,
        search: str | None,
        roles: list[str] | None,
        statuses: list[str] | None,
        sort_by: str | None,
        sort_order: str | None,
    ) -> PaginatedResponse[EmployeeOut]:
        rows, total_items = self.employees.list_paginated(
            tenant_id, page, page_size, search, roles, statuses, sort_by, sort_order
        )
        items = [self._to_employee_out(employee, user) for employee, user in rows]
        total_pages = max((total_items + page_size - 1) // page_size, 1)
        return PaginatedResponse(
            items=items,
            meta=PaginationMeta(
                page=page, page_size=page_size, total_items=total_items, total_pages=total_pages
            ),
        )

    def _get_employee_and_user(self, tenant_id: str, employee_id: str) -> tuple[Employee, User]:
        employee = self.employees.get_by_id(tenant_id, employee_id)
        if employee is None:
            raise NotFoundError("Employee not found")
        user = self.users.get_by_id(employee.user_id)
        if user is None:
            raise NotFoundError("Employee account not found")
        return employee, user

    def get_employee(self, tenant_id: str, employee_id: str) -> EmployeeOut:
        employee, user = self._get_employee_and_user(tenant_id, employee_id)
        return self._to_employee_out(employee, user)

    def update_employee(
        self, tenant_id: str, employee_id: str, payload: EmployeeUpdateRequest
    ) -> EmployeeOut:
        employee, user = self._get_employee_and_user(tenant_id, employee_id)
        tenant = self._get_tenant(tenant_id)
        self._validate_role(tenant, payload.role)

        email = payload.email.lower().strip()
        existing = self.users.get_by_email(email)
        if existing is not None and existing.id != user.id:
            raise ConflictError(f"'{email}' is already registered")

        user.first_name = payload.first_name
        user.last_name = payload.last_name
        user.email = email
        employee.role = payload.role

        # Only apply employment/profile fields the caller actually included
        # in the request body — a request that only sends the four identity
        # fields above (the quick-edit dialog) must never blank out the
        # rest of the employee's record.
        identity_fields = {"first_name", "last_name", "email", "role"}
        provided = payload.model_dump(exclude_unset=True, exclude=identity_fields)
        for field, value in provided.items():
            setattr(employee, field, value)

        self.db.commit()
        self.db.refresh(employee)
        self.db.refresh(user)
        return self._to_employee_out(employee, user)

    def set_status(self, tenant_id: str, employee_id: str, status: EmployeeStatus) -> EmployeeOut:
        if status == EmployeeStatus.INVITED:
            raise AppError(
                "Employees cannot be set to Invited directly",
                code="INVALID_STATUS_TRANSITION",
                status_code=400,
            )
        employee, user = self._get_employee_and_user(tenant_id, employee_id)
        employee.status = status.value
        self.db.commit()
        self.db.refresh(employee)
        return self._to_employee_out(employee, user)

    def reissue_invitation(self, tenant_id: str, employee_id: str) -> tuple[EmployeeOut, str]:
        """Issues a fresh one-time credential-setting link for this employee's
        user — the same mechanism whether they've never logged in (INVITED,
        i.e. "resend invitation") or already have an account ("reset password
        link"). Any earlier unaccepted invitation for this user is expired
        first so only the newest link ever works."""
        employee, user = self._get_employee_and_user(tenant_id, employee_id)

        self.invitations.expire_pending_for_user(user.id)

        raw_token = secrets.token_urlsafe(32)
        invitation = TenantInvitation(
            user_id=user.id,
            tenant_id=tenant_id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(UTC) + timedelta(days=settings.invitation_expiry_days),
        )
        self.invitations.create(invitation)
        self.db.commit()

        return self._to_employee_out(employee, user), raw_token

    def update_permissions(
        self, tenant_id: str, employee_id: str, permissions: list[EmployeePermissionIn]
    ) -> EmployeeOut:
        employee, user = self._get_employee_and_user(tenant_id, employee_id)
        tenant = self._get_tenant(tenant_id)
        employee.permissions = self._normalize_permissions(tenant, permissions)
        self.db.commit()
        self.db.refresh(employee)
        return self._to_employee_out(employee, user)

    def _to_employee_out(self, employee: Employee, user: User) -> EmployeeOut:
        return EmployeeOut(
            id=employee.id,
            tenant_id=employee.tenant_id,
            employee_code=employee.employee_code,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            role=employee.role,
            status=EmployeeStatus(employee.status),
            permissions=[EmployeePermissionIn(**entry) for entry in employee.permissions],
            created_at=employee.created_at,
            updated_at=employee.updated_at,
            joining_date=employee.joining_date,
            department=employee.department,
            designation=employee.designation,
            employment_type=employee.employment_type,
            work_location=employee.work_location,
            work_mode=employee.work_mode,
            reporting_manager_id=employee.reporting_manager_id,
            preferred_name=employee.preferred_name,
            personal_email=employee.personal_email,
            phone=employee.phone,
            date_of_birth=employee.date_of_birth,
            gender=employee.gender,
            address_line=employee.address_line,
            city=employee.city,
            state=employee.state,
            postal_code=employee.postal_code,
            profile_photo_url=(
                self.storage.presigned_url(employee.profile_photo_key)
                if employee.profile_photo_key
                else None
            ),
        )
