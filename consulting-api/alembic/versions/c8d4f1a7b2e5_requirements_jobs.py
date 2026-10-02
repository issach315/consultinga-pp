"""requirements jobs and employee assignments

Revision ID: c8d4f1a7b2e5
Revises: e4b7c2d9a1f6
Create Date: 2026-10-01
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "c8d4f1a7b2e5"
down_revision: str | None = "e4b7c2d9a1f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("tenants", sa.Column("job_sequence_date", sa.Date(), nullable=True))
    op.add_column(
        "tenants", sa.Column("job_sequence", sa.Integer(), server_default="0", nullable=False)
    )

    op.create_table(
        "requirements",
        sa.Column("id", sa.String(length=26), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=False),
        sa.Column("client_id", sa.String(length=36), nullable=False),
        sa.Column("job_code", sa.String(length=40), nullable=False),
        sa.Column("job_title", sa.String(length=255), nullable=False),
        sa.Column("job_type", sa.String(length=80), nullable=True),
        sa.Column("employment_type", sa.String(length=40), nullable=False),
        sa.Column("experience_min", sa.Float(), nullable=False),
        sa.Column("experience_max", sa.Float(), nullable=False),
        sa.Column("skills", sa.JSON(), nullable=False),
        sa.Column("positions", sa.Integer(), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("work_mode", sa.String(length=20), nullable=False),
        sa.Column("salary_range", sa.String(length=120), nullable=True),
        sa.Column("priority", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_by", sa.String(length=36), nullable=False),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("deleted_by", sa.String(length=36), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "job_code", name="uq_requirements_tenant_job_code"),
    )
    op.create_index("ix_requirements_tenant_id", "requirements", ["tenant_id"])
    op.create_index("ix_requirements_client_id", "requirements", ["client_id"])
    op.create_index("ix_requirements_job_title", "requirements", ["job_title"])
    op.create_index("ix_requirements_priority", "requirements", ["priority"])
    op.create_index("ix_requirements_status", "requirements", ["status"])
    op.create_index("ix_requirements_created_by", "requirements", ["created_by"])

    op.create_table(
        "requirement_recruiters",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("requirement_id", sa.String(length=26), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["requirement_id"], ["requirements.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "requirement_id", "user_id", name="uq_requirement_recruiters_requirement_user"
        ),
    )
    op.create_index(
        "ix_requirement_recruiters_requirement_id",
        "requirement_recruiters",
        ["requirement_id"],
    )
    op.create_index("ix_requirement_recruiters_user_id", "requirement_recruiters", ["user_id"])

    op.create_table(
        "requirement_team_leads",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("requirement_id", sa.String(length=26), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["requirement_id"], ["requirements.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "requirement_id", "user_id", name="uq_requirement_team_leads_requirement_user"
        ),
    )
    op.create_index(
        "ix_requirement_team_leads_requirement_id",
        "requirement_team_leads",
        ["requirement_id"],
    )
    op.create_index("ix_requirement_team_leads_user_id", "requirement_team_leads", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_requirement_team_leads_user_id", table_name="requirement_team_leads")
    op.drop_index(
        "ix_requirement_team_leads_requirement_id", table_name="requirement_team_leads"
    )
    op.drop_table("requirement_team_leads")
    op.drop_index("ix_requirement_recruiters_user_id", table_name="requirement_recruiters")
    op.drop_index(
        "ix_requirement_recruiters_requirement_id", table_name="requirement_recruiters"
    )
    op.drop_table("requirement_recruiters")
    op.drop_index("ix_requirements_created_by", table_name="requirements")
    op.drop_index("ix_requirements_status", table_name="requirements")
    op.drop_index("ix_requirements_priority", table_name="requirements")
    op.drop_index("ix_requirements_job_title", table_name="requirements")
    op.drop_index("ix_requirements_client_id", table_name="requirements")
    op.drop_index("ix_requirements_tenant_id", table_name="requirements")
    op.drop_table("requirements")
    op.drop_column("tenants", "job_sequence")
    op.drop_column("tenants", "job_sequence_date")
