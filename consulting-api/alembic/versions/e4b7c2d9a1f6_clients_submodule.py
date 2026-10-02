"""requirements clients: tenant-scoped client onboarding and audit fields

Revision ID: e4b7c2d9a1f6
Revises: a1c3e7f92b4d
Create Date: 2026-09-30
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "e4b7c2d9a1f6"
down_revision: str | None = "a1c3e7f92b4d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tenants",
        sa.Column("client_sequence", sa.Integer(), server_default="0", nullable=False),
    )

    op.create_table(
        "clients",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=False),
        sa.Column("client_code", sa.String(length=40), nullable=False),
        sa.Column("company_name", sa.String(length=255), nullable=False),
        sa.Column("company_type", sa.String(length=40), nullable=False),
        sa.Column("industry", sa.String(length=120), nullable=True),
        sa.Column("contact_person_name", sa.String(length=150), nullable=False),
        sa.Column("contact_person_email", sa.String(length=255), nullable=False),
        sa.Column("contact_person_phone", sa.String(length=30), nullable=True),
        sa.Column("designation", sa.String(length=120), nullable=True),
        sa.Column("website", sa.String(length=500), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("state", sa.String(length=100), nullable=True),
        sa.Column("country", sa.String(length=100), nullable=True),
        sa.Column("postal_code", sa.String(length=20), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by", sa.String(length=36), nullable=False),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("deleted_by", sa.String(length=36), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "tenant_id", "client_code", name="uq_clients_tenant_id_client_code"
        ),
    )
    op.create_index("ix_clients_tenant_id", "clients", ["tenant_id"])
    op.create_index("ix_clients_status", "clients", ["status"])
    op.create_index("ix_clients_created_by", "clients", ["created_by"])


def downgrade() -> None:
    op.drop_index("ix_clients_created_by", table_name="clients")
    op.drop_index("ix_clients_status", table_name="clients")
    op.drop_index("ix_clients_tenant_id", table_name="clients")
    op.drop_table("clients")
    op.drop_column("tenants", "client_sequence")
