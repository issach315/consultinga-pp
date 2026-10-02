from datetime import UTC, datetime

from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session

from app.modules.tenants.models import Tenant, TenantInvitation


class TenantRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, tenant: Tenant) -> Tenant:
        self.db.add(tenant)
        self.db.flush()
        return tenant

    def get_by_id(self, tenant_id: str) -> Tenant | None:
        stmt = select(Tenant).where(Tenant.id == tenant_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def delete(self, tenant: Tenant) -> None:
        self.db.delete(tenant)

    def get_by_code(self, tenant_code: str) -> Tenant | None:
        stmt = select(Tenant).where(Tenant.tenant_code == tenant_code)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_subdomain(self, subdomain: str) -> Tenant | None:
        stmt = select(Tenant).where(Tenant.subdomain == subdomain)
        return self.db.execute(stmt).scalar_one_or_none()

    def list_paginated(
        self,
        page: int,
        page_size: int,
        search: str | None = None,
        is_active: bool | None = None,
        plan: str | None = None,
        tenant_type: str | None = None,
    ) -> tuple[list[Tenant], int]:
        stmt = select(Tenant)
        count_stmt = select(func.count()).select_from(Tenant)

        if search:
            pattern = f"%{search}%"
            condition = or_(
                Tenant.legal_company_name.ilike(pattern), Tenant.tenant_code.ilike(pattern)
            )
            stmt = stmt.where(condition)
            count_stmt = count_stmt.where(condition)

        if is_active is not None:
            stmt = stmt.where(Tenant.is_active == is_active)
            count_stmt = count_stmt.where(Tenant.is_active == is_active)

        if plan is not None:
            stmt = stmt.where(Tenant.plan == plan)
            count_stmt = count_stmt.where(Tenant.plan == plan)

        if tenant_type is not None:
            stmt = stmt.where(Tenant.tenant_type == tenant_type)
            count_stmt = count_stmt.where(Tenant.tenant_type == tenant_type)

        total_items = self.db.execute(count_stmt).scalar_one()
        stmt = (
            stmt.order_by(Tenant.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        items = list(self.db.execute(stmt).scalars())
        return items, total_items


class TenantInvitationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, invitation: TenantInvitation) -> TenantInvitation:
        self.db.add(invitation)
        self.db.flush()
        return invitation

    def get_by_token_hash(self, token_hash: str) -> TenantInvitation | None:
        stmt = select(TenantInvitation).where(TenantInvitation.token_hash == token_hash)
        return self.db.execute(stmt).scalar_one_or_none()

    def expire_pending_for_user(self, user_id: str) -> None:
        """Invalidates any earlier unaccepted invitation for this user by
        expiring it, so a freshly issued link is always the only one that
        works."""
        stmt = (
            update(TenantInvitation)
            .where(TenantInvitation.user_id == user_id, TenantInvitation.accepted_at.is_(None))
            .values(expires_at=datetime.now(UTC))
        )
        self.db.execute(stmt)
