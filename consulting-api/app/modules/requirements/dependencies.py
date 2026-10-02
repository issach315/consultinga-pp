from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.requirements.job_service import RequirementService
from app.modules.requirements.service import ClientService
from app.modules.requirements.submission_service import SubmissionService


def get_client_service(db: Session = Depends(get_db)) -> ClientService:
    return ClientService(db)


def get_requirement_service(db: Session = Depends(get_db)) -> RequirementService:
    return RequirementService(db)


def get_submission_service(db: Session = Depends(get_db)) -> SubmissionService:
    return SubmissionService(db)
