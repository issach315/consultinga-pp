from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.modules.auth.models import User
from app.modules.employees.models import Employee


class EmployeeRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, employee: Employee) -> Employee:
        self.db.add(employee)
        self.db.flush()
        return employee

    def get_by_id(self, tenant_id: str, employee_id: str) -> Employee | None:
        stmt = select(Employee).where(Employee.tenant_id == tenant_id, Employee.id == employee_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_user_id(self, user_id: str) -> Employee | None:
        stmt = select(Employee).where(Employee.user_id == user_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_status_counts(self, tenant_id: str) -> dict[str, int]:
        stmt = (
            select(Employee.status, func.count())
            .where(Employee.tenant_id == tenant_id)
            .group_by(Employee.status)
        )
        return dict(self.db.execute(stmt).all())

    def get_permissions_for_tenant(self, tenant_id: str) -> list[list[dict]]:
        stmt = select(Employee.permissions).where(Employee.tenant_id == tenant_id)
        return list(self.db.execute(stmt).scalars().all())

    def list_paginated(
        self,
        tenant_id: str,
        page: int,
        page_size: int,
        search: str | None,
        roles: list[str] | None,
        statuses: list[str] | None,
        sort_by: str | None,
        sort_order: str | None,
    ) -> tuple[list[tuple[Employee, User]], int]:
        base = (
            select(Employee, User)
            .join(User, User.id == Employee.user_id)
            .where(Employee.tenant_id == tenant_id)
        )

        if search:
            pattern = f"%{search}%"
            base = base.where(
                or_(
                    User.first_name.ilike(pattern),
                    User.last_name.ilike(pattern),
                    User.email.ilike(pattern),
                    Employee.employee_code.ilike(pattern),
                )
            )
        if roles:
            base = base.where(Employee.role.in_(roles))
        if statuses:
            base = base.where(Employee.status.in_(statuses))

        total_items = self.db.execute(
            select(func.count()).select_from(base.subquery())
        ).scalar_one()

        sort_column = {
            "employeeId": Employee.employee_code,
            "employee": User.first_name,
            "email": User.email,
            "role": Employee.role,
            "status": Employee.status,
            "createdAt": Employee.created_at,
        }.get(sort_by or "createdAt", Employee.created_at)
        base = base.order_by(sort_column.asc() if sort_order == "asc" else sort_column.desc())
        base = base.offset((page - 1) * page_size).limit(page_size)

        rows = self.db.execute(base).all()
        return [(row[0], row[1]) for row in rows], total_items
