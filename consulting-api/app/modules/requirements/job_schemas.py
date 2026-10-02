from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field, field_validator, model_validator


class WorkMode(StrEnum):
    ONSITE = "ONSITE"
    REMOTE = "REMOTE"
    HYBRID = "HYBRID"


class EmploymentType(StrEnum):
    FULL_TIME = "FULL_TIME"
    PART_TIME = "PART_TIME"
    CONTRACT = "CONTRACT"
    TEMPORARY = "TEMPORARY"


class JobPriority(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class JobStatus(StrEnum):
    OPEN = "OPEN"
    ON_HOLD = "ON_HOLD"
    CLOSED = "CLOSED"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"


class RequirementBase(BaseModel):
    client_id: str
    job_title: str = Field(min_length=2, max_length=255)
    job_type: str | None = Field(default=None, max_length=80)
    employment_type: EmploymentType
    experience_min: float = Field(ge=0, le=60)
    experience_max: float = Field(ge=0, le=60)
    skills: list[str] = Field(min_length=1, max_length=50)
    positions: int = Field(ge=1, le=10_000)
    location: str = Field(min_length=2, max_length=255)
    work_mode: WorkMode
    salary_range: str | None = Field(default=None, max_length=120)
    priority: JobPriority
    assigned_recruiters: list[str] = Field(min_length=1, max_length=100)
    assigned_team_leads: list[str] = Field(default_factory=list, max_length=100)
    description: str | None = Field(default=None, max_length=10_000)

    @field_validator(
        "job_title", "job_type", "location", "salary_range", "description", mode="before"
    )
    @classmethod
    def trim_strings(cls, value: str | None) -> str | None:
        return value.strip() if isinstance(value, str) else value

    @field_validator("skills")
    @classmethod
    def normalize_skills(cls, values: list[str]) -> list[str]:
        result: list[str] = []
        seen: set[str] = set()
        for raw in values:
            skill = raw.strip()
            if not skill:
                continue
            key = skill.casefold()
            if key not in seen:
                seen.add(key)
                result.append(skill)
        if not result:
            raise ValueError("At least one skill is required")
        return result

    @field_validator("assigned_recruiters", "assigned_team_leads")
    @classmethod
    def unique_assignments(cls, values: list[str]) -> list[str]:
        return list(dict.fromkeys(values))

    @model_validator(mode="after")
    def validate_experience_range(self) -> "RequirementBase":
        if self.experience_max < self.experience_min:
            raise ValueError(
                "Maximum experience must be greater than or equal to minimum experience"
            )
        return self


class RequirementCreateRequest(RequirementBase):
    pass


class RequirementUpdateRequest(RequirementBase):
    status: JobStatus = JobStatus.OPEN


class RequirementUserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str


class RequirementClientOut(BaseModel):
    id: str
    client_code: str
    company_name: str


class RequirementOut(BaseModel):
    id: str
    tenant_id: str
    job_code: str
    client_id: str
    client: RequirementClientOut
    job_title: str
    job_type: str | None
    employment_type: EmploymentType
    experience_min: float
    experience_max: float
    skills: list[str]
    positions: int
    location: str
    work_mode: WorkMode
    salary_range: str | None
    priority: JobPriority
    status: JobStatus
    created_by: str
    creator: RequirementUserOut
    assigned_recruiters: list[RequirementUserOut]
    assigned_team_leads: list[RequirementUserOut]
    description: str | None
    created_at: datetime
    updated_at: datetime


class RequirementAssigneeOut(RequirementUserOut):
    employee_id: str
