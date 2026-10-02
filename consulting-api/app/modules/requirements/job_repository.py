from collections import defaultdict

from sqlalchemy import exists, func, or_, select
from sqlalchemy.orm import Session, aliased

from app.modules.auth.models import User
from app.modules.employees.models import Employee
from app.modules.requirements.job_models import (
    Requirement,
    RequirementMember,
    RequirementRecruiter,
    RequirementTeamLead,
)
from app.modules.requirements.models import Client
from app.modules.tenants.models import Tenant

JobRow = tuple[Requirement, Client, User]


class RequirementRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def lock_tenant(self, tenant_id: str) -> Tenant | None:
        return self.db.scalar(select(Tenant).where(Tenant.id == tenant_id).with_for_update())

    def create(self, requirement: Requirement) -> Requirement:
        self.db.add(requirement)
        self.db.flush()
        return requirement

    def get_client(self, tenant_id: str, client_id: str) -> Client | None:
        return self.db.scalar(
            select(Client).where(
                Client.id == client_id,
                Client.tenant_id == tenant_id,
                Client.deleted_at.is_(None),
                Client.status == "ACTIVE",
            )
        )

    def get_employee_role(self, tenant_id: str, user_id: str) -> str | None:
        return self.db.scalar(
            select(Employee.role).where(
                Employee.tenant_id == tenant_id,
                Employee.user_id == user_id,
                Employee.status == "ACTIVE",
            )
        )

    def list_assignees(self, tenant_id: str, role: str) -> list[tuple[Employee, User]]:
        rows = self.db.execute(
            select(Employee, User)
            .join(User, User.id == Employee.user_id)
            .where(
                Employee.tenant_id == tenant_id,
                Employee.role == role,
                Employee.status == "ACTIVE",
                User.is_active.is_(True),
            )
            .order_by(User.first_name.asc(), User.last_name.asc())
        ).all()
        return [(row[0], row[1]) for row in rows]

    def validate_assignees(
        self, tenant_id: str, user_ids: list[str], role: str
    ) -> list[tuple[Employee, User]]:
        if not user_ids:
            return []
        rows = self.db.execute(
            select(Employee, User)
            .join(User, User.id == Employee.user_id)
            .where(
                Employee.tenant_id == tenant_id,
                Employee.user_id.in_(user_ids),
                Employee.role == role,
                Employee.status == "ACTIVE",
                User.is_active.is_(True),
            )
        ).all()
        return [(row[0], row[1]) for row in rows]

    def replace_assignments(
        self,
        requirement_id: str,
        recruiter_ids: list[str],
        team_lead_ids: list[str],
        assigned_by: str,
    ) -> None:
        self.db.query(RequirementRecruiter).filter(
            RequirementRecruiter.requirement_id == requirement_id
        ).delete(synchronize_session=False)
        self.db.query(RequirementTeamLead).filter(
            RequirementTeamLead.requirement_id == requirement_id
        ).delete(synchronize_session=False)
        self.db.query(RequirementMember).filter(
            RequirementMember.requirement_id == requirement_id,
            RequirementMember.assignment_type.in_(("RECRUITER", "TEAM_LEAD")),
        ).delete(synchronize_session=False)
        self.db.add_all(
            [
                RequirementRecruiter(requirement_id=requirement_id, user_id=user_id)
                for user_id in recruiter_ids
            ]
            + [
                RequirementTeamLead(requirement_id=requirement_id, user_id=user_id)
                for user_id in team_lead_ids
            ]
            + [
                RequirementMember(
                    requirement_id=requirement_id,
                    user_id=user_id,
                    assignment_type="RECRUITER",
                    assigned_by=assigned_by,
                )
                for user_id in recruiter_ids
            ]
            + [
                RequirementMember(
                    requirement_id=requirement_id,
                    user_id=user_id,
                    assignment_type="TEAM_LEAD",
                    assigned_by=assigned_by,
                )
                for user_id in team_lead_ids
            ]
        )

    @staticmethod
    def _visibility_clause(user_id: str, employee_role: str | None):
        del employee_role  # Membership, rather than role names, controls job access.
        member_assignment = exists(
            select(RequirementMember.id).where(
                RequirementMember.requirement_id == Requirement.id,
                RequirementMember.user_id == user_id,
            )
        )
        recruiter_assignment = exists(
            select(RequirementRecruiter.id).where(
                RequirementRecruiter.requirement_id == Requirement.id,
                RequirementRecruiter.user_id == user_id,
            )
        )
        team_lead_assignment = exists(
            select(RequirementTeamLead.id).where(
                RequirementTeamLead.requirement_id == Requirement.id,
                RequirementTeamLead.user_id == user_id,
            )
        )
        return or_(
            Requirement.created_by == user_id,
            member_assignment,
            # Compatibility for databases during rolling migration/backfill.
            recruiter_assignment,
            team_lead_assignment,
        )

    def get_by_id(
        self,
        tenant_id: str,
        requirement_id: str,
        user_id: str,
        employee_role: str | None,
        unrestricted: bool,
    ) -> JobRow | None:
        creator = aliased(User)
        stmt = (
            select(Requirement, Client, creator)
            .join(Client, Client.id == Requirement.client_id)
            .join(creator, creator.id == Requirement.created_by)
            .where(
                Requirement.id == requirement_id,
                Requirement.tenant_id == tenant_id,
                Requirement.deleted_at.is_(None),
            )
        )
        if not unrestricted:
            stmt = stmt.where(self._visibility_clause(user_id, employee_role))
        row = self.db.execute(stmt).one_or_none()
        return (row[0], row[1], row[2]) if row else None

    def list_paginated(
        self,
        tenant_id: str,
        user_id: str,
        employee_role: str | None,
        unrestricted: bool,
        page: int,
        page_size: int,
        search: str | None,
        client_id: str | None,
        status: str | None,
        priority: str | None,
        recruiter_id: str | None,
        team_lead_id: str | None,
        created_by: str | None,
        sort_by: str | None,
        sort_order: str | None,
    ) -> tuple[list[JobRow], int]:
        creator = aliased(User)
        base = (
            select(Requirement, Client, creator)
            .join(Client, Client.id == Requirement.client_id)
            .join(creator, creator.id == Requirement.created_by)
            .where(Requirement.tenant_id == tenant_id, Requirement.deleted_at.is_(None))
        )
        if not unrestricted:
            base = base.where(self._visibility_clause(user_id, employee_role))
        if search:
            pattern = f"%{search.strip()}%"
            base = base.where(
                or_(
                    Requirement.job_code.ilike(pattern),
                    Requirement.job_title.ilike(pattern),
                    Client.company_name.ilike(pattern),
                    Requirement.location.ilike(pattern),
                    creator.first_name.ilike(pattern),
                    creator.last_name.ilike(pattern),
                )
            )
        if client_id:
            base = base.where(Requirement.client_id == client_id)
        if status:
            base = base.where(Requirement.status == status)
        if priority:
            base = base.where(Requirement.priority == priority)
        if created_by:
            base = base.where(Requirement.created_by == created_by)
        if recruiter_id:
            base = base.where(
                exists(
                    select(RequirementRecruiter.id).where(
                        RequirementRecruiter.requirement_id == Requirement.id,
                        RequirementRecruiter.user_id == recruiter_id,
                    )
                )
            )
        if team_lead_id:
            base = base.where(
                exists(
                    select(RequirementTeamLead.id).where(
                        RequirementTeamLead.requirement_id == Requirement.id,
                        RequirementTeamLead.user_id == team_lead_id,
                    )
                )
            )

        total_items = self.db.scalar(select(func.count()).select_from(base.subquery())) or 0
        sort_column = {
            "jobCode": Requirement.job_code,
            "jobTitle": Requirement.job_title,
            "client": Client.company_name,
            "positions": Requirement.positions,
            "location": Requirement.location,
            "workMode": Requirement.work_mode,
            "priority": Requirement.priority,
            "status": Requirement.status,
            "createdAt": Requirement.created_at,
        }.get(sort_by or "createdAt", Requirement.created_at)
        base = base.order_by(sort_column.asc() if sort_order == "asc" else sort_column.desc())
        rows = self.db.execute(base.offset((page - 1) * page_size).limit(page_size)).all()
        return [(row[0], row[1], row[2]) for row in rows], total_items

    def get_assignments(
        self, requirement_ids: list[str]
    ) -> tuple[dict[str, list[User]], dict[str, list[User]]]:
        recruiters: dict[str, list[User]] = defaultdict(list)
        team_leads: dict[str, list[User]] = defaultdict(list)
        if not requirement_ids:
            return recruiters, team_leads

        for requirement_id, user in self.db.execute(
            select(RequirementRecruiter.requirement_id, User)
            .join(User, User.id == RequirementRecruiter.user_id)
            .where(RequirementRecruiter.requirement_id.in_(requirement_ids))
            .order_by(User.first_name.asc(), User.last_name.asc())
        ).all():
            recruiters[requirement_id].append(user)

        for requirement_id, user in self.db.execute(
            select(RequirementTeamLead.requirement_id, User)
            .join(User, User.id == RequirementTeamLead.user_id)
            .where(RequirementTeamLead.requirement_id.in_(requirement_ids))
            .order_by(User.first_name.asc(), User.last_name.asc())
        ).all():
            team_leads[requirement_id].append(user)
        return recruiters, team_leads
