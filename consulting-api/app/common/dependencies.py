"""Cross-module dependencies shared by future business modules.

Auth-specific dependencies (token decoding, current-user resolution) live in
app.modules.auth.dependencies; this module re-exports what other modules
need without importing auth internals directly, and is the home for
generic, non-auth-specific dependencies as they're added.
"""

from fastapi import Depends, Request, status

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserOut

settings = get_settings()


def get_tenant_slug(request: Request) -> str | None:
    """Resolves which tenant subdomain a request is for.

    The frontend and API are separate origins, so the API can't rely on the
    inbound Host header reflecting the tenant subdomain the browser is on —
    the frontend sends it explicitly via X-Tenant-Subdomain instead. Host is
    still checked as a fallback, for topologies where the API itself is
    served per-subdomain.
    """
    header_value = request.headers.get("x-tenant-subdomain")
    if header_value:
        return header_value.strip().lower() or None

    hostname = request.headers.get("host", "").split(":")[0].lower()
    base = settings.app_base_domain.lower()
    if not hostname or hostname == base or not hostname.endswith(f".{base}"):
        return None
    return hostname[: -(len(base) + 1)] or None


def require_roles(*allowed_codes: str):
    """Dependency factory: restrict an endpoint to users holding any of the given role codes."""

    def _check(current_user: UserOut = Depends(get_current_user)) -> UserOut:
        user_role_codes = {role.code for role in current_user.roles}
        if not user_role_codes.intersection(allowed_codes):
            raise AppError(
                "You do not have permission to perform this action",
                code="FORBIDDEN",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        return current_user

    return _check
