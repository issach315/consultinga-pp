from fastapi import APIRouter, Depends, Query, status

from app.common.schemas import PaginatedResponse
from app.modules.access.dependencies import require_permission
from app.modules.auth.schemas import UserOut
from app.modules.employees.constants import PermissionAction
from app.modules.requirements.constants import (
    REQUIREMENTS_MODULE_KEY,
    REQUIREMENTS_SUB_MODULE_LABELS,
    RequirementsSubModule,
)
from app.modules.requirements.dependencies import (
    get_client_service,
    get_requirement_service,
    get_submission_service,
)
from app.modules.requirements.job_schemas import (
    JobPriority,
    JobStatus,
    RequirementAssigneeOut,
    RequirementCreateRequest,
    RequirementOut,
    RequirementUpdateRequest,
)
from app.modules.requirements.job_service import RequirementService
from app.modules.requirements.schemas import (
    ClientCreateRequest,
    ClientOut,
    ClientStatus,
    ClientUpdateRequest,
    RequirementsStubOut,
)
from app.modules.requirements.service import ClientService
from app.modules.requirements.submission_schemas import (
    CandidateCreateRequest,
    CandidateOut,
    SubmissionCreateRequest,
    SubmissionOut,
    SubmissionStatus,
    SubmissionStatusUpdateRequest,
)
from app.modules.requirements.submission_service import SubmissionService

router = APIRouter(prefix="/api/v1", tags=["requirements"])


def _stub(sub_module: RequirementsSubModule) -> RequirementsStubOut:
    return RequirementsStubOut(
        message=f"{REQUIREMENTS_SUB_MODULE_LABELS[sub_module]} module is under development"
    )


@router.get("/clients", response_model=PaginatedResponse[ClientOut])
def list_clients(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None),
    status_filter: ClientStatus | None = Query(None, alias="status"),
    sort_by: str | None = Query(None),
    sort_order: str | None = Query(None),
    client_service: ClientService = Depends(get_client_service),
    current_user: UserOut = Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.CLIENTS, PermissionAction.READ
        )
    ),
) -> PaginatedResponse[ClientOut]:
    assert current_user.tenant_id is not None
    return client_service.list_clients(
        current_user.tenant_id,
        page,
        page_size,
        search,
        [status_filter.value] if status_filter else None,
        sort_by,
        sort_order,
    )


@router.post("/clients", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
def create_client(
    payload: ClientCreateRequest,
    client_service: ClientService = Depends(get_client_service),
    current_user: UserOut = Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.CLIENTS, PermissionAction.CREATE
        )
    ),
) -> ClientOut:
    assert current_user.tenant_id is not None
    return client_service.create_client(current_user.tenant_id, current_user.id, payload)


@router.get("/clients/{client_id}", response_model=ClientOut)
def get_client(
    client_id: str,
    client_service: ClientService = Depends(get_client_service),
    current_user: UserOut = Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.CLIENTS, PermissionAction.READ
        )
    ),
) -> ClientOut:
    assert current_user.tenant_id is not None
    return client_service.get_client(current_user.tenant_id, client_id)


@router.patch("/clients/{client_id}", response_model=ClientOut)
def update_client(
    client_id: str,
    payload: ClientUpdateRequest,
    client_service: ClientService = Depends(get_client_service),
    current_user: UserOut = Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.CLIENTS, PermissionAction.UPDATE
        )
    ),
) -> ClientOut:
    assert current_user.tenant_id is not None
    return client_service.update_client(
        current_user.tenant_id, client_id, current_user.id, payload
    )


@router.delete("/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: str,
    client_service: ClientService = Depends(get_client_service),
    current_user: UserOut = Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.CLIENTS, PermissionAction.DELETE
        )
    ),
) -> None:
    assert current_user.tenant_id is not None
    client_service.delete_client(current_user.tenant_id, client_id, current_user.id)


@router.get("/requirements", response_model=PaginatedResponse[RequirementOut])
def list_requirements(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None),
    client_id: str | None = Query(None),
    status_filter: JobStatus | None = Query(None, alias="status"),
    priority: JobPriority | None = Query(None),
    recruiter_id: str | None = Query(None),
    team_lead_id: str | None = Query(None),
    created_by: str | None = Query(None),
    sort_by: str | None = Query(None),
    sort_order: str | None = Query(None),
    requirement_service: RequirementService = Depends(get_requirement_service),
    current_user: UserOut = Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.REQUIREMENTS, PermissionAction.READ
        )
    ),
) -> PaginatedResponse[RequirementOut]:
    return requirement_service.list_requirements(
        current_user,
        page,
        page_size,
        search,
        client_id,
        status_filter,
        priority,
        recruiter_id,
        team_lead_id,
        created_by,
        sort_by,
        sort_order,
    )


@router.post("/requirements", response_model=RequirementOut, status_code=status.HTTP_201_CREATED)
def create_requirement(
    payload: RequirementCreateRequest,
    requirement_service: RequirementService = Depends(get_requirement_service),
    current_user: UserOut = Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.REQUIREMENTS, PermissionAction.CREATE
        )
    ),
) -> RequirementOut:
    return requirement_service.create_requirement(current_user, payload)


