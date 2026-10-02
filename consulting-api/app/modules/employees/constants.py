from enum import StrEnum

PHOTO_CONTENT_TYPES = {"image/png", "image/jpeg", "image/jpg"}
PHOTO_MAX_BYTES = 2 * 1024 * 1024


class PermissionAction(StrEnum):
    CREATE = "CREATE"
    READ = "READ"
    UPDATE = "UPDATE"
    DELETE = "DELETE"


# CREATE/UPDATE/DELETE each imply READ — enforced server-side regardless of
# what the client sends (mirrors the frontend's permission_matrix field).
PERMISSION_ACTION_REQUIRES: dict[PermissionAction, PermissionAction] = {
    PermissionAction.CREATE: PermissionAction.READ,
    PermissionAction.UPDATE: PermissionAction.READ,
    PermissionAction.DELETE: PermissionAction.READ,
}


class EmployeeStatus(StrEnum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    INVITED = "INVITED"


class EmployeeRoleDef:
    def __init__(self, code: str, label: str, tenant_types: list[str]) -> None:
        self.code = code
        self.label = label
        self.tenant_types = tenant_types


# Mirrors consulting-ui/src/features/tenant-admin-employees/constants/roles.ts —
# add a role (or extend its tenant_types) here and on the frontend; nothing
# else needs to change.
EMPLOYEE_ROLE_DEFS: list[EmployeeRoleDef] = [
    EmployeeRoleDef("RECRUITER", "Recruiter", ["Domestic", "Hybrid"]),
    EmployeeRoleDef("BDM", "BDM", ["Domestic", "Hybrid"]),
    EmployeeRoleDef("TEAMLEAD", "Team Lead", ["Domestic", "Hybrid"]),
    EmployeeRoleDef("COORDINATOR", "Coordinator", ["Domestic", "Hybrid"]),
    EmployeeRoleDef("HR", "HR", ["Domestic", "Hybrid"]),
]


def role_codes_for_tenant_type(tenant_type: str) -> set[str]:
    return {role.code for role in EMPLOYEE_ROLE_DEFS if tenant_type in role.tenant_types}


def role_label_for_code(code: str) -> str:
    """Human-readable label for a role code (e.g. "RECRUITER" -> "Recruiter"),
    used in invitation emails. Falls back to the raw code if unrecognized."""
    for role in EMPLOYEE_ROLE_DEFS:
        if role.code == code:
            return role.label
    return code
