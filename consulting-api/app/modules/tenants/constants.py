from enum import StrEnum


class TenantPlan(StrEnum):
    STARTER = "Starter"
    PROFESSIONAL = "Professional"
    ENTERPRISE = "Enterprise"


class TenantType(StrEnum):
    DOMESTIC = "Domestic"
    US_IT = "US IT"
    HYBRID = "Hybrid"


PLAN_DEFS: dict[TenantPlan, dict[str, int]] = {
    TenantPlan.STARTER: {"min": 1, "max": 50, "default": 25},
    TenantPlan.PROFESSIONAL: {"min": 50, "max": 250, "default": 150},
    TenantPlan.ENTERPRISE: {"min": 250, "max": 2000, "default": 500},
}

MODULE_KEYS: list[str] = [
    "recruitment",
    "employees",
    "attendance",
    "payroll",
    "events",
    "invoices",
    "clients",
    "reports",
    "requirements",
]

LOGO_CONTENT_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/svg+xml"}
LOGO_MAX_BYTES = 2 * 1024 * 1024

SUBDOMAIN_PATTERN = r"^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"
SUBDOMAIN_MIN_LENGTH = 3
SUBDOMAIN_MAX_LENGTH = 30
RESERVED_SUBDOMAINS = {"www", "api", "app", "admin", "mail", "static", "assets", "localhost"}
