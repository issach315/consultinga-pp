from datetime import datetime
from enum import StrEnum

from pydantic import AnyHttpUrl, BaseModel, EmailStr, Field, field_validator

from app.core.phone import is_valid_phone


class CompanyType(StrEnum):
    PRIVATE_LIMITED = "PRIVATE_LIMITED"
    PUBLIC_LIMITED = "PUBLIC_LIMITED"
    LLP = "LLP"
    PARTNERSHIP = "PARTNERSHIP"
    SOLE_PROPRIETORSHIP = "SOLE_PROPRIETORSHIP"
    GOVERNMENT = "GOVERNMENT"
    NON_PROFIT = "NON_PROFIT"
    OTHER = "OTHER"


class ClientStatus(StrEnum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class ClientBase(BaseModel):
    company_name: str = Field(min_length=2, max_length=255)
    company_type: CompanyType
    industry: str | None = Field(default=None, max_length=120)
    contact_person_name: str = Field(min_length=2, max_length=150)
    contact_person_email: EmailStr
    contact_person_phone: str | None = Field(default=None, max_length=30)
    designation: str | None = Field(default=None, max_length=120)
    website: AnyHttpUrl | None = None
    address: str | None = Field(default=None, max_length=1000)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    status: ClientStatus = ClientStatus.ACTIVE
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator(
        "company_name",
        "industry",
        "contact_person_name",
        "designation",
        "address",
        "city",
        "state",
        "country",
        "postal_code",
        "notes",
        mode="before",
    )
    @classmethod
    def trim_strings(cls, value: str | None) -> str | None:
        return value.strip() if isinstance(value, str) else value

    @field_validator("contact_person_phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if not is_valid_phone(value):
            raise ValueError("Enter a valid phone number")
        return value.strip() if value else None


class ClientCreateRequest(ClientBase):
    pass


class ClientUpdateRequest(BaseModel):
    company_name: str | None = Field(default=None, min_length=2, max_length=255)
    company_type: CompanyType | None = None
    industry: str | None = Field(default=None, max_length=120)
    contact_person_name: str | None = Field(default=None, min_length=2, max_length=150)
    contact_person_email: EmailStr | None = None
    contact_person_phone: str | None = Field(default=None, max_length=30)
    designation: str | None = Field(default=None, max_length=120)
    website: AnyHttpUrl | None = None
    address: str | None = Field(default=None, max_length=1000)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    status: ClientStatus | None = None
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("contact_person_phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if not is_valid_phone(value):
            raise ValueError("Enter a valid phone number")
        return value.strip() if value else None


class ClientCreatorOut(BaseModel):
    id: str
    name: str
    email: str


class ClientOut(BaseModel):
    id: str
    tenant_id: str
    client_code: str
    company_name: str
    company_type: CompanyType
    industry: str | None
    contact_person_name: str
    contact_person_email: str
    contact_person_phone: str | None
    designation: str | None
    website: str | None
    address: str | None
    city: str | None
    state: str | None
    country: str | None
    postal_code: str | None
    status: ClientStatus
    notes: str | None
    created_by: str
    onboarded_by: ClientCreatorOut
    updated_by: str | None
    deleted_by: str | None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None


class RequirementsStubOut(BaseModel):
    message: str
