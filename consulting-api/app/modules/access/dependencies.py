from fastapi import Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import AppError
from app.modules.access.service import AccessService
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserOut
from app.modules.employees.constants import PermissionAction


def get_access_service(db: Session = Depends(get_db)) -> AccessService:
    return AccessService(db)


def require_module(module_key: str):
    """Dependency factory: restrict an endpoint to tenants that have the
    given module enabled. Mirrors require_roles' factory shape."""

    def _check(
        current_user: UserOut = Depends(get_current_user),
        access_service: AccessService = Depends(get_access_service),
    ) -> UserOut:
        if not access_service.module_enabled(current_user, module_key):
            raise AppError(
                "This module is not enabled for your organization",
                code="MODULE_DISABLED",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        return current_user

    return _check


def require_permission(module_key: str, sub_module_key: str, action: PermissionAction):
    """Dependency factory: restrict an endpoint to users whose effective
    access grants the given sub-module action. Composes on top of
    require_module so the tenant-module gate is always checked first."""

    def _check(
        current_user: UserOut = Depends(require_module(module_key)),
        access_service: AccessService = Depends(get_access_service),
    ) -> UserOut:
        if not access_service.has_permission(current_user, module_key, sub_module_key, action):
            raise AppError(
                "You do not have permission to perform this action",
                code="FORBIDDEN",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        return current_user

    return _check
