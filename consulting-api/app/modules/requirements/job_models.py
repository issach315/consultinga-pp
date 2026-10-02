from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin, new_ulid, new_uuid


class Requirement(Base, TimestampMixin):
    __tablename__ = "requirements"
    __table_args__ = (
        UniqueConstraint("tenant_id", "job_code", name="uq_requirements_tenant_job_code"),
    )

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_ulid)
    tenant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    client_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    job_code: Mapped[str] = mapped_column(String(40), nullable=False)
    job_title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    job_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    employment_type: Mapped[str] = mapped_column(String(40), nullable=False)
    experience_min: Mapped[float] = mapped_column(Float, nullable=False)
    experience_max: Mapped[float] = mapped_column(Float, nullable=False)
    skills: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    positions: Mapped[int] = mapped_column(Integer, nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    work_mode: Mapped[str] = mapped_column(String(20), nullable=False)
    salary_range: Mapped[str | None] = mapped_column(String(120), nullable=True)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    updated_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    deleted_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class RequirementRecruiter(Base):
    __tablename__ = "requirement_recruiters"
    __table_args__ = (
        UniqueConstraint(
            "requirement_id", "user_id", name="uq_requirement_recruiters_requirement_user"
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    requirement_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )


class RequirementTeamLead(Base):
    __tablename__ = "requirement_team_leads"
    __table_args__ = (
        UniqueConstraint(
            "requirement_id", "user_id", name="uq_requirement_team_leads_requirement_user"
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    requirement_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )


class RequirementMember(Base):
    """Role-neutral job membership used by access checks and future assignment types."""

    __tablename__ = "requirement_members"
    __table_args__ = (
        UniqueConstraint(
            "requirement_id",
            "user_id",
            "assignment_type",
            name="uq_requirement_members_requirement_user_type",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    requirement_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    assignment_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    assigned_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
