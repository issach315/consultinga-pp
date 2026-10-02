from fastapi import Depends
from sqlalchemy.orm import Session

from app.common.dependencies import require_roles
from app.core.database import get_db
from app.core.exceptions import AppError
from app.modules.auth.constants import RoleCode
from app.modules.auth.schemas import UserOut
from app.modules.employees.service import EmployeeService


def get_employee_service(db: Session = Depends(get_db)) -> EmployeeService:
    return EmployeeService(db)


def require_own_tenant(
    tenant_id: str,
    current_user: UserOut = Depends(require_roles(RoleCode.TENANT_ADMIN)),
) -> UserOut:
    """Restricts a nested /tenants/{tenant_id}/employees/* route to the
    Tenant Admin who actually owns that tenant — require_roles alone only
    checks the role, not which tenant it applies to."""
    if current_user.tenant_id != tenant_id:
        raise AppError(
            "You do not have permission to manage this tenant's employees",
            code="FORBIDDEN",
            status_code=403,
        )
    return current_user
