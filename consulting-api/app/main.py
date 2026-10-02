import logging
import re

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.core.exceptions import AppError
from app.core.logging import configure_logging
from app.core.redis import ping_redis
from app.modules.access.router import router as access_router
from app.modules.auth.router import router as auth_router
from app.modules.employees.router import router as employees_router
from app.modules.requirements.router import router as requirements_router
from app.modules.tenants.router import invitation_router
from app.modules.tenants.router import router as tenants_router

settings = get_settings()
configure_logging()

app = FastAPI(title=settings.app_name, debug=settings.debug)

# allow_origins covers explicit entries; allow_origin_regex additionally
# accepts any tenant subdomain of frontend_base_domain (e.g.
# https://acme.localhost:5173), since those can't be enumerated as a list.
_subdomain_origin_pattern = rf"^https?://([a-z0-9-]+\.)?{re.escape(settings.frontend_base_domain)}$"

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=_subdomain_origin_pattern,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": {"code": exc.code, "message": exc.message}},
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "Invalid request payload"},
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": {"code": "HTTP_ERROR", "message": str(exc.detail)}},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    logging.getLogger(__name__).exception("Unhandled exception", exc_info=exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"},
        },
    )


app.include_router(auth_router)
app.include_router(tenants_router)
app.include_router(invitation_router)
app.include_router(employees_router)
app.include_router(access_router)
app.include_router(requirements_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/health/ready")
async def health_ready() -> JSONResponse:
    checks = {"database": _check_database(), "redis": await ping_redis()}
    healthy = all(checks.values())
    return JSONResponse(
        status_code=status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"status": "ok" if healthy else "degraded", "checks": checks},
    )


def _check_database() -> bool:
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            return True
        finally:
            db.close()
    except Exception:
        return False
