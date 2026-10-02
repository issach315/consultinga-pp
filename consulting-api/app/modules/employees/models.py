from datetime import date

from sqlalchemy import JSON, Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin, new_uuid


class Employee(Base, TimestampMixin):
    __tablename__ = "employees"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)

    tenant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # One login per employee — the linked User carries name/email/credentials;
    # Employee itself only carries employment-specific attributes.
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    employee_code: Mapped[str] = mapped_column(String(30), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    # list[{"module": str, "actions": list[str]}]
    permissions: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)

    # Profile
    preferred_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    personal_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(30), nullable=True)
    address_line: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    profile_photo_key: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Employment
    joining_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    designation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    employment_type: Mapped[str | None] = mapped_column(String(30), nullable=True)
    work_location: Mapped[str | None] = mapped_column(String(100), nullable=True)
    work_mode: Mapped[str | None] = mapped_column(String(30), nullable=True)
    reporting_manager_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
