from fastapi import APIRouter, Depends

from app.modules.access.dependencies import get_access_service
from app.modules.access.schemas import EffectiveAccessOut
from app.modules.access.service import AccessService
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserOut

router = APIRouter(prefix="/api/v1/access", tags=["access"])


@router.get("/me", response_model=EffectiveAccessOut)
def get_my_access(
    current_user: UserOut = Depends(get_current_user),
    access_service: AccessService = Depends(get_access_service),
) -> EffectiveAccessOut:
    return access_service.compute_effective_access(current_user)
