from enum import StrEnum


class RoleCode(StrEnum):
    SUPER_ADMIN = "SUPER_ADMIN"
    TENANT_ADMIN = "TENANT_ADMIN"
    EMPLOYEE = "EMPLOYEE"


SEED_ROLES: list[dict[str, str]] = [
    {
        "code": RoleCode.SUPER_ADMIN.value,
        "name": "Super Admin",
        "description": "Full access across the entire platform.",
    },
    {
        "code": RoleCode.TENANT_ADMIN.value,
        "name": "Tenant Admin",
        "description": "Administrative access within a single tenant.",
    },
    {
        "code": RoleCode.EMPLOYEE.value,
        "name": "Employee",
        "description": "Standard employee access within a single tenant.",
    },
]
