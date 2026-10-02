from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import (
    JSON,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin, new_ulid


class Candidate(Base, TimestampMixin):
    __tablename__ = "candidates"
    __table_args__ = (
        UniqueConstraint("tenant_id", "candidate_code", name="uq_candidates_tenant_code"),
        Index("ix_candidates_tenant_email", "tenant_id", "email"),
    )

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_ulid)
    tenant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    candidate_code: Mapped[str] = mapped_column(String(40), nullable=False)
    first_name: Mapped[str] = mapped_column(String(120), nullable=False)
    last_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    current_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    total_experience: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    employment_history: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)
    resume_object_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    resume_file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    resume_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE", nullable=False, index=True)
    created_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    updated_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    deleted_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Submission(Base, TimestampMixin):
    __tablename__ = "submissions"
    __table_args__ = (
        UniqueConstraint("tenant_id", "submission_code", name="uq_submissions_tenant_code"),
        Index("ix_submissions_tenant_requirement", "tenant_id", "requirement_id"),
        Index("ix_submissions_requirement_candidate", "requirement_id", "candidate_id"),
    )

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_ulid)
    submission_code: Mapped[str] = mapped_column(String(40), nullable=False)
    tenant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    requirement_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    candidate_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("candidates.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    candidate_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    relevant_experience: Mapped[float] = mapped_column(Float, nullable=False)
    current_ctc: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    expected_ctc: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    ctc_currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    ctc_period: Mapped[str] = mapped_column(String(20), default="ANNUAL", nullable=False)
    notice_period_days: Mapped[int] = mapped_column(Integer, nullable=False)
    resume_object_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    resume_file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    resume_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    submitted_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    submitter_role_snapshot: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="SUBMITTED", nullable=False, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    deleted_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SubmissionStatusHistory(Base):
    __tablename__ = "submission_status_history"

    id: Mapped[str] = mapped_column(String(26), primary_key=True, default=new_ulid)
    submission_id: Mapped[str] = mapped_column(
        String(26), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    from_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    to_status: Mapped[str] = mapped_column(String(30), nullable=False)
    changed_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
