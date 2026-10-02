from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.phone import is_valid_phone
from app.modules.employees.constants import EmployeeStatus, PermissionAction


class EmployeePermissionIn(BaseModel):
    module: str
    sub_module: str | None = None
    actions: list[PermissionAction] = Field(default_factory=list)


class EmployeeCreateRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    work_email: EmailStr
    role: str = Field(min_length=1, max_length=50)
    permissions: list[EmployeePermissionIn] = Field(default_factory=list)

    # Profile and employment fields below are all optional at the API layer —
    # the bulk-register flow (BulkEmployeeDialog) shares this same request
    # shape and only ever sends the fields above. The single-employee
    # onboarding wizard enforces its own required subset (joining date,
    # department, designation, employment type) client-side via zod before
    # ever submitting.
    joining_date: date | None = None
    department: str | None = Field(default=None, max_length=100)
    designation: str | None = Field(default=None, max_length=100)
    employment_type: str | None = Field(default=None, max_length=30)
    work_location: str | None = Field(default=None, max_length=100)
    work_mode: str | None = Field(default=None, max_length=30)
    reporting_manager_id: str | None = None

    preferred_name: str | None = Field(default=None, max_length=100)
    personal_email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=30)
    address_line: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    profile_photo_key: str | None = Field(default=None, max_length=255)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if not is_valid_phone(value):
            raise ValueError("Enter a valid phone number")
        return value


class EmployeeUpdateRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    role: str = Field(min_length=1, max_length=50)

    # All optional and unset by default — the quick-edit dialog only ever
    # sends the four fields above, and the service layer only applies
    # fields the caller actually included (exclude_unset), so an old-style
    # request body never wipes out an employee's employment/profile data.
    joining_date: date | None = None
    department: str | None = Field(default=None, max_length=100)
    designation: str | None = Field(default=None, max_length=100)
    employment_type: str | None = Field(default=None, max_length=30)
    work_location: str | None = Field(default=None, max_length=100)
    work_mode: str | None = Field(default=None, max_length=30)
    reporting_manager_id: str | None = None

    preferred_name: str | None = Field(default=None, max_length=100)
    personal_email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=30)
    address_line: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    profile_photo_key: str | None = Field(default=None, max_length=255)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        if not is_valid_phone(value):
            raise ValueError("Enter a valid phone number")
        return value


class EmployeeStatusUpdateRequest(BaseModel):
    status: EmployeeStatus


class EmployeePermissionsUpdateRequest(BaseModel):
    permissions: list[EmployeePermissionIn] = Field(default_factory=list)


class EmployeeOut(BaseModel):
    id: str
    tenant_id: str
    employee_code: str
    first_name: str
    last_name: str
    email: str
    role: str
    status: EmployeeStatus
    permissions: list[EmployeePermissionIn]
    created_at: datetime
    updated_at: datetime

    joining_date: date | None = None
    department: str | None = None
    designation: str | None = None
    employment_type: str | None = None
    work_location: str | None = None
    work_mode: str | None = None
    reporting_manager_id: str | None = None

    preferred_name: str | None = None
    personal_email: str | None = None
    phone: str | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    address_line: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    profile_photo_url: str | None = None

    # None means "no invite email was attempted in this request" (e.g. a
    # plain GET/list); True/False reflects the actual SMTP outcome for
    # requests that do attempt to send one (create, bulk create, reissue).
    invite_email_sent: bool | None = None


class EmployeePhotoUploadResponse(BaseModel):
    photo_object_key: str
    preview_url: str


class BulkEmployeeCreateRequest(BaseModel):
    employees: list[EmployeeCreateRequest] = Field(min_length=1, max_length=50)


class BulkEmployeeResultOut(BaseModel):
    index: int
    status: Literal["created", "failed"]
    employee: EmployeeOut | None = None
    error: str | None = None


class BulkEmployeeCreateResponse(BaseModel):
    results: list[BulkEmployeeResultOut]
    created_count: int
    failed_count: int


class EmployeeSummaryOut(BaseModel):
    total: int
    active: int
    invited: int
    inactive: int
    avg_permission_grant_pct: float
