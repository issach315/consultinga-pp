from fastapi import APIRouter, Depends, File, Query, UploadFile, status

from app.common.dependencies import require_roles
from app.common.schemas import PaginatedResponse
from app.core.email_service import get_invitation_email_service
from app.modules.auth.constants import RoleCode
from app.modules.auth.schemas import LoginResponse
from app.modules.tenants.dependencies import get_tenant_service
from app.modules.tenants.schemas import (
    AcceptInvitationRequest,
    InvitationDetailOut,
    LogoUploadResponse,
    TenantCreateRequest,
    TenantEmployeeIdPrefixUpdateRequest,
    TenantListItemOut,
    TenantOut,
    TenantStatusUpdateRequest,
    TenantUpdateRequest,
)
from app.modules.tenants.service import TenantService

router = APIRouter(prefix="/api/v1/tenants", tags=["tenants"])
invitation_router = APIRouter(prefix="/api/v1/invitations", tags=["invitations"])


@router.post("", response_model=TenantOut, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    payload: TenantCreateRequest,
    tenant_service: TenantService = Depends(get_tenant_service),
    _current_user=Depends(require_roles(RoleCode.SUPER_ADMIN)),
) -> TenantOut:
    tenant, raw_token = tenant_service.create_tenant(payload)
    sent = await get_invitation_email_service().send_tenant_admin_invitation(
        tenant=tenant, raw_token=raw_token
    )
    return tenant.model_copy(update={"invite_email_sent": sent})


@router.get("", response_model=PaginatedResponse[TenantListItemOut])
def list_tenants(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None),
    is_active: bool | None = Query(None),
    plan: str | None = Query(None),
    tenant_type: str | None = Query(None),
    tenant_service: TenantService = Depends(get_tenant_service),
    _current_user=Depends(require_roles(RoleCode.SUPER_ADMIN)),
) -> PaginatedResponse[TenantListItemOut]:
    return tenant_service.list_tenants(page, page_size, search, is_active, plan, tenant_type)


@router.get("/me", response_model=TenantOut)
def get_my_tenant(
    tenant_service: TenantService = Depends(get_tenant_service),
    current_user=Depends(require_roles(RoleCode.TENANT_ADMIN, RoleCode.EMPLOYEE)),
) -> TenantOut:
    # Registered before "/{tenant_id}" so "me" isn't swallowed as a tenant id.
    return tenant_service.get_tenant(current_user.tenant_id)


@router.patch("/me/employee-id-prefix", response_model=TenantOut)
def update_my_employee_id_prefix(
    payload: TenantEmployeeIdPrefixUpdateRequest,
    tenant_service: TenantService = Depends(get_tenant_service),
    current_user=Depends(require_roles(RoleCode.TENANT_ADMIN)),
) -> TenantOut:
    return tenant_service.update_employee_id_prefix(
        current_user.tenant_id, payload.employee_id_prefix
    )


@router.get("/{tenant_id}", response_model=TenantOut)
def get_tenant(
    tenant_id: str,
    tenant_service: TenantService = Depends(get_tenant_service),
    _current_user=Depends(require_roles(RoleCode.SUPER_ADMIN)),
) -> TenantOut:
    return tenant_service.get_tenant(tenant_id)


@router.patch("/{tenant_id}", response_model=TenantOut)
def update_tenant(
    tenant_id: str,
    payload: TenantUpdateRequest,
    tenant_service: TenantService = Depends(get_tenant_service),
    _current_user=Depends(require_roles(RoleCode.SUPER_ADMIN)),
) -> TenantOut:
    return tenant_service.update_tenant(tenant_id, payload)


@router.patch("/{tenant_id}/status", response_model=TenantOut)
def set_tenant_status(
    tenant_id: str,
    payload: TenantStatusUpdateRequest,
    tenant_service: TenantService = Depends(get_tenant_service),
    _current_user=Depends(require_roles(RoleCode.SUPER_ADMIN)),
) -> TenantOut:
    return tenant_service.set_active(tenant_id, payload.is_active)


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tenant(
    tenant_id: str,
    tenant_service: TenantService = Depends(get_tenant_service),
    _current_user=Depends(require_roles(RoleCode.SUPER_ADMIN)),
) -> None:
    tenant_service.delete_tenant(tenant_id)


@router.post("/logo", response_model=LogoUploadResponse)
async def upload_tenant_logo(
    file: UploadFile = File(...),
    tenant_service: TenantService = Depends(get_tenant_service),
    _current_user=Depends(require_roles(RoleCode.SUPER_ADMIN)),
) -> LogoUploadResponse:
    return await tenant_service.upload_logo(file)


@invitation_router.get("/{token}", response_model=InvitationDetailOut)
def get_invitation(
    token: str, tenant_service: TenantService = Depends(get_tenant_service)
) -> InvitationDetailOut:
    return tenant_service.get_invitation_detail(token)


@invitation_router.post("/{token}/accept", response_model=LoginResponse)
def accept_invitation(
    token: str,
    payload: AcceptInvitationRequest,
    tenant_service: TenantService = Depends(get_tenant_service),
) -> LoginResponse:
    return tenant_service.accept_invitation(token, payload.password)
