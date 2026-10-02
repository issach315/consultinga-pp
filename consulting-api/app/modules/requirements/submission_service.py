from datetime import UTC, datetime

from fastapi import status
from sqlalchemy.orm import Session

from app.common.schemas import PaginatedResponse, PaginationMeta
from app.core.exceptions import AppError, ConflictError, NotFoundError
from app.modules.auth.constants import RoleCode
from app.modules.auth.schemas import UserOut
from app.modules.requirements.job_service import RequirementService
from app.modules.requirements.submission_models import (
    Candidate,
    Submission,
    SubmissionStatusHistory,
)
from app.modules.requirements.submission_repository import SubmissionRepository, SubmissionRow
from app.modules.requirements.submission_schemas import (
    CandidateCreateRequest,
    CandidateOut,
    CandidateSnapshotOut,
    SubmissionCreateRequest,
    SubmissionOut,
    SubmissionStatus,
    SubmissionStatusHistoryOut,
    SubmissionStatusUpdateRequest,
    SubmissionUserOut,
)

ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "SUBMITTED": {"UNDER_REVIEW", "SHORTLISTED", "REJECTED", "WITHDRAWN"},
    "UNDER_REVIEW": {"SHORTLISTED", "REJECTED", "WITHDRAWN"},
    "SHORTLISTED": {"INTERVIEW_SCHEDULED", "REJECTED", "WITHDRAWN"},
    "INTERVIEW_SCHEDULED": {"OFFERED", "REJECTED", "WITHDRAWN"},
    "OFFERED": {"PLACED", "REJECTED", "WITHDRAWN"},
    "PLACED": set(),
    "REJECTED": set(),
    "WITHDRAWN": set(),
}


