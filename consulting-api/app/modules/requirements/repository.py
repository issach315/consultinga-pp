from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, aliased

from app.modules.auth.models import User
from app.modules.requirements.models import Client
from app.modules.tenants.models import Tenant


class ClientRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def lock_tenant(self, tenant_id: str) -> Tenant | None:
        stmt = select(Tenant).where(Tenant.id == tenant_id).with_for_update()
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, client: Client) -> Client:
        self.db.add(client)
        self.db.flush()
        return client

    def get_by_id(self, tenant_id: str, client_id: str) -> tuple[Client, User] | None:
        creator = aliased(User)
        stmt = (
            select(Client, creator)
            .join(creator, creator.id == Client.created_by)
            .where(
                Client.tenant_id == tenant_id,
                Client.id == client_id,
                Client.deleted_at.is_(None),
            )
        )
        row = self.db.execute(stmt).one_or_none()
        return (row[0], row[1]) if row else None

    def company_name_exists(
        self, tenant_id: str, company_name: str, exclude_client_id: str | None = None
    ) -> bool:
        stmt = select(Client.id).where(
            Client.tenant_id == tenant_id,
            func.lower(Client.company_name) == company_name.lower(),
            Client.deleted_at.is_(None),
        )
        if exclude_client_id:
            stmt = stmt.where(Client.id != exclude_client_id)
        return self.db.execute(stmt.limit(1)).scalar_one_or_none() is not None

    def list_paginated(
        self,
        tenant_id: str,
        page: int,
        page_size: int,
        search: str | None,
        statuses: list[str] | None,
        sort_by: str | None,
        sort_order: str | None,
    ) -> tuple[list[tuple[Client, User]], int]:
        creator = aliased(User)
        base = (
            select(Client, creator)
            .join(creator, creator.id == Client.created_by)
            .where(Client.tenant_id == tenant_id, Client.deleted_at.is_(None))
        )

        if search:
            pattern = f"%{search.strip()}%"
            base = base.where(
                or_(
                    Client.client_code.ilike(pattern),
                    Client.company_name.ilike(pattern),
                    Client.industry.ilike(pattern),
                    Client.contact_person_name.ilike(pattern),
                    Client.contact_person_email.ilike(pattern),
                    Client.city.ilike(pattern),
                )
            )
        if statuses:
            base = base.where(Client.status.in_(statuses))

        total_items = self.db.execute(
            select(func.count()).select_from(base.subquery())
        ).scalar_one()

        sort_column = {
            "clientCode": Client.client_code,
            "companyName": Client.company_name,
            "industry": Client.industry,
            "contactPersonName": Client.contact_person_name,
            "status": Client.status,
            "createdAt": Client.created_at,
        }.get(sort_by or "createdAt", Client.created_at)
        base = base.order_by(
            sort_column.asc() if sort_order == "asc" else sort_column.desc()
        )
        base = base.offset((page - 1) * page_size).limit(page_size)

        rows = self.db.execute(base).all()
        return [(row[0], row[1]) for row in rows], total_items
