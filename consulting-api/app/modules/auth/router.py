from fastapi import APIRouter, Depends, status

from app.common.dependencies import get_tenant_slug
from app.modules.auth.dependencies import get_auth_service, get_current_user
from app.modules.auth.schemas import (
    LoginRequest,
    LoginResponse,
    LogoutRequest,
    MessageResponse,
    RefreshRequest,
    TokenPairOut,
    UserOut,
)
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(
    payload: LoginRequest,
    tenant_slug: str | None = Depends(get_tenant_slug),
    auth_service: AuthService = Depends(get_auth_service),
) -> LoginResponse:
    return auth_service.login(payload.email, payload.password, tenant_slug)


@router.post("/refresh", response_model=TokenPairOut)
def refresh(
    payload: RefreshRequest, auth_service: AuthService = Depends(get_auth_service)
) -> TokenPairOut:
    return auth_service.refresh(payload.refresh_token)


@router.post("/logout", response_model=MessageResponse)
def logout(
    payload: LogoutRequest, auth_service: AuthService = Depends(get_auth_service)
) -> MessageResponse:
    auth_service.logout(payload.refresh_token)
    return MessageResponse(message="Successfully logged out")


@router.get("/me", response_model=UserOut, status_code=status.HTTP_200_OK)
def me(current_user: UserOut = Depends(get_current_user)) -> UserOut:
    return current_user
