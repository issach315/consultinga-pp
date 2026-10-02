from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.tenants.service import TenantService


def get_tenant_service(db: Session = Depends(get_db)) -> TenantService:
    return TenantService(db)
