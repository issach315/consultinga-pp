from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.modules.auth.models import RefreshToken, Role, User, UserRole


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        stmt = (
            select(User)
            .options(joinedload(User.user_roles).joinedload(UserRole.role))
            .where(User.email == email.lower().strip())
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def get_by_id(self, user_id: str) -> User | None:
        stmt = (
            select(User)
            .options(joinedload(User.user_roles).joinedload(UserRole.role))
            .where(User.id == user_id)
        )
        return self.db.execute(stmt).unique().scalar_one_or_none()

    def get_by_ids(self, user_ids: list[str]) -> list[User]:
        if not user_ids:
            return []
        stmt = select(User).where(User.id.in_(user_ids))
        return list(self.db.execute(stmt).scalars())

    def has_active_role(self, user: User) -> bool:
        return any(user_role.role.is_active for user_role in user.user_roles)


class RoleRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_code(self, code: str) -> Role | None:
        stmt = select(Role).where(Role.code == code)
        return self.db.execute(stmt).scalar_one_or_none()


class RefreshTokenRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, user_id: str, token_hash: str, expires_at: datetime) -> RefreshToken:
        refresh_token = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.db.add(refresh_token)
        self.db.flush()
        return refresh_token

    def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        return self.db.execute(stmt).scalar_one_or_none()

    def revoke(self, refresh_token: RefreshToken) -> None:
        refresh_token.revoked_at = datetime.now(UTC)
        self.db.flush()

    def revoke_all_for_user(self, user_id: str) -> None:
        stmt = select(RefreshToken).where(
            RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None)
        )
        for token in self.db.execute(stmt).scalars():
            token.revoked_at = datetime.now(UTC)
        self.db.flush()
