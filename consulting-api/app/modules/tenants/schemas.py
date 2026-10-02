import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.core.phone import is_valid_phone
from app.modules.tenants.constants import (
    MODULE_KEYS,
    PLAN_DEFS,
    RESERVED_SUBDOMAINS,
    SUBDOMAIN_MAX_LENGTH,
    SUBDOMAIN_MIN_LENGTH,
    SUBDOMAIN_PATTERN,
    TenantPlan,
    TenantType,
)


class TenantCompanyDetailsIn(BaseModel):
    legal_company_name: str = Field(min_length=1, max_length=255)
    display_name: str | None = None
    tenant_code: str = Field(min_length=1, max_length=50)
    subdomain: str = Field(min_length=SUBDOMAIN_MIN_LENGTH, max_length=SUBDOMAIN_MAX_LENGTH)
    industry: str | None = None
    tenant_type: TenantType
    company_email: EmailStr | None = None
    phone: str | None = None
    website: str | None = None

    @field_validator("subdomain")
    @classmethod
    def _validate_subdomain(cls, value: str) -> str:
        slug = value.strip().lower()
        if not re.match(SUBDOMAIN_PATTERN, slug):
            raise ValueError(
                "Subdomain may only contain lowercase letters, numbers, and hyphens, "
                "and can't start or end with a hyphen"
            )
        if slug in RESERVED_SUBDOMAINS:
            raise ValueError(f"'{slug}' is a reserved subdomain")
        return slug

    @field_validator("phone")
    @classmethod
    def _validate_phone(cls, value: str | None) -> str | None:
        if not is_valid_phone(value):
            raise ValueError("Enter a valid phone number")
        return value


class TenantLocationIn(BaseModel):
    country: str | None = None
    state: str | None = None
    city: str | None = None
    postal_code: str | None = None
    timezone: str | None = None
    currency: str | None = None
    business_address: str | None = None


class TenantAdminIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    work_email: EmailStr
    job_title: str | None = None
    phone: str | None = None

    @field_validator("phone")
    @classmethod
    def _validate_phone(cls, value: str | None) -> str | None:
        if not is_valid_phone(value):
            raise ValueError("Enter a valid phone number")
        return value


class TenantConfigurationIn(BaseModel):
    plan: TenantPlan
    employee_limit: int = Field(gt=0)

    @model_validator(mode="after")
    def _validate_employee_limit(self) -> "TenantConfigurationIn":
        bounds = PLAN_DEFS[self.plan]
        if not (bounds["min"] <= self.employee_limit <= bounds["max"]):
            raise ValueError(
                f"Employee limit must be between {bounds['min']} and {bounds['max']} "
                f"for the {self.plan.value} plan"
            )
        return self


class TenantBrandingIn(BaseModel):
    logo_object_key: str | None = None
    primary_brand_color: str | None = None
    email_sender_name: str | None = None
    support_email: EmailStr | None = None


class TenantMutableFieldsIn(BaseModel):
    """Fields shared by create and update requests — everything except the
    tenant admin identity, which create provisions once and update doesn't touch."""

    company_details: TenantCompanyDetailsIn
    location: TenantLocationIn = TenantLocationIn()
    modules: list[str] = Field(default_factory=list)
    configuration: TenantConfigurationIn
    branding: TenantBrandingIn = TenantBrandingIn()

    @field_validator("modules")
    @classmethod
    def _validate_modules(cls, value: list[str]) -> list[str]:
        invalid = set(value) - set(MODULE_KEYS)
        if invalid:
            raise ValueError(f"Unknown module(s): {', '.join(sorted(invalid))}")
        return value


class TenantCreateRequest(TenantMutableFieldsIn):
    tenant_admin: TenantAdminIn


class TenantUpdateRequest(TenantMutableFieldsIn):
    is_active: bool = True


class TenantStatusUpdateRequest(BaseModel):
    is_active: bool


class TenantOut(BaseModel):
    id: str
    legal_company_name: str
    display_name: str | None
    tenant_code: str
    subdomain: str
    industry: str | None
    tenant_type: str
    company_email: str | None
    phone: str | None
    website: str | None
    country: str | None
    state: str | None
    city: str | None
    postal_code: str | None
    timezone: str | None
    currency: str | None
    business_address: str | None
    enabled_modules: list[str]
    plan: str
    employee_limit: int
    employee_id_prefix: str
    logo_url: str | None
    logo_object_key: str | None
    primary_brand_color: str | None
    email_sender_name: str | None
    support_email: str | None
    is_active: bool
    admin_first_name: str
    admin_last_name: str
    admin_email: str
    created_at: datetime
    updated_at: datetime

    # None means "no invite email was attempted in this request"; True/False
    # reflects the actual SMTP outcome for requests that do attempt one
    # (create_tenant).
    invite_email_sent: bool | None = None


class TenantListItemOut(BaseModel):
    id: str
    legal_company_name: str
    tenant_code: str
    subdomain: str
    plan: str
    employee_limit: int
    admin_email: str
    is_active: bool
    created_at: datetime


class LogoUploadResponse(BaseModel):
    logo_object_key: str
    preview_url: str


class InvitationDetailOut(BaseModel):
    email: str
    first_name: str
    last_name: str
    tenant_name: str
    # The invited user's role name (e.g. "Tenant Admin", "Employee") — lets
    # the accept-invite page greet any invited role generically.
    role_name: str
    expires_at: datetime


class AcceptInvitationRequest(BaseModel):
    password: str = Field(min_length=8, max_length=128)


class TenantEmployeeIdPrefixUpdateRequest(BaseModel):
    employee_id_prefix: str = Field(min_length=2, max_length=6, pattern=r"^[A-Z]{2,6}$")
