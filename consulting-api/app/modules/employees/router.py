import asyncio

from fastapi import APIRouter, Depends, File, Query, UploadFile, status

from app.common.schemas import PaginatedResponse
from app.core.email_service import get_invitation_email_service
from app.modules.auth.schemas import UserOut
from app.modules.employees.constants import EmployeeStatus, role_label_for_code
from app.modules.employees.dependencies import get_employee_service, require_own_tenant
from app.modules.employees.schemas import (
    BulkEmployeeCreateRequest,
    BulkEmployeeCreateResponse,
    BulkEmployeeResultOut,
    EmployeeCreateRequest,
    EmployeeOut,
    EmployeePermissionsUpdateRequest,
    EmployeePhotoUploadResponse,
    EmployeeStatusUpdateRequest,
    EmployeeSummaryOut,
    EmployeeUpdateRequest,
)
from app.modules.employees.service import EmployeeService
from app.modules.tenants.dependencies import get_tenant_service
from app.modules.tenants.service import TenantService

router = APIRouter(prefix="/api/v1/tenants/{tenant_id}/employees", tags=["employees"])


def _inviter_name(user: UserOut) -> str:
    return f"{user.first_name} {user.last_name}".strip()


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
async def create_employee(
    tenant_id: str,
    payload: EmployeeCreateRequest,
    employee_service: EmployeeService = Depends(get_employee_service),
    tenant_service: TenantService = Depends(get_tenant_service),
    current_user: UserOut = Depends(require_own_tenant),
) -> EmployeeOut:
    employee, raw_token = employee_service.onboard_employee(tenant_id, payload)
    tenant = tenant_service.get_tenant(tenant_id)
    sent = await get_invitation_email_service().send_employee_invitation(
        tenant=tenant,
        employee=employee,
        raw_token=raw_token,
        inviter_name=_inviter_name(current_user),
        employee_role_label=role_label_for_code(employee.role),
    )
    return employee.model_copy(update={"invite_email_sent": sent})


@router.post(
    "/bulk", response_model=BulkEmployeeCreateResponse, status_code=status.HTTP_201_CREATED
)
async def bulk_create_employees(
    tenant_id: str,
    payload: BulkEmployeeCreateRequest,
    employee_service: EmployeeService = Depends(get_employee_service),
    tenant_service: TenantService = Depends(get_tenant_service),
    current_user: UserOut = Depends(require_own_tenant),
) -> BulkEmployeeCreateResponse:
    results = employee_service.bulk_onboard_employees(tenant_id, payload.employees)
    tenant = tenant_service.get_tenant(tenant_id)
    inviter_name = _inviter_name(current_user)

    created_results = [r for r in results if r.status == "created" and r.employee and r.raw_token]
    email_service = get_invitation_email_service()
    send_outcomes = await asyncio.gather(
        *(
            email_service.send_employee_invitation(
                tenant=tenant,
                employee=r.employee,
                raw_token=r.raw_token,
                inviter_name=inviter_name,
                employee_role_label=role_label_for_code(r.employee.role),
            )
            for r in created_results
        ),
        return_exceptions=True,
    )
    for r, outcome in zip(created_results, send_outcomes, strict=True):
        assert r.employee is not None
        r.employee = r.employee.model_copy(update={"invite_email_sent": outcome is True})

    return BulkEmployeeCreateResponse(
        results=[
            BulkEmployeeResultOut(
                index=r.index, status=r.status, employee=r.employee, error=r.error
            )
            for r in results
        ],
        created_count=sum(1 for r in results if r.status == "created"),
        failed_count=sum(1 for r in results if r.status == "failed"),
    )


@router.post("/photo", response_model=EmployeePhotoUploadResponse)
async def upload_employee_photo(
    tenant_id: str,
    file: UploadFile = File(...),
    employee_service: EmployeeService = Depends(get_employee_service),
    _current_user=Depends(require_own_tenant),
) -> EmployeePhotoUploadResponse:
    return await employee_service.upload_employee_photo(file)


@router.get("/summary", response_model=EmployeeSummaryOut)
def get_employee_summary(
    tenant_id: str,
    employee_service: EmployeeService = Depends(get_employee_service),
    _current_user=Depends(require_own_tenant),
) -> EmployeeSummaryOut:
    return employee_service.get_summary(tenant_id)


@router.get("", response_model=PaginatedResponse[EmployeeOut])
def list_employees(
    tenant_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None),
    roles: list[str] | None = Query(None),
    statuses: list[str] | None = Query(None),
    sort_by: str | None = Query(None),
    sort_order: str | None = Query(None),
    employee_service: EmployeeService = Depends(get_employee_service),
    _current_user=Depends(require_own_tenant),
) -> PaginatedResponse[EmployeeOut]:
    return employee_service.list_employees(
        tenant_id, page, page_size, search, roles, statuses, sort_by, sort_order
    )


@router.post("/{employee_id}/invitation", response_model=EmployeeOut)
async def reissue_employee_invitation(
    tenant_id: str,
    employee_id: str,
    employee_service: EmployeeService = Depends(get_employee_service),
    tenant_service: TenantService = Depends(get_tenant_service),
    current_user: UserOut = Depends(require_own_tenant),
) -> EmployeeOut:
    employee, raw_token = employee_service.reissue_invitation(tenant_id, employee_id)
    tenant = tenant_service.get_tenant(tenant_id)
    sent = await get_invitation_email_service().send_employee_invitation(
        tenant=tenant,
        employee=employee,
        raw_token=raw_token,
        inviter_name=_inviter_name(current_user),
        employee_role_label=role_label_for_code(employee.role),
        is_reset=employee.status != EmployeeStatus.INVITED,
    )
    return employee.model_copy(update={"invite_email_sent": sent})


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(
    tenant_id: str,
    employee_id: str,
    employee_service: EmployeeService = Depends(get_employee_service),
    _current_user=Depends(require_own_tenant),
) -> EmployeeOut:
    return employee_service.get_employee(tenant_id, employee_id)


@router.patch("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    tenant_id: str,
    employee_id: str,
    payload: EmployeeUpdateRequest,
    employee_service: EmployeeService = Depends(get_employee_service),
    _current_user=Depends(require_own_tenant),
) -> EmployeeOut:
    return employee_service.update_employee(tenant_id, employee_id, payload)


@router.patch("/{employee_id}/status", response_model=EmployeeOut)
def set_employee_status(
    tenant_id: str,
    employee_id: str,
    payload: EmployeeStatusUpdateRequest,
    employee_service: EmployeeService = Depends(get_employee_service),
    _current_user=Depends(require_own_tenant),
) -> EmployeeOut:
    return employee_service.set_status(tenant_id, employee_id, EmployeeStatus(payload.status))


@router.put("/{employee_id}/permissions", response_model=EmployeeOut)
def update_employee_permissions(
    tenant_id: str,
    employee_id: str,
    payload: EmployeePermissionsUpdateRequest,
    employee_service: EmployeeService = Depends(get_employee_service),
    _current_user=Depends(require_own_tenant),
) -> EmployeeOut:
    return employee_service.update_permissions(tenant_id, employee_id, payload.permissions)
