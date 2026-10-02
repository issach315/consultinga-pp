"""employees: add profile, employment and reporting-manager fields

Revision ID: a1c3e7f92b4d
Revises: d6a1e9f4c7b2
Create Date: 2026-08-07

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "a1c3e7f92b4d"
down_revision: str | None = "d6a1e9f4c7b2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("employees", sa.Column("preferred_name", sa.String(length=100), nullable=True))
    op.add_column("employees", sa.Column("personal_email", sa.String(length=255), nullable=True))
    op.add_column("employees", sa.Column("phone", sa.String(length=30), nullable=True))
    op.add_column("employees", sa.Column("date_of_birth", sa.Date(), nullable=True))
    op.add_column("employees", sa.Column("gender", sa.String(length=30), nullable=True))
    op.add_column("employees", sa.Column("address_line", sa.String(length=255), nullable=True))
    op.add_column("employees", sa.Column("city", sa.String(length=100), nullable=True))
    op.add_column("employees", sa.Column("state", sa.String(length=100), nullable=True))
    op.add_column("employees", sa.Column("postal_code", sa.String(length=20), nullable=True))
    op.add_column("employees", sa.Column("profile_photo_key", sa.String(length=255), nullable=True))

    op.add_column("employees", sa.Column("joining_date", sa.Date(), nullable=True))
    op.add_column("employees", sa.Column("department", sa.String(length=100), nullable=True))
    op.add_column("employees", sa.Column("designation", sa.String(length=100), nullable=True))
    op.add_column("employees", sa.Column("employment_type", sa.String(length=30), nullable=True))
    op.add_column("employees", sa.Column("work_location", sa.String(length=100), nullable=True))
    op.add_column("employees", sa.Column("work_mode", sa.String(length=30), nullable=True))
    op.add_column(
        "employees",
        sa.Column(
            "reporting_manager_id",
            sa.String(length=36),
            sa.ForeignKey("employees.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("employees", "reporting_manager_id")
    op.drop_column("employees", "work_mode")
    op.drop_column("employees", "work_location")
    op.drop_column("employees", "employment_type")
    op.drop_column("employees", "designation")
    op.drop_column("employees", "department")
    op.drop_column("employees", "joining_date")

    op.drop_column("employees", "profile_photo_key")
    op.drop_column("employees", "postal_code")
    op.drop_column("employees", "state")
    op.drop_column("employees", "city")
    op.drop_column("employees", "address_line")
    op.drop_column("employees", "gender")
    op.drop_column("employees", "date_of_birth")
    op.drop_column("employees", "phone")
    op.drop_column("employees", "personal_email")
    op.drop_column("employees", "preferred_name")
