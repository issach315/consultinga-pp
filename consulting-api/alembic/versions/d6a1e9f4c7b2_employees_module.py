"""employees module: employees table, tenants.employee_id_prefix/sequence, EMPLOYEE role

Revision ID: d6a1e9f4c7b2
Revises: 9b4a1f6e2d3c
Create Date: 2026-08-06

"""

import uuid
from collections.abc import Sequence
from datetime import UTC, datetime

import sqlalchemy as sa

from alembic import op

revision: str = "d6a1e9f4c7b2"
down_revision: str | None = "9b4a1f6e2d3c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tenants",
        sa.Column("employee_id_prefix", sa.String(length=6), nullable=False, server_default=""),
    )
    op.alter_column("tenants", "employee_id_prefix", server_default=None)
    op.add_column(
        "tenants",
        sa.Column("employee_sequence", sa.Integer(), nullable=False, server_default="0"),
    )
    op.alter_column("tenants", "employee_sequence", server_default=None)

    op.execute(
        "UPDATE tenants SET employee_id_prefix = UPPER(SUBSTRING(tenant_code, 1, 3)) "
        "WHERE employee_id_prefix = ''"
    )

    op.create_table(
        "employees",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column(
            "tenant_id",
            sa.String(length=36),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.String(length=36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("employee_code", sa.String(length=30), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("permissions", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", name="uq_employees_user_id"),
        sa.UniqueConstraint(
            "tenant_id", "employee_code", name="uq_employees_tenant_id_employee_code"
        ),
    )
    op.create_index("ix_employees_tenant_id", "employees", ["tenant_id"])
    op.create_index("ix_employees_user_id", "employees", ["user_id"])

    roles_table = sa.table(
        "roles",
        sa.column("id", sa.String(length=36)),
        sa.column("code", sa.String(length=50)),
        sa.column("name", sa.String(length=100)),
        sa.column("description", sa.String(length=255)),
        sa.column("is_active", sa.Boolean()),
        sa.column("is_system_role", sa.Boolean()),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    now = datetime.now(UTC)
    op.bulk_insert(
        roles_table,
        [
            {
                "id": str(uuid.uuid4()),
                "code": "EMPLOYEE",
                "name": "Employee",
                "description": "Standard employee access within a single tenant.",
                "is_active": True,
                "is_system_role": True,
                "created_at": now,
                "updated_at": now,
            }
        ],
    )


def downgrade() -> None:
    op.execute("DELETE FROM roles WHERE code = 'EMPLOYEE'")

    op.drop_index("ix_employees_user_id", table_name="employees")
    op.drop_index("ix_employees_tenant_id", table_name="employees")
    op.drop_table("employees")

    op.drop_column("tenants", "employee_sequence")
    op.drop_column("tenants", "employee_id_prefix")
