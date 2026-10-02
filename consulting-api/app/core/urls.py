from app.core.config import get_settings

settings = get_settings()


def build_frontend_url(subdomain: str | None, path: str) -> str:
    host = (
        f"{subdomain}.{settings.frontend_base_domain}"
        if subdomain
        else settings.frontend_base_domain
    )
    return f"{settings.frontend_scheme}://{host}{path}"
