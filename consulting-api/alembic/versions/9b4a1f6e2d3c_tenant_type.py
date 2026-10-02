"""tenants: add tenant_type column

Revision ID: 9b4a1f6e2d3c
Revises: 3f8a5d2c1e97
Create Date: 2026-08-06

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "9b4a1f6e2d3c"
down_revision: str | None = "3f8a5d2c1e97"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tenants",
        sa.Column("tenant_type", sa.String(length=20), nullable=False, server_default="Domestic"),
    )
    op.alter_column("tenants", "tenant_type", server_default=None)


def downgrade() -> None:
    op.drop_column("tenants", "tenant_type")
