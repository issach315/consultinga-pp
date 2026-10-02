import os
from collections.abc import Generator

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-with-at-least-32-bytes-of-entropy")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import hash_password
from app.main import app
from app.modules.auth.constants import SEED_ROLES
from app.modules.auth.models import Role, User, UserRole
from app.modules.tenants.models import Tenant

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


@pytest.fixture(autouse=True)
def _db_schema() -> Generator[None]:
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session() -> Generator[Session]:
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def seed_roles(db_session: Session) -> dict[str, Role]:
    roles = {}
    for seed in SEED_ROLES:
        role = Role(
            code=seed["code"],
            name=seed["name"],
            description=seed["description"],
            is_active=True,
            is_system_role=True,
        )
        db_session.add(role)
        roles[seed["code"]] = role
    db_session.commit()
    for role in roles.values():
        db_session.refresh(role)
    return roles


@pytest.fixture
def make_user(db_session: Session, seed_roles: dict[str, Role]):
    def _make_user(
        email: str = "admin@consulting.com",
        password: str = "SuperSecret123!",
        is_active: bool = True,
        role_codes: list[str] | None = None,
        first_name: str = "John",
        last_name: str = "Admin",
    ) -> User:
        user = User(
            email=email.lower(),
            password_hash=hash_password(password),
            first_name=first_name,
            last_name=last_name,
            is_active=is_active,
        )
        db_session.add(user)
        db_session.flush()

        for code in role_codes if role_codes is not None else ["SUPER_ADMIN"]:
            db_session.add(UserRole(user_id=user.id, role_id=seed_roles[code].id))

        db_session.commit()
        db_session.refresh(user)
        return user

    return _make_user


@pytest.fixture
def make_tenant(db_session: Session, seed_roles: dict[str, Role]):
    def _make_tenant(
        subdomain: str = "acme",
        tenant_code: str = "ACME001",
        admin_email: str = "admin@acme.com",
        admin_password: str = "SuperSecret123!",
        is_active: bool = True,
        tenant_type: str = "Domestic",
        enabled_modules: list[str] | None = None,
        employee_id_prefix: str = "ACM",
    ) -> tuple[Tenant, User]:
        admin_user = User(
            email=admin_email.lower(),
            password_hash=hash_password(admin_password),
            first_name="Tenant",
            last_name="Admin",
            is_active=True,
        )
        db_session.add(admin_user)
        db_session.flush()
        db_session.add(UserRole(user_id=admin_user.id, role_id=seed_roles["TENANT_ADMIN"].id))

        tenant = Tenant(
            legal_company_name=f"{subdomain.title()} Inc",
            tenant_code=tenant_code,
            subdomain=subdomain,
            tenant_type=tenant_type,
            enabled_modules=enabled_modules if enabled_modules is not None else [],
            plan="Starter",
            employee_limit=10,
            admin_user_id=admin_user.id,
            is_active=is_active,
            employee_id_prefix=employee_id_prefix,
        )
        db_session.add(tenant)
        db_session.flush()
        admin_user.tenant_id = tenant.id

        db_session.commit()
        db_session.refresh(tenant)
        db_session.refresh(admin_user)
        return tenant, admin_user

    return _make_tenant


@pytest.fixture
def client() -> Generator[TestClient]:
    def _override_get_db() -> Generator[Session]:
        session = TestSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
