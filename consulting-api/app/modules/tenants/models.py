from datetime import UTC, date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin, new_uuid


class Tenant(Base, TimestampMixin):
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)

    # Company details
    legal_company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tenant_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    # Routable login subdomain, e.g. "acme" for acme.<app_base_domain>.
    subdomain: Mapped[str] = mapped_column(String(63), unique=True, index=True, nullable=False)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tenant_type: Mapped[str] = mapped_column(String(20), nullable=False)
    company_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Location
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    timezone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    currency: Mapped[str | None] = mapped_column(String(10), nullable=True)
    business_address: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Modules & plan
    enabled_modules: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    plan: Mapped[str] = mapped_column(String(50), nullable=False)
    employee_limit: Mapped[int] = mapped_column(Integer, nullable=False)

    # Branding — logo_object_key is a MinIO object key, not a public URL;
    # a presigned URL is generated on read (see TenantService).
    logo_object_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    primary_brand_color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email_sender_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    support_email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    admin_user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="RESTRICT"), unique=True, nullable=False
    )

    # Employee ID generation — e.g. prefix "DOM" + sequence 25 -> "DOM-EMP-00025".
    # employee_sequence only ever increments, so a deleted employee's number
    # is never reused.
    employee_id_prefix: Mapped[str] = mapped_column(String(6), default="", nullable=False)
    employee_sequence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Monotonic tenant-scoped sequence used for generated client codes.
    # It is never decremented, so deleted client codes are never reused.
    client_sequence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Daily tenant-scoped sequence used for JOB-YYYYMMDD-XXX codes.
    job_sequence_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    job_sequence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Tenant-scoped identifiers for candidates and daily submission codes.
    candidate_sequence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    submission_sequence_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    submission_sequence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class TenantInvitation(Base):
    __tablename__ = "tenant_invitations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    tenant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    @property
    def is_accepted(self) -> bool:
        return self.accepted_at is not None
