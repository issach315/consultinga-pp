from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.common.schemas import PaginatedResponse, PaginationMeta
from app.core.exceptions import ConflictError, NotFoundError
from app.modules.auth.models import User
from app.modules.requirements.models import Client
from app.modules.requirements.repository import ClientRepository
from app.modules.requirements.schemas import (
    ClientCreateRequest,
    ClientCreatorOut,
    ClientOut,
    ClientUpdateRequest,
)


class ClientService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.clients = ClientRepository(db)

    def create_client(
        self, tenant_id: str, created_by: str, payload: ClientCreateRequest
    ) -> ClientOut:
        if self.clients.company_name_exists(tenant_id, payload.company_name):
            raise ConflictError(f"A client named '{payload.company_name}' already exists")

        tenant = self.clients.lock_tenant(tenant_id)
        if tenant is None:
            raise NotFoundError("Tenant not found")

        tenant.client_sequence += 1
        client_code = (
            f"CLI-{datetime.now(UTC).strftime('%Y%m%d')}-{tenant.client_sequence:03d}"
        )
        values = payload.model_dump()
        values["contact_person_email"] = str(payload.contact_person_email).lower()
        values["website"] = str(payload.website) if payload.website else None
        values["company_type"] = payload.company_type.value
        values["status"] = payload.status.value

        client = Client(
            tenant_id=tenant_id,
            client_code=client_code,
            created_by=created_by,
            **values,
        )
        self.clients.create(client)
        self.db.commit()
        self.db.refresh(client)

        row = self.clients.get_by_id(tenant_id, client.id)
        assert row is not None
        return self._to_out(*row)

    def list_clients(
        self,
        tenant_id: str,
        page: int,
        page_size: int,
        search: str | None,
        statuses: list[str] | None,
        sort_by: str | None,
        sort_order: str | None,
    ) -> PaginatedResponse[ClientOut]:
        rows, total_items = self.clients.list_paginated(
            tenant_id, page, page_size, search, statuses, sort_by, sort_order
        )
        return PaginatedResponse(
            items=[self._to_out(client, creator) for client, creator in rows],
            meta=PaginationMeta(
                page=page,
                page_size=page_size,
                total_items=total_items,
                total_pages=max((total_items + page_size - 1) // page_size, 1),
            ),
        )

    def get_client(self, tenant_id: str, client_id: str) -> ClientOut:
        row = self.clients.get_by_id(tenant_id, client_id)
        if row is None:
            raise NotFoundError("Client not found")
        return self._to_out(*row)

    def update_client(
        self, tenant_id: str, client_id: str, updated_by: str, payload: ClientUpdateRequest
    ) -> ClientOut:
        row = self.clients.get_by_id(tenant_id, client_id)
        if row is None:
            raise NotFoundError("Client not found")
        client, _creator = row

        values = payload.model_dump(exclude_unset=True)
        company_name = values.get("company_name")
        if company_name and self.clients.company_name_exists(
            tenant_id, company_name, exclude_client_id=client_id
        ):
            raise ConflictError(f"A client named '{company_name}' already exists")

        for field, value in values.items():
            if field == "contact_person_email" and value is not None:
                value = str(value).lower()
            elif field == "website" and value is not None:
                value = str(value)
            elif hasattr(value, "value"):
                value = value.value
            setattr(client, field, value)
        client.updated_by = updated_by

        self.db.commit()
        self.db.refresh(client)
        updated_row = self.clients.get_by_id(tenant_id, client_id)
        assert updated_row is not None
        return self._to_out(*updated_row)

    def delete_client(self, tenant_id: str, client_id: str, deleted_by: str) -> None:
        row = self.clients.get_by_id(tenant_id, client_id)
        if row is None:
            raise NotFoundError("Client not found")
        client, _creator = row
        client.deleted_at = datetime.now(UTC)
        client.deleted_by = deleted_by
        self.db.commit()

    @staticmethod
    def _to_out(client: Client, creator: User) -> ClientOut:
        return ClientOut(
            id=client.id,
            tenant_id=client.tenant_id,
            client_code=client.client_code,
            company_name=client.company_name,
            company_type=client.company_type,
            industry=client.industry,
            contact_person_name=client.contact_person_name,
            contact_person_email=client.contact_person_email,
            contact_person_phone=client.contact_person_phone,
            designation=client.designation,
            website=client.website,
            address=client.address,
            city=client.city,
            state=client.state,
            country=client.country,
            postal_code=client.postal_code,
            status=client.status,
            notes=client.notes,
            created_by=client.created_by,
            onboarded_by=ClientCreatorOut(
                id=creator.id,
                name=f"{creator.first_name} {creator.last_name}".strip(),
                email=creator.email,
            ),
            updated_by=client.updated_by,
            deleted_by=client.deleted_by,
            created_at=client.created_at,
            updated_at=client.updated_at,
            deleted_at=client.deleted_at,
        )
