from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin, new_uuid


class Client(Base, TimestampMixin):
    __tablename__ = "clients"
    __table_args__ = (
        UniqueConstraint("tenant_id", "client_code", name="uq_clients_tenant_id_client_code"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    tenant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    client_code: Mapped[str] = mapped_column(String(40), nullable=False)

    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    company_type: Mapped[str] = mapped_column(String(40), nullable=False)
    industry: Mapped[str | None] = mapped_column(String(120), nullable=True)
    contact_person_name: Mapped[str] = mapped_column(String(150), nullable=False)
    contact_person_email: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_person_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    designation: Mapped[str | None] = mapped_column(String(120), nullable=True)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # created_by is the user (normally a BDM) who onboarded the client.
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