class SubmissionService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = SubmissionRepository(db)
        self.requirements = RequirementService(db)

    def create_candidate(
        self, current_user: UserOut, payload: CandidateCreateRequest
    ) -> CandidateOut:
        assert current_user.tenant_id is not None
        tenant_id = current_user.tenant_id
        if self.repository.find_candidate_by_email(tenant_id, str(payload.email)):
            raise ConflictError("A candidate with this email already exists")
        tenant = self.repository.lock_tenant(tenant_id)
        if tenant is None:
            raise NotFoundError("Tenant not found")
        tenant.candidate_sequence += 1
        values = payload.model_dump(mode="json")
        candidate = Candidate(
            tenant_id=tenant_id,
            candidate_code=f"CAND-{tenant.candidate_sequence:06d}",
            created_by=current_user.id,
            **values,
        )
        self.repository.create_candidate(candidate)
        self.db.commit()
        return self._candidate_out(candidate)

    def list_candidates(
        self, current_user: UserOut, page: int, page_size: int, search: str | None
    ) -> PaginatedResponse[CandidateOut]:
        assert current_user.tenant_id is not None
        items, total = self.repository.list_candidates(
            current_user.tenant_id, page, page_size, search
        )
        return PaginatedResponse(
            items=[self._candidate_out(item) for item in items],
            meta=PaginationMeta(
                page=page,
                page_size=page_size,
                total_items=total,
                total_pages=max((total + page_size - 1) // page_size, 1),
            ),
        )

    def create_submission(
        self,
        current_user: UserOut,
        requirement_id: str,
        payload: SubmissionCreateRequest,
    ) -> SubmissionOut:
        assert current_user.tenant_id is not None
        tenant_id = current_user.tenant_id
        job = self.requirements.get_requirement(current_user, requirement_id)
        if job.status != "OPEN":
            raise AppError("Candidates can only be submitted to open jobs")
        candidate = self.repository.get_candidate(tenant_id, payload.candidate_id)
        if candidate is None or candidate.status != "ACTIVE":
            raise AppError("Select an active candidate belonging to your organization")
        if self.repository.find_active_duplicate(tenant_id, requirement_id, candidate.id):
            raise ConflictError("This candidate already has an active submission for this job")

        tenant = self.repository.lock_tenant(tenant_id)
        if tenant is None:
            raise NotFoundError("Tenant not found")
        today = datetime.now(UTC).date()
        if tenant.submission_sequence_date != today:
            tenant.submission_sequence_date = today
            tenant.submission_sequence = 0
        tenant.submission_sequence += 1

        role = self.requirements.requirements.get_employee_role(tenant_id, current_user.id)
        if role is None:
            role_codes = {item.code for item in current_user.roles}
            role = "TENANT_ADMIN" if RoleCode.TENANT_ADMIN in role_codes else "AUTHORIZED_USER"
        snapshot = {
            "candidate_code": candidate.candidate_code,
            "name": f"{candidate.first_name} {candidate.last_name}".strip(),
            "email": candidate.email,
            "phone": candidate.phone,
            "current_location": candidate.current_location,
            "total_experience": candidate.total_experience,
            "employment_history": candidate.employment_history,
        }
        resume_key = payload.resume_object_key or candidate.resume_object_key
        resume_name = payload.resume_file_name or candidate.resume_file_name
        submission = Submission(
            submission_code=f"SUB-{today.strftime('%Y%m%d')}-{tenant.submission_sequence:03d}",
            tenant_id=tenant_id,
            requirement_id=requirement_id,
            candidate_id=candidate.id,
            candidate_snapshot=snapshot,
            relevant_experience=payload.relevant_experience,
            current_ctc=payload.current_ctc,
            expected_ctc=payload.expected_ctc,
            ctc_currency=payload.ctc_currency,
            ctc_period=payload.ctc_period,
            notice_period_days=payload.notice_period_days,
            resume_object_key=resume_key,
            resume_file_name=resume_name,
            resume_version=candidate.resume_version,
            submitted_by=current_user.id,
            submitter_role_snapshot=role,
            status=SubmissionStatus.SUBMITTED.value,
            notes=payload.notes,
        )
        history = SubmissionStatusHistory(
            submission_id="",
            from_status=None,
            to_status=SubmissionStatus.SUBMITTED.value,
            changed_by=current_user.id,
            comments="Candidate submitted",
        )
        self.repository.create_submission(submission, history)
        self.db.commit()
        return self.get_submission(current_user, submission.id)

    def list_submissions(
        self,
        current_user: UserOut,
        requirement_id: str,
        page: int,
        page_size: int,
        search: str | None,
        submission_status: SubmissionStatus | None,
    ) -> PaginatedResponse[SubmissionOut]:
        assert current_user.tenant_id is not None
        self.requirements.get_requirement(current_user, requirement_id)
        rows, total = self.repository.list_submissions(
            current_user.tenant_id,
            requirement_id,
            page,
            page_size,
            search,
            submission_status.value if submission_status else None,
        )
        return PaginatedResponse(
            items=[self._submission_out(row, include_history=False) for row in rows],
            meta=PaginationMeta(
                page=page,
                page_size=page_size,
                total_items=total,
                total_pages=max((total + page_size - 1) // page_size, 1),
            ),
        )

    def get_submission(self, current_user: UserOut, submission_id: str) -> SubmissionOut:
        assert current_user.tenant_id is not None
        row = self.repository.get_submission(current_user.tenant_id, submission_id)
        if row is None:
            raise NotFoundError("Submission not found")
        self.requirements.get_requirement(current_user, row[0].requirement_id)
        return self._submission_out(row, include_history=True)

    def update_status(
        self,
        current_user: UserOut,
        submission_id: str,
        payload: SubmissionStatusUpdateRequest,
    ) -> SubmissionOut:
        assert current_user.tenant_id is not None
        row = self.repository.get_submission(current_user.tenant_id, submission_id)
        if row is None:
            raise NotFoundError("Submission not found")
        submission = row[0]
        self.requirements.get_requirement(current_user, submission.requirement_id)
        target = payload.status.value
        if target == submission.status:
            return self._submission_out(row, include_history=True)
        if target not in ALLOWED_TRANSITIONS.get(submission.status, set()):
            raise AppError(
                f"Cannot change submission status from {submission.status} to {target}",
                code="INVALID_STATUS_TRANSITION",
                status_code=status.HTTP_409_CONFLICT,
            )
        old_status = submission.status
        submission.status = target
        submission.updated_by = current_user.id
        self.db.add(
            SubmissionStatusHistory(
                submission_id=submission.id,
                from_status=old_status,
                to_status=target,
                changed_by=current_user.id,
                comments=payload.comments,
            )
        )
        self.db.commit()
        return self.get_submission(current_user, submission.id)

    @staticmethod
    def _candidate_out(candidate: Candidate) -> CandidateOut:
        return CandidateOut(
            id=candidate.id,
            tenant_id=candidate.tenant_id,
            candidate_code=candidate.candidate_code,
            first_name=candidate.first_name,
            last_name=candidate.last_name,
            full_name=f"{candidate.first_name} {candidate.last_name}".strip(),
            email=candidate.email,
            phone=candidate.phone,
            current_location=candidate.current_location,
            total_experience=candidate.total_experience,
            employment_history=candidate.employment_history,
            resume_object_key=candidate.resume_object_key,
            resume_file_name=candidate.resume_file_name,
            resume_version=candidate.resume_version,
            status=candidate.status,
            created_at=candidate.created_at,
        )

    def _submission_out(self, row: SubmissionRow, *, include_history: bool) -> SubmissionOut:
        submission, requirement, submitter = row
        history = self.repository.list_history(submission.id) if include_history else []
        return SubmissionOut(
            id=submission.id,
            submission_code=submission.submission_code,
            tenant_id=submission.tenant_id,
            requirement_id=submission.requirement_id,
            job_code=requirement.job_code,
            job_title=requirement.job_title,
            candidate_id=submission.candidate_id,
            candidate=CandidateSnapshotOut.model_validate(submission.candidate_snapshot),
            relevant_experience=submission.relevant_experience,
            current_ctc=submission.current_ctc,
            expected_ctc=submission.expected_ctc,
            ctc_currency=submission.ctc_currency,
            ctc_period=submission.ctc_period,
            notice_period_days=submission.notice_period_days,
            resume_object_key=submission.resume_object_key,
            resume_file_name=submission.resume_file_name,
            resume_version=submission.resume_version,
            submitted_by=submission.submitted_by,
            submitter=SubmissionUserOut(
                id=submitter.id,
                name=f"{submitter.first_name} {submitter.last_name}".strip(),
                email=submitter.email,
            ),
            submitter_role_snapshot=submission.submitter_role_snapshot,
            status=submission.status,
            notes=submission.notes,
            status_history=[
                SubmissionStatusHistoryOut(
                    id=item.id,
                    from_status=item.from_status,
                    to_status=item.to_status,
                    changed_by=item.changed_by,
                    comments=item.comments,
                    changed_at=item.changed_at,
                )
                for item in history
            ],
            created_at=submission.created_at,
            updated_at=submission.updated_at,
        )
