"""tenants: add subdomain column

Revision ID: 3f8a5d2c1e97
Revises: 7c1e2f9a3b4d
Create Date: 2026-08-05

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "3f8a5d2c1e97"
down_revision: str | None = "7c1e2f9a3b4d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tenants",
        sa.Column("subdomain", sa.String(length=63), nullable=False, server_default=""),
    )
    op.alter_column("tenants", "subdomain", server_default=None)
    op.create_unique_constraint("uq_tenants_subdomain", "tenants", ["subdomain"])
    op.create_index("ix_tenants_subdomain", "tenants", ["subdomain"])


def downgrade() -> None:
    op.drop_index("ix_tenants_subdomain", table_name="tenants")
    op.drop_constraint("uq_tenants_subdomain", "tenants", type_="unique")
    op.drop_column("tenants", "subdomain")