@router.get("/requirements/assignees", response_model=list[RequirementAssigneeOut])
def list_requirement_assignees(
    role: str = Query(...),
    requirement_service: RequirementService = Depends(get_requirement_service),
    current_user: UserOut = Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.REQUIREMENTS, PermissionAction.READ
        )
    ),
) -> list[RequirementAssigneeOut]:
    assert current_user.tenant_id is not None
    return requirement_service.list_assignees(current_user.tenant_id, role)


@router.get("/requirements/{requirement_id}", response_model=RequirementOut)
def get_requirement(
    requirement_id: str,
    requirement_service: RequirementService = Depends(get_requirement_service),
    current_user: UserOut = Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.REQUIREMENTS, PermissionAction.READ
        )
    ),
) -> RequirementOut:
    return requirement_service.get_requirement(current_user, requirement_id)


@router.put("/requirements/{requirement_id}", response_model=RequirementOut)
def update_requirement(
    requirement_id: str,
    payload: RequirementUpdateRequest,
    requirement_service: RequirementService = Depends(get_requirement_service),
    current_user: UserOut = Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.REQUIREMENTS, PermissionAction.UPDATE
        )
    ),
) -> RequirementOut:
    return requirement_service.update_requirement(current_user, requirement_id, payload)


@router.delete("/requirements/{requirement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_requirement(
    requirement_id: str,
    requirement_service: RequirementService = Depends(get_requirement_service),
    current_user: UserOut = Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.REQUIREMENTS, PermissionAction.DELETE
        )
    ),
) -> None:
    requirement_service.delete_requirement(current_user, requirement_id)


@router.get("/candidates", response_model=PaginatedResponse[CandidateOut])
def list_candidates(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None),
    submission_service: SubmissionService = Depends(get_submission_service),
    current_user: UserOut = Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.SUBMISSIONS, PermissionAction.READ
        )
    ),
) -> PaginatedResponse[CandidateOut]:
    return submission_service.list_candidates(current_user, page, page_size, search)


@router.post("/candidates", response_model=CandidateOut, status_code=status.HTTP_201_CREATED)
def create_candidate(
    payload: CandidateCreateRequest,
    submission_service: SubmissionService = Depends(get_submission_service),
    current_user: UserOut = Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.SUBMISSIONS, PermissionAction.CREATE
        )
    ),
) -> CandidateOut:
    return submission_service.create_candidate(current_user, payload)


@router.get(
    "/requirements/{requirement_id}/submissions",
    response_model=PaginatedResponse[SubmissionOut],
)
def list_requirement_submissions(
    requirement_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None),
    status_filter: SubmissionStatus | None = Query(None, alias="status"),
    submission_service: SubmissionService = Depends(get_submission_service),
    current_user: UserOut = Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.SUBMISSIONS, PermissionAction.READ
        )
    ),
) -> PaginatedResponse[SubmissionOut]:
    return submission_service.list_submissions(
        current_user, requirement_id, page, page_size, search, status_filter
    )


@router.post(
    "/requirements/{requirement_id}/submissions",
    response_model=SubmissionOut,
    status_code=status.HTTP_201_CREATED,
)
def create_requirement_submission(
    requirement_id: str,
    payload: SubmissionCreateRequest,
    submission_service: SubmissionService = Depends(get_submission_service),
    current_user: UserOut = Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.SUBMISSIONS, PermissionAction.CREATE
        )
    ),
) -> SubmissionOut:
    return submission_service.create_submission(current_user, requirement_id, payload)


@router.get("/submissions/{submission_id}", response_model=SubmissionOut)
def get_submission(
    submission_id: str,
    submission_service: SubmissionService = Depends(get_submission_service),
    current_user: UserOut = Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.SUBMISSIONS, PermissionAction.READ
        )
    ),
) -> SubmissionOut:
    return submission_service.get_submission(current_user, submission_id)


@router.patch("/submissions/{submission_id}/status", response_model=SubmissionOut)
def update_submission_status(
    submission_id: str,
    payload: SubmissionStatusUpdateRequest,
    submission_service: SubmissionService = Depends(get_submission_service),
    current_user: UserOut = Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.SUBMISSIONS, PermissionAction.UPDATE
        )
    ),
) -> SubmissionOut:
    return submission_service.update_status(current_user, submission_id, payload)


@router.get("/interviews", response_model=RequirementsStubOut)
def get_interviews(
    _current_user=Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.INTERVIEWS, PermissionAction.READ
        )
    ),
) -> RequirementsStubOut:
    return _stub(RequirementsSubModule.INTERVIEWS)


@router.get("/placements", response_model=RequirementsStubOut)
def get_placements(
    _current_user=Depends(
        require_permission(
            REQUIREMENTS_MODULE_KEY, RequirementsSubModule.PLACEMENTS, PermissionAction.READ
        )
    ),
) -> RequirementsStubOut:
    return _stub(RequirementsSubModule.PLACEMENTS)
