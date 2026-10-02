from datetime import UTC, datetime

from fastapi import status
from sqlalchemy.orm import Session

from app.common.schemas import PaginatedResponse, PaginationMeta
from app.core.exceptions import AppError, NotFoundError
from app.modules.auth.constants import RoleCode
from app.modules.auth.models import User
from app.modules.auth.schemas import UserOut
from app.modules.requirements.job_models import Requirement
from app.modules.requirements.job_repository import JobRow, RequirementRepository
from app.modules.requirements.job_schemas import (
    JobPriority,
    JobStatus,
    RequirementAssigneeOut,
    RequirementClientOut,
    RequirementCreateRequest,
    RequirementOut,
    RequirementUpdateRequest,
    RequirementUserOut,
)


class RequirementService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.requirements = RequirementRepository(db)

    @staticmethod
    def _is_tenant_admin(current_user: UserOut) -> bool:
        return RoleCode.TENANT_ADMIN in {role.code for role in current_user.roles}

    def _scope(self, current_user: UserOut) -> tuple[str | None, bool]:
        assert current_user.tenant_id is not None
        return (
            self.requirements.get_employee_role(current_user.tenant_id, current_user.id),
            self._is_tenant_admin(current_user),
        )

    def _validate_assignments(
        self, tenant_id: str, recruiter_ids: list[str], team_lead_ids: list[str]
    ) -> None:
        recruiters = self.requirements.validate_assignees(tenant_id, recruiter_ids, "RECRUITER")
        team_leads = self.requirements.validate_assignees(tenant_id, team_lead_ids, "TEAMLEAD")
        if {user.id for _employee, user in recruiters} != set(recruiter_ids):
            raise AppError("One or more selected recruiters are invalid or inactive")
        if {user.id for _employee, user in team_leads} != set(team_lead_ids):
            raise AppError("One or more selected team leads are invalid or inactive")

    def list_assignees(self, tenant_id: str, role: str) -> list[RequirementAssigneeOut]:
        if role not in {"RECRUITER", "TEAMLEAD", "BDM"}:
            raise AppError("Role must be RECRUITER, TEAMLEAD, or BDM")
        return [
            RequirementAssigneeOut(
                id=user.id,
                employee_id=employee.id,
                name=f"{user.first_name} {user.last_name}".strip(),
                email=user.email,
                role=employee.role,
            )
            for employee, user in self.requirements.list_assignees(tenant_id, role)
        ]

    def create_requirement(
        self, current_user: UserOut, payload: RequirementCreateRequest
    ) -> RequirementOut:
        assert current_user.tenant_id is not None
        tenant_id = current_user.tenant_id
        employee_role, is_tenant_admin = self._scope(current_user)
        if not is_tenant_admin and employee_role != "BDM":
            raise AppError(
                "Only BDM users can post jobs",
                code="FORBIDDEN",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        if self.requirements.get_client(tenant_id, payload.client_id) is None:
            raise AppError("Select an active client belonging to your organization")
        self._validate_assignments(
            tenant_id, payload.assigned_recruiters, payload.assigned_team_leads
        )

        tenant = self.requirements.lock_tenant(tenant_id)
        if tenant is None:
            raise NotFoundError("Tenant not found")
        today = datetime.now(UTC).date()
        if tenant.job_sequence_date != today:
            tenant.job_sequence_date = today
            tenant.job_sequence = 0
        tenant.job_sequence += 1
        job_code = f"JOB-{today.strftime('%Y%m%d')}-{tenant.job_sequence:03d}"

        values = payload.model_dump()
        recruiter_ids = values.pop("assigned_recruiters")
        team_lead_ids = values.pop("assigned_team_leads")
        for key, value in list(values.items()):
            if hasattr(value, "value"):
                values[key] = value.value

        requirement = Requirement(
            tenant_id=tenant_id,
            job_code=job_code,
            status=JobStatus.OPEN.value,
            created_by=current_user.id,
            **values,
        )
        self.requirements.create(requirement)
        self.requirements.replace_assignments(
            requirement.id, recruiter_ids, team_lead_ids, current_user.id
        )
        self.db.commit()
        return self.get_requirement(current_user, requirement.id)

    def list_requirements(
        self,
        current_user: UserOut,
        page: int,
        page_size: int,
        search: str | None,
        client_id: str | None,
        job_status: JobStatus | None,
        priority: JobPriority | None,
        recruiter_id: str | None,
        team_lead_id: str | None,
        created_by: str | None,
        sort_by: str | None,
        sort_order: str | None,
    ) -> PaginatedResponse[RequirementOut]:
        assert current_user.tenant_id is not None
        employee_role, unrestricted = self._scope(current_user)
        rows, total_items = self.requirements.list_paginated(
            current_user.tenant_id,
            current_user.id,
            employee_role,
            unrestricted,
            page,
            page_size,
            search,
            client_id,
            job_status.value if job_status else None,
            priority.value if priority else None,
            recruiter_id,
            team_lead_id,
            created_by,
            sort_by,
            sort_order,
        )
        return PaginatedResponse(
            items=self._rows_to_out(rows),
            meta=PaginationMeta(
                page=page,
                page_size=page_size,
                total_items=total_items,
                total_pages=max((total_items + page_size - 1) // page_size, 1),
            ),
        )

    def get_requirement(self, current_user: UserOut, requirement_id: str) -> RequirementOut:
        assert current_user.tenant_id is not None
        employee_role, unrestricted = self._scope(current_user)
        row = self.requirements.get_by_id(
            current_user.tenant_id,
            requirement_id,
            current_user.id,
            employee_role,
            unrestricted,
        )
        if row is None:
            raise NotFoundError("Requirement not found")
        return self._rows_to_out([row])[0]

    def update_requirement(
        self,
        current_user: UserOut,
        requirement_id: str,
        payload: RequirementUpdateRequest,
    ) -> RequirementOut:
        assert current_user.tenant_id is not None
        employee_role, unrestricted = self._scope(current_user)
        row = self.requirements.get_by_id(
            current_user.tenant_id,
            requirement_id,
            current_user.id,
            employee_role,
            unrestricted,
        )
        if row is None:
            raise NotFoundError("Requirement not found")
        requirement, _client, _creator = row
        if not unrestricted and requirement.created_by != current_user.id:
            raise AppError(
                "You can only edit jobs that you created",
                code="FORBIDDEN",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        if self.requirements.get_client(current_user.tenant_id, payload.client_id) is None:
            raise AppError("Select an active client belonging to your organization")
        self._validate_assignments(
            current_user.tenant_id,
            payload.assigned_recruiters,
            payload.assigned_team_leads,
        )

        values = payload.model_dump()
        recruiter_ids = values.pop("assigned_recruiters")
        team_lead_ids = values.pop("assigned_team_leads")
        for key, value in values.items():
            setattr(requirement, key, value.value if hasattr(value, "value") else value)
        requirement.updated_by = current_user.id
        self.requirements.replace_assignments(
            requirement.id, recruiter_ids, team_lead_ids, current_user.id
        )
        self.db.commit()
        return self.get_requirement(current_user, requirement.id)

    def delete_requirement(self, current_user: UserOut, requirement_id: str) -> None:
        assert current_user.tenant_id is not None
        employee_role, unrestricted = self._scope(current_user)
        row = self.requirements.get_by_id(
            current_user.tenant_id,
            requirement_id,
            current_user.id,
            employee_role,
            unrestricted,
        )
        if row is None:
            raise NotFoundError("Requirement not found")
        requirement, _client, _creator = row
        if not unrestricted and requirement.created_by != current_user.id:
            raise AppError(
                "You can only delete jobs that you created",
                code="FORBIDDEN",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        requirement.deleted_at = datetime.now(UTC)
        requirement.deleted_by = current_user.id
        self.db.commit()

    @staticmethod
    def _user_out(user: User, role: str) -> RequirementUserOut:
        return RequirementUserOut(
            id=user.id,
            name=f"{user.first_name} {user.last_name}".strip(),
            email=user.email,
            role=role,
        )

    def _rows_to_out(self, rows: list[JobRow]) -> list[RequirementOut]:
        recruiters, team_leads = self.requirements.get_assignments(
            [requirement.id for requirement, _client, _creator in rows]
        )
        return [
            RequirementOut(
                id=requirement.id,
                tenant_id=requirement.tenant_id,
                job_code=requirement.job_code,
                client_id=requirement.client_id,
                client=RequirementClientOut(
                    id=client.id,
                    client_code=client.client_code,
                    company_name=client.company_name,
                ),
                job_title=requirement.job_title,
                job_type=requirement.job_type,
                employment_type=requirement.employment_type,
                experience_min=requirement.experience_min,
                experience_max=requirement.experience_max,
                skills=requirement.skills,
                positions=requirement.positions,
                location=requirement.location,
                work_mode=requirement.work_mode,
                salary_range=requirement.salary_range,
                priority=requirement.priority,
                status=requirement.status,
                created_by=requirement.created_by,
                creator=self._user_out(creator, "BDM"),
                assigned_recruiters=[
                    self._user_out(user, "RECRUITER") for user in recruiters.get(requirement.id, [])
                ],
                assigned_team_leads=[
                    self._user_out(user, "TEAMLEAD") for user in team_leads.get(requirement.id, [])
                ],
                description=requirement.description,
                created_at=requirement.created_at,
                updated_at=requirement.updated_at,
            )
            for requirement, client, creator in rows
        ]
