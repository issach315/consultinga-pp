"""tenants module: tenants, tenant_invitations, users.tenant_id

Revision ID: 7c1e2f9a3b4d
Revises: fbf0c97f8e43
Create Date: 2026-08-05

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "7c1e2f9a3b4d"
down_revision: str | None = "fbf0c97f8e43"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tenants",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("legal_company_name", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=True),
        sa.Column("tenant_code", sa.String(length=50), nullable=False),
        sa.Column("industry", sa.String(length=100), nullable=True),
        sa.Column("company_email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("website", sa.String(length=255), nullable=True),
        sa.Column("country", sa.String(length=100), nullable=True),
        sa.Column("state", sa.String(length=100), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("postal_code", sa.String(length=20), nullable=True),
        sa.Column("timezone", sa.String(length=100), nullable=True),
        sa.Column("currency", sa.String(length=10), nullable=True),
        sa.Column("business_address", sa.Text(), nullable=True),
        sa.Column("enabled_modules", sa.JSON(), nullable=False),
        sa.Column("plan", sa.String(length=50), nullable=False),
        sa.Column("employee_limit", sa.Integer(), nullable=False),
        sa.Column("logo_object_key", sa.String(length=500), nullable=True),
        sa.Column("primary_brand_color", sa.String(length=20), nullable=True),
        sa.Column("email_sender_name", sa.String(length=255), nullable=True),
        sa.Column("support_email", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "admin_user_id",
            sa.String(length=36),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("tenant_code", name="uq_tenants_tenant_code"),
        sa.UniqueConstraint("admin_user_id", name="uq_tenants_admin_user_id"),
    )
    op.create_index("ix_tenants_tenant_code", "tenants", ["tenant_code"])

    op.add_column("users", sa.Column("tenant_id", sa.String(length=36), nullable=True))
    op.create_foreign_key(
        "fk_users_tenant_id_tenants",
        "users",
        "tenants",
        ["tenant_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_users_tenant_id", "users", ["tenant_id"])

    op.create_table(
        "tenant_invitations",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(length=36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "tenant_id",
            sa.String(length=36),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("token_hash", name="uq_tenant_invitations_token_hash"),
    )
    op.create_index("ix_tenant_invitations_user_id", "tenant_invitations", ["user_id"])
    op.create_index("ix_tenant_invitations_tenant_id", "tenant_invitations", ["tenant_id"])
    op.create_index("ix_tenant_invitations_token_hash", "tenant_invitations", ["token_hash"])


def downgrade() -> None:
    op.drop_index("ix_tenant_invitations_token_hash", table_name="tenant_invitations")
    op.drop_index("ix_tenant_invitations_tenant_id", table_name="tenant_invitations")
    op.drop_index("ix_tenant_invitations_user_id", table_name="tenant_invitations")
    op.drop_table("tenant_invitations")

    op.drop_index("ix_users_tenant_id", table_name="users")
    op.drop_constraint("fk_users_tenant_id_tenants", "users", type_="foreignkey")
    op.drop_column("users", "tenant_id")

    op.drop_index("ix_tenants_tenant_code", table_name="tenants")
    op.drop_table("tenants")
