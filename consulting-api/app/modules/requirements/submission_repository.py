from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.modules.auth.models import User
from app.modules.requirements.job_models import Requirement
from app.modules.requirements.submission_models import (
    Candidate,
    Submission,
    SubmissionStatusHistory,
)
from app.modules.tenants.models import Tenant

SubmissionRow = tuple[Submission, Requirement, User]


class SubmissionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def lock_tenant(self, tenant_id: str) -> Tenant | None:
        return self.db.scalar(select(Tenant).where(Tenant.id == tenant_id).with_for_update())

    def find_candidate_by_email(self, tenant_id: str, email: str) -> Candidate | None:
        return self.db.scalar(
            select(Candidate).where(
                Candidate.tenant_id == tenant_id,
                func.lower(Candidate.email) == email.lower(),
                Candidate.deleted_at.is_(None),
            )
        )

    def get_candidate(self, tenant_id: str, candidate_id: str) -> Candidate | None:
        return self.db.scalar(
            select(Candidate).where(
                Candidate.id == candidate_id,
                Candidate.tenant_id == tenant_id,
                Candidate.deleted_at.is_(None),
            )
        )

    def create_candidate(self, candidate: Candidate) -> Candidate:
        self.db.add(candidate)
        self.db.flush()
        return candidate

    def list_candidates(
        self, tenant_id: str, page: int, page_size: int, search: str | None
    ) -> tuple[list[Candidate], int]:
        stmt = select(Candidate).where(
            Candidate.tenant_id == tenant_id,
            Candidate.deleted_at.is_(None),
            Candidate.status == "ACTIVE",
        )
        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Candidate.candidate_code.ilike(pattern),
                    Candidate.first_name.ilike(pattern),
                    Candidate.last_name.ilike(pattern),
                    Candidate.email.ilike(pattern),
                    Candidate.phone.ilike(pattern),
                )
            )
        total = self.db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        items = list(
            self.db.scalars(
                stmt.order_by(Candidate.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        return items, total

    def find_active_duplicate(
        self, tenant_id: str, requirement_id: str, candidate_id: str
    ) -> Submission | None:
        return self.db.scalar(
            select(Submission).where(
                Submission.tenant_id == tenant_id,
                Submission.requirement_id == requirement_id,
                Submission.candidate_id == candidate_id,
                Submission.deleted_at.is_(None),
                Submission.status.not_in(("REJECTED", "WITHDRAWN")),
            )
        )

    def create_submission(
        self, submission: Submission, history: SubmissionStatusHistory
    ) -> Submission:
        self.db.add(submission)
        self.db.flush()
        history.submission_id = submission.id
        self.db.add(history)
        self.db.flush()
        return submission

    def list_submissions(
        self,
        tenant_id: str,
        requirement_id: str,
        page: int,
        page_size: int,
        search: str | None,
        status: str | None,
    ) -> tuple[list[SubmissionRow], int]:
        stmt = (
            select(Submission, Requirement, User)
            .join(Requirement, Requirement.id == Submission.requirement_id)
            .join(User, User.id == Submission.submitted_by)
            .where(
                Submission.tenant_id == tenant_id,
                Submission.requirement_id == requirement_id,
                Submission.deleted_at.is_(None),
            )
        )
        if status:
            stmt = stmt.where(Submission.status == status)
        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Submission.submission_code.ilike(pattern),
                    func.json_extract(Submission.candidate_snapshot, "$.name").ilike(pattern),
                    func.json_extract(Submission.candidate_snapshot, "$.email").ilike(pattern),
                )
            )
        total = self.db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        rows = self.db.execute(
            stmt.order_by(Submission.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return [(row[0], row[1], row[2]) for row in rows], total

    def get_submission(self, tenant_id: str, submission_id: str) -> SubmissionRow | None:
        row = self.db.execute(
            select(Submission, Requirement, User)
            .join(Requirement, Requirement.id == Submission.requirement_id)
            .join(User, User.id == Submission.submitted_by)
            .where(
                Submission.id == submission_id,
                Submission.tenant_id == tenant_id,
                Submission.deleted_at.is_(None),
            )
        ).one_or_none()
        return (row[0], row[1], row[2]) if row else None

    def list_history(self, submission_id: str) -> list[SubmissionStatusHistory]:
        return list(
            self.db.scalars(
                select(SubmissionStatusHistory)
                .where(SubmissionStatusHistory.submission_id == submission_id)
                .order_by(SubmissionStatusHistory.changed_at.asc())
            )
        )
