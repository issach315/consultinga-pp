from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import (
    InvalidAccessTokenError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
)
from app.core.security import (
    TokenError,
    TokenType,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token,
    verify_password,
)
from app.modules.auth.models import User
from app.modules.auth.repository import RefreshTokenRepository, UserRepository
from app.modules.auth.schemas import LoginResponse, TokenPairOut, UserOut
from app.modules.tenants.repository import TenantRepository

settings = get_settings()


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.refresh_tokens = RefreshTokenRepository(db)
        self.tenants = TenantRepository(db)

    def _authenticate(self, email: str, password: str) -> User:
        user = self.users.get_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            raise InvalidCredentialsError()
        if not user.is_active:
            raise InvalidCredentialsError()
        if not self.users.has_active_role(user):
            raise InvalidCredentialsError()
        return user

    def issue_token_pair(self, user_id: str) -> TokenPairOut:
        """Public: also used by other modules (e.g. tenant invite acceptance)
        to auto-login a user right after a non-login authentication event."""
        access_token, _, _ = create_access_token(user_id)
        refresh_token, _, refresh_expires_at = create_refresh_token(user_id)

        self.refresh_tokens.create(
            user_id=user_id,
            token_hash=hash_token(refresh_token),
            expires_at=refresh_expires_at,
        )
        self.db.commit()

        return TokenPairOut(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.access_token_expire_minutes * 60,
            refresh_expires_in=settings.refresh_token_expire_days * 86400,
        )

    def login(self, email: str, password: str, tenant_slug: str | None = None) -> LoginResponse:
        user = self._authenticate(email, password)
        self._enforce_tenant_scope(user, tenant_slug)
        tokens = self.issue_token_pair(user.id)
        return LoginResponse(**tokens.model_dump(), user=UserOut.model_validate(user))

    def _enforce_tenant_scope(self, user: User, tenant_slug: str | None) -> None:
        """Restricts login to the workspace the request came in on: the root
        domain (no subdomain) is platform-level and only super admins (users
        with no tenant_id) may use it; a tenant subdomain only accepts that
        tenant's own users. Always raises the same generic credentials error
        so this can't be used to probe for valid tenants or emails."""
        if tenant_slug is None:
            if user.tenant_id is not None:
                raise InvalidCredentialsError()
            return

        tenant = self.tenants.get_by_subdomain(tenant_slug)
        if tenant is None or not tenant.is_active or user.tenant_id != tenant.id:
            raise InvalidCredentialsError()

    def refresh(self, refresh_token: str) -> TokenPairOut:
        try:
            payload = decode_token(refresh_token, TokenType.REFRESH)
        except TokenError as exc:
            raise InvalidRefreshTokenError() from exc

        user_id = payload["sub"]
        token_hash = hash_token(refresh_token)
        stored_token = self.refresh_tokens.get_by_hash(token_hash)

        if stored_token is None or stored_token.user_id != user_id:
            raise InvalidRefreshTokenError()
        if stored_token.is_revoked:
            raise InvalidRefreshTokenError()
        if stored_token.expires_at.replace(tzinfo=UTC) < datetime.now(UTC):
            raise InvalidRefreshTokenError()

        user = self.users.get_by_id(user_id)
        if user is None or not user.is_active:
            raise InvalidRefreshTokenError()

        # Rotate: revoke the presented token before issuing a new pair.
        self.refresh_tokens.revoke(stored_token)
        self.db.commit()

        return self.issue_token_pair(user.id)

    def logout(self, refresh_token: str) -> None:
        try:
            payload = decode_token(refresh_token, TokenType.REFRESH)
        except TokenError as exc:
            raise InvalidRefreshTokenError() from exc

        token_hash = hash_token(refresh_token)
        stored_token = self.refresh_tokens.get_by_hash(token_hash)
        if stored_token is None or stored_token.user_id != payload["sub"]:
            raise InvalidRefreshTokenError()

        if not stored_token.is_revoked:
            self.refresh_tokens.revoke(stored_token)
            self.db.commit()

    def get_current_user(self, user_id: str) -> UserOut:
        user = self.users.get_by_id(user_id)
        if user is None or not user.is_active:
            raise InvalidAccessTokenError()
        return UserOut.model_validate(user)
