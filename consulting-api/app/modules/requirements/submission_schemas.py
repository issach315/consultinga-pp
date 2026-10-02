from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class CandidateStatus(StrEnum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class SubmissionStatus(StrEnum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    SHORTLISTED = "SHORTLISTED"
    INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED"
    OFFERED = "OFFERED"
    PLACED = "PLACED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"


class EmploymentHistoryItem(BaseModel):
    company_name: str = Field(min_length=2, max_length=255)
    designation: str = Field(min_length=2, max_length=255)
    employment_type: str = Field(default="FULL_TIME", max_length=40)
    start_date: date
    end_date: date | None = None
    is_current: bool = False

    @model_validator(mode="after")
    def validate_dates(self) -> "EmploymentHistoryItem":
        if self.end_date and self.end_date < self.start_date:
            raise ValueError("Employment end date cannot be before start date")
        if self.is_current and self.end_date is not None:
            raise ValueError("A current employment record cannot have an end date")
        return self


class CandidateCreateRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    current_location: str | None = Field(default=None, max_length=255)
    total_experience: float = Field(default=0, ge=0, le=60)
    employment_history: list[EmploymentHistoryItem] = Field(default_factory=list, max_length=30)
    resume_object_key: str | None = Field(default=None, max_length=500)
    resume_file_name: str | None = Field(default=None, max_length=255)

    @field_validator("first_name", "last_name", "phone", "current_location", mode="before")
    @classmethod
    def trim_strings(cls, value: str | None) -> str | None:
        return value.strip() if isinstance(value, str) else value


class CandidateOut(BaseModel):
    id: str
    tenant_id: str
    candidate_code: str
    first_name: str
    last_name: str
    full_name: str
    email: str
    phone: str
    current_location: str | None
    total_experience: float
    employment_history: list[EmploymentHistoryItem]
    resume_object_key: str | None
    resume_file_name: str | None
    resume_version: int
    status: CandidateStatus
    created_at: datetime


class SubmissionCreateRequest(BaseModel):
    candidate_id: str
    relevant_experience: float = Field(ge=0, le=60)
    current_ctc: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    expected_ctc: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    ctc_currency: str = Field(default="INR", min_length=3, max_length=10)
    ctc_period: str = Field(default="ANNUAL", pattern="^(ANNUAL|MONTHLY|HOURLY)$")
    notice_period_days: int = Field(ge=0, le=730)
    resume_object_key: str | None = Field(default=None, max_length=500)
    resume_file_name: str | None = Field(default=None, max_length=255)
    notes: str | None = Field(default=None, max_length=5000)

    @field_validator("ctc_currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.strip().upper()


class SubmissionStatusUpdateRequest(BaseModel):
    status: SubmissionStatus
    comments: str | None = Field(default=None, max_length=5000)


class SubmissionUserOut(BaseModel):
    id: str
    name: str
    email: str


class CandidateSnapshotOut(BaseModel):
    candidate_code: str
    name: str
    email: str
    phone: str
    current_location: str | None
    total_experience: float
    employment_history: list[EmploymentHistoryItem]


class SubmissionStatusHistoryOut(BaseModel):
    id: str
    from_status: SubmissionStatus | None
    to_status: SubmissionStatus
    changed_by: str
    comments: str | None
    changed_at: datetime


class SubmissionOut(BaseModel):
    id: str
    submission_code: str
    tenant_id: str
    requirement_id: str
    job_code: str
    job_title: str
    candidate_id: str
    candidate: CandidateSnapshotOut
    relevant_experience: float
    current_ctc: Decimal | None
    expected_ctc: Decimal | None
    ctc_currency: str
    ctc_period: str
    notice_period_days: int
    resume_object_key: str | None
    resume_file_name: str | None
    resume_version: int
    submitted_by: str
    submitter: SubmissionUserOut
    submitter_role_snapshot: str
    status: SubmissionStatus
    notes: str | None
    status_history: list[SubmissionStatusHistoryOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
