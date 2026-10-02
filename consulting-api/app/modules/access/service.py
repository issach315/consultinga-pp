from sqlalchemy.orm import Session

from app.modules.access.schemas import EffectiveAccessOut, ModuleAccessOut
from app.modules.auth.constants import RoleCode
from app.modules.auth.schemas import UserOut
from app.modules.employees.constants import PermissionAction
from app.modules.employees.models import Employee
from app.modules.employees.repository import EmployeeRepository
from app.modules.requirements.constants import REQUIREMENTS_MODULE_KEY, REQUIREMENTS_SUB_MODULE_KEYS
from app.modules.tenants.constants import MODULE_KEYS
from app.modules.tenants.repository import TenantRepository

# Registry of hierarchical modules -> their sub-module keys. Every module NOT
# listed here is treated as flat (a single implicit "sub-module" keyed by its
# own module key) — see compute_effective_access. Requirements is the only
# hierarchical module this phase; if a second one ships, this is the one
# place a new entry needs adding.
HIERARCHICAL_MODULES: dict[str, list[str]] = {REQUIREMENTS_MODULE_KEY: REQUIREMENTS_SUB_MODULE_KEYS}


class AccessService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.tenants = TenantRepository(db)
        self.employees = EmployeeRepository(db)

    def compute_effective_access(self, current_user: UserOut) -> EffectiveAccessOut:
        """The single canonical computation of what a user can see/do,
        combining the tenant's enabled modules with the employee's granted
        (sub-)module permissions, across every module the tenant can
        enable — not just Requirements. Tenant Admins get automatic full
        CRUD access (they own the tenant); everyone else is gated strictly
        by their Employee.permissions grants. Super admins (no tenant_id)
        have no tenant context, so no module applies to them."""
        if current_user.tenant_id is None:
            return EffectiveAccessOut(modules={})

        tenant = self.tenants.get_by_id(current_user.tenant_id)
        if tenant is None:
            return EffectiveAccessOut(modules={})

        is_tenant_admin = RoleCode.TENANT_ADMIN in {role.code for role in current_user.roles}
        employee = None if is_tenant_admin else self.employees.get_by_user_id(current_user.id)

        modules: dict[str, ModuleAccessOut] = {}
        for module_key in MODULE_KEYS:
            enabled = module_key in tenant.enabled_modules
            # Hierarchical modules (Requirements) expose one sub-module entry
            # per real sub-module; every other (flat) module is represented
            # as a single implicit sub-module keyed by its own module key,
            # matched against Employee.permissions entries with sub_module=None.
            sub_keys = HIERARCHICAL_MODULES.get(module_key, [None])
            sub_modules: dict[str, list[str]] = {}
            for sub_key in sub_keys:
                dict_key = sub_key if sub_key is not None else module_key
                if not enabled:
                    # Tenant gate always wins, even if the employee has a
                    # stored grant for this module.
                    sub_modules[dict_key] = []
                elif is_tenant_admin:
                    sub_modules[dict_key] = [action.value for action in PermissionAction]
                else:
                    sub_modules[dict_key] = self._employee_actions(employee, module_key, sub_key)
            modules[module_key] = ModuleAccessOut(enabled=enabled, sub_modules=sub_modules)

        return EffectiveAccessOut(modules=modules)

    @staticmethod
    def _employee_actions(
        employee: Employee | None, module_key: str, sub_module_key: str | None
    ) -> list[str]:
        if employee is None:
            return []
        for entry in employee.permissions:
            if entry.get("module") == module_key and entry.get("sub_module") == sub_module_key:
                return list(entry.get("actions", []))
        return []

    def module_enabled(self, current_user: UserOut, module_key: str) -> bool:
        if current_user.tenant_id is None:
            return False
        tenant = self.tenants.get_by_id(current_user.tenant_id)
        return tenant is not None and module_key in tenant.enabled_modules

    def has_permission(
        self, current_user: UserOut, module_key: str, sub_module_key: str, action: PermissionAction
    ) -> bool:
        module = self.compute_effective_access(current_user).modules.get(module_key)
        allowed_actions = module.sub_modules.get(sub_module_key, []) if module else []
        return bool(module and module.enabled and action.value in allowed_actions)
