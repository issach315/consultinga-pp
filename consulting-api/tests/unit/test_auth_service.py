from datetime import UTC, datetime, timedelta

import pytest

from app.core.exceptions import InvalidCredentialsError, InvalidRefreshTokenError
from app.core.security import create_refresh_token, hash_token
from app.modules.auth.repository import RefreshTokenRepository
from app.modules.auth.service import AuthService


def test_login_succeeds_with_valid_credentials(db_session, make_user) -> None:
    make_user(email="admin@consulting.com", password="SuperSecret123!")
    service = AuthService(db_session)

    response = service.login("admin@consulting.com", "SuperSecret123!")

    assert response.access_token
    assert response.refresh_token
    assert response.user.email == "admin@consulting.com"


def test_login_fails_with_unknown_email(db_session, seed_roles) -> None:
    service = AuthService(db_session)
    with pytest.raises(InvalidCredentialsError):
        service.login("nobody@consulting.com", "whatever")


def test_login_fails_with_wrong_password(db_session, make_user) -> None:
    make_user(email="admin@consulting.com", password="SuperSecret123!")
    service = AuthService(db_session)
    with pytest.raises(InvalidCredentialsError):
        service.login("admin@consulting.com", "wrong-password")


def test_login_fails_for_inactive_user(db_session, make_user) -> None:
    make_user(email="admin@consulting.com", password="SuperSecret123!", is_active=False)
    service = AuthService(db_session)
    with pytest.raises(InvalidCredentialsError):
        service.login("admin@consulting.com", "SuperSecret123!")


def test_login_fails_for_user_without_active_role(db_session, make_user, seed_roles) -> None:
    seed_roles["SUPER_ADMIN"].is_active = False
    db_session.commit()
    make_user(email="admin@consulting.com", password="SuperSecret123!", role_codes=["SUPER_ADMIN"])
    service = AuthService(db_session)
    with pytest.raises(InvalidCredentialsError):
        service.login("admin@consulting.com", "SuperSecret123!")


def test_login_returns_all_assigned_roles(db_session, make_user) -> None:
    make_user(
        email="admin@consulting.com",
        password="SuperSecret123!",
        role_codes=["SUPER_ADMIN", "TENANT_ADMIN"],
    )
    service = AuthService(db_session)

    response = service.login("admin@consulting.com", "SuperSecret123!")

    role_codes = {role.code for role in response.user.roles}
    assert role_codes == {"SUPER_ADMIN", "TENANT_ADMIN"}


def test_refresh_rotates_token_and_revokes_old_one(db_session, make_user) -> None:
    user = make_user()
    service = AuthService(db_session)
    login_response = service.login(user.email, "SuperSecret123!")

    refreshed = service.refresh(login_response.refresh_token)

    assert refreshed.refresh_token != login_response.refresh_token
    with pytest.raises(InvalidRefreshTokenError):
        service.refresh(login_response.refresh_token)


def test_refresh_fails_for_revoked_token(db_session, make_user) -> None:
    user = make_user()
    service = AuthService(db_session)
    login_response = service.login(user.email, "SuperSecret123!")

    service.logout(login_response.refresh_token)

    with pytest.raises(InvalidRefreshTokenError):
        service.refresh(login_response.refresh_token)


def test_refresh_fails_for_expired_token(db_session, make_user) -> None:
    user = make_user()
    token, _, _ = create_refresh_token(user.id)
    repo = RefreshTokenRepository(db_session)
    repo.create(user.id, hash_token(token), datetime.now(UTC) - timedelta(days=1))
    db_session.commit()

    service = AuthService(db_session)
    with pytest.raises(InvalidRefreshTokenError):
        service.refresh(token)


def test_refresh_fails_for_inactive_user(db_session, make_user) -> None:
    user = make_user()
    service = AuthService(db_session)
    login_response = service.login(user.email, "SuperSecret123!")

    user.is_active = False
    db_session.commit()

    with pytest.raises(InvalidRefreshTokenError):
        service.refresh(login_response.refresh_token)


def test_logout_revokes_refresh_token(db_session, make_user) -> None:
    user = make_user()
    service = AuthService(db_session)
    login_response = service.login(user.email, "SuperSecret123!")

    service.logout(login_response.refresh_token)

    repo = RefreshTokenRepository(db_session)
    stored = repo.get_by_hash(hash_token(login_response.refresh_token))
    assert stored.is_revoked is True


def test_login_succeeds_for_tenant_admin_on_own_subdomain(db_session, make_tenant) -> None:
    _tenant, admin = make_tenant(subdomain="acme")
    service = AuthService(db_session)

    response = service.login(admin.email, "SuperSecret123!", tenant_slug="acme")

    assert response.user.email == admin.email


def test_login_fails_for_tenant_admin_on_root_domain(db_session, make_tenant) -> None:
    _tenant, admin = make_tenant(subdomain="acme")
    service = AuthService(db_session)

    with pytest.raises(InvalidCredentialsError):
        service.login(admin.email, "SuperSecret123!", tenant_slug=None)


def test_login_fails_for_tenant_admin_on_different_subdomain(db_session, make_tenant) -> None:
    _acme, admin = make_tenant(subdomain="acme")
    make_tenant(subdomain="globex", tenant_code="GLOBEX001", admin_email="admin@globex.com")
    service = AuthService(db_session)

    with pytest.raises(InvalidCredentialsError):
        service.login(admin.email, "SuperSecret123!", tenant_slug="globex")


def test_login_fails_for_super_admin_on_tenant_subdomain(
    db_session, make_user, make_tenant
) -> None:
    make_tenant(subdomain="acme")
    super_admin = make_user(email="super@consulting.com", password="SuperSecret123!")
    service = AuthService(db_session)

    with pytest.raises(InvalidCredentialsError):
        service.login(super_admin.email, "SuperSecret123!", tenant_slug="acme")


def test_login_succeeds_for_super_admin_on_root_domain(db_session, make_user) -> None:
    super_admin = make_user(email="super@consulting.com", password="SuperSecret123!")
    service = AuthService(db_session)

    response = service.login(super_admin.email, "SuperSecret123!", tenant_slug=None)

    assert response.user.email == super_admin.email


def test_login_fails_for_unknown_tenant_subdomain(db_session, make_user) -> None:
    admin = make_user(email="super@consulting.com", password="SuperSecret123!")
    service = AuthService(db_session)

    with pytest.raises(InvalidCredentialsError):
        service.login(admin.email, "SuperSecret123!", tenant_slug="doesnotexist")


def test_login_fails_for_tenant_admin_on_inactive_tenant(db_session, make_tenant) -> None:
    _tenant, admin = make_tenant(subdomain="acme", is_active=False)
    service = AuthService(db_session)

    with pytest.raises(InvalidCredentialsError):
        service.login(admin.email, "SuperSecret123!", tenant_slug="acme")


def test_revoked_refresh_token_cannot_be_reused_for_logout(db_session, make_user) -> None:
    user = make_user()
    service = AuthService(db_session)
    login_response = service.login(user.email, "SuperSecret123!")

    service.logout(login_response.refresh_token)
    # Logging out an already-revoked token is idempotent, not an error.
    service.logout(login_response.refresh_token)

    with pytest.raises(InvalidRefreshTokenError):
        service.refresh(login_response.refresh_token)
