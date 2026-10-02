import hashlib
import uuid
from datetime import UTC, datetime, timedelta
from enum import StrEnum
from typing import Any

import jwt
from pwdlib import PasswordHash

from app.core.config import get_settings

settings = get_settings()

_password_hasher = PasswordHash.recommended()


class TokenType(StrEnum):
    ACCESS = "access"
    REFRESH = "refresh"


class TokenError(Exception):
    """Raised when a JWT cannot be decoded or fails validation."""


def hash_password(plain_password: str) -> str:
    return _password_hasher.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return _password_hasher.verify(plain_password, password_hash)


def hash_token(token: str) -> str:
    """Deterministic one-way hash for opaque tokens stored at rest
    (refresh tokens, invitation tokens) so the raw value is never persisted."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _create_token(
    subject: str, token_type: TokenType, expires_delta: timedelta
) -> tuple[str, str, datetime]:
    now = datetime.now(UTC)
    expires_at = now + expires_delta
    jti = str(uuid.uuid4())
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type.value,
        "jti": jti,
        "iat": now,
        "exp": expires_at,
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, jti, expires_at


def create_access_token(user_id: str) -> tuple[str, str, datetime]:
    return _create_token(
        user_id, TokenType.ACCESS, timedelta(minutes=settings.access_token_expire_minutes)
    )


def create_refresh_token(user_id: str) -> tuple[str, str, datetime]:
    return _create_token(
        user_id, TokenType.REFRESH, timedelta(days=settings.refresh_token_expire_days)
    )


def decode_token(token: str, expected_type: TokenType) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise TokenError("Token is invalid or expired") from exc

    if payload.get("type") != expected_type.value:
        raise TokenError(f"Expected a {expected_type.value} token")

    return payload
