"""candidate registry and job submissions

Revision ID: f2a9c6d3e8b1
Revises: c8d4f1a7b2e5
Create Date: 2026-10-01
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "f2a9c6d3e8b1"
down_revision: str | None = "c8d4f1a7b2e5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tenants", sa.Column("candidate_sequence", sa.Integer(), server_default="0", nullable=False)
    )
    op.add_column("tenants", sa.Column("submission_sequence_date", sa.Date(), nullable=True))
    op.add_column(
        "tenants",
        sa.Column("submission_sequence", sa.Integer(), server_default="0", nullable=False),
    )

    op.create_table(
        "requirement_members",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("requirement_id", sa.String(length=26), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("assignment_type", sa.String(length=50), nullable=False),
        sa.Column("assigned_by", sa.String(length=36), nullable=False),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["requirement_id"], ["requirements.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["assigned_by"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "requirement_id",
            "user_id",
            "assignment_type",
            name="uq_requirement_members_requirement_user_type",
        ),
    )
    op.create_index(
        "ix_requirement_members_requirement_id", "requirement_members", ["requirement_id"]
    )
    op.create_index("ix_requirement_members_user_id", "requirement_members", ["user_id"])
    op.create_index(
        "ix_requirement_members_assignment_type", "requirement_members", ["assignment_type"]
    )
    op.execute(
        sa.text(
            """
            INSERT INTO requirement_members
                (id, requirement_id, user_id, assignment_type, assigned_by, assigned_at)
            SELECT UUID(), rr.requirement_id, rr.user_id,
                   'RECRUITER', r.created_by, r.created_at
            FROM requirement_recruiters rr
            JOIN requirements r ON r.id = rr.requirement_id
            """
        )
    )
    op.execute(
        sa.text(
            """
            INSERT INTO requirement_members
                (id, requirement_id, user_id, assignment_type, assigned_by, assigned_at)
            SELECT UUID(), rtl.requirement_id, rtl.user_id,
                   'TEAM_LEAD', r.created_by, r.created_at
            FROM requirement_team_leads rtl
            JOIN requirements r ON r.id = rtl.requirement_id
            """
        )
    )

    op.create_table(
        "candidates",
        sa.Column("id", sa.String(length=26), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=False),
        sa.Column("candidate_code", sa.String(length=40), nullable=False),
        sa.Column("first_name", sa.String(length=120), nullable=False),
        sa.Column("last_name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=False),
        sa.Column("current_location", sa.String(length=255), nullable=True),
        sa.Column("total_experience", sa.Float(), nullable=False),
        sa.Column("employment_history", sa.JSON(), nullable=False),
        sa.Column("resume_object_key", sa.String(length=500), nullable=True),
        sa.Column("resume_file_name", sa.String(length=255), nullable=True),
        sa.Column("resume_version", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
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
        sa.UniqueConstraint("tenant_id", "candidate_code", name="uq_candidates_tenant_code"),
    )
    op.create_index("ix_candidates_tenant_id", "candidates", ["tenant_id"])
    op.create_index("ix_candidates_status", "candidates", ["status"])
    op.create_index("ix_candidates_tenant_email", "candidates", ["tenant_id", "email"])

    op.create_table(
        "submissions",
        sa.Column("id", sa.String(length=26), nullable=False),
        sa.Column("submission_code", sa.String(length=40), nullable=False),
        sa.Column("tenant_id", sa.String(length=36), nullable=False),
        sa.Column("requirement_id", sa.String(length=26), nullable=False),
        sa.Column("candidate_id", sa.String(length=26), nullable=False),
        sa.Column("candidate_snapshot", sa.JSON(), nullable=False),
        sa.Column("relevant_experience", sa.Float(), nullable=False),
        sa.Column("current_ctc", sa.Numeric(12, 2), nullable=True),
        sa.Column("expected_ctc", sa.Numeric(12, 2), nullable=True),
        sa.Column("ctc_currency", sa.String(length=10), nullable=False),
        sa.Column("ctc_period", sa.String(length=20), nullable=False),
        sa.Column("notice_period_days", sa.Integer(), nullable=False),
        sa.Column("resume_object_key", sa.String(length=500), nullable=True),
        sa.Column("resume_file_name", sa.String(length=255), nullable=True),
        sa.Column("resume_version", sa.Integer(), nullable=False),
        sa.Column("submitted_by", sa.String(length=36), nullable=False),
        sa.Column("submitter_role_snapshot", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("updated_by", sa.String(length=36), nullable=True),
        sa.Column("deleted_by", sa.String(length=36), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["requirement_id"], ["requirements.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["candidate_id"], ["candidates.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["submitted_by"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["updated_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "submission_code", name="uq_submissions_tenant_code"),
    )
    op.create_index("ix_submissions_tenant_id", "submissions", ["tenant_id"])
    op.create_index("ix_submissions_requirement_id", "submissions", ["requirement_id"])
    op.create_index("ix_submissions_candidate_id", "submissions", ["candidate_id"])
    op.create_index("ix_submissions_submitted_by", "submissions", ["submitted_by"])
    op.create_index("ix_submissions_status", "submissions", ["status"])
    op.create_index(
        "ix_submissions_tenant_requirement", "submissions", ["tenant_id", "requirement_id"]
    )
    op.create_index(
        "ix_submissions_requirement_candidate", "submissions", ["requirement_id", "candidate_id"]
    )

    op.create_table(
        "submission_status_history",
        sa.Column("id", sa.String(length=26), nullable=False),
        sa.Column("submission_id", sa.String(length=26), nullable=False),
        sa.Column("from_status", sa.String(length=30), nullable=True),
        sa.Column("to_status", sa.String(length=30), nullable=False),
        sa.Column("changed_by", sa.String(length=36), nullable=False),
        sa.Column("comments", sa.Text(), nullable=True),
        sa.Column("changed_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["submission_id"], ["submissions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["changed_by"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_submission_status_history_submission_id",
        "submission_status_history",
        ["submission_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_submission_status_history_submission_id", table_name="submission_status_history"
    )
    op.drop_table("submission_status_history")
    op.drop_index("ix_submissions_requirement_candidate", table_name="submissions")
    op.drop_index("ix_submissions_tenant_requirement", table_name="submissions")
    op.drop_index("ix_submissions_status", table_name="submissions")
    op.drop_index("ix_submissions_submitted_by", table_name="submissions")
    op.drop_index("ix_submissions_candidate_id", table_name="submissions")
    op.drop_index("ix_submissions_requirement_id", table_name="submissions")
    op.drop_index("ix_submissions_tenant_id", table_name="submissions")
    op.drop_table("submissions")
    op.drop_index("ix_candidates_tenant_email", table_name="candidates")
    op.drop_index("ix_candidates_status", table_name="candidates")
    op.drop_index("ix_candidates_tenant_id", table_name="candidates")
    op.drop_table("candidates")
    op.drop_index("ix_requirement_members_assignment_type", table_name="requirement_members")
    op.drop_index("ix_requirement_members_user_id", table_name="requirement_members")
    op.drop_index("ix_requirement_members_requirement_id", table_name="requirement_members")
    op.drop_table("requirement_members")
    op.drop_column("tenants", "submission_sequence")
    op.drop_column("tenants", "submission_sequence_date")
    op.drop_column("tenants", "candidate_sequence")
