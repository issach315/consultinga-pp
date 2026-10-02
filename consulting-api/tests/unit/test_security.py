from datetime import timedelta

import jwt
import pytest

from app.core.config import get_settings
from app.core.security import (
    TokenError,
    TokenType,
    _create_token,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

settings = get_settings()


def test_password_hash_is_not_plaintext() -> None:
    hashed = hash_password("correct horse battery staple")
    assert hashed != "correct horse battery staple"


def test_password_verification_succeeds_for_correct_password() -> None:
    hashed = hash_password("correct horse battery staple")
    assert verify_password("correct horse battery staple", hashed) is True


def test_password_verification_fails_for_incorrect_password() -> None:
    hashed = hash_password("correct horse battery staple")
    assert verify_password("wrong password", hashed) is False


def test_access_token_is_valid_and_typed_correctly() -> None:
    token, _, _ = create_access_token("user-123")
    payload = decode_token(token, TokenType.ACCESS)
    assert payload["sub"] == "user-123"
    assert payload["type"] == "access"


def test_refresh_token_is_valid_and_typed_correctly() -> None:
    token, _, _ = create_refresh_token("user-123")
    payload = decode_token(token, TokenType.REFRESH)
    assert payload["sub"] == "user-123"
    assert payload["type"] == "refresh"


def test_refresh_token_rejected_when_decoded_as_access() -> None:
    token, _, _ = create_refresh_token("user-123")
    with pytest.raises(TokenError):
        decode_token(token, TokenType.ACCESS)


def test_access_token_rejected_when_decoded_as_refresh() -> None:
    token, _, _ = create_access_token("user-123")
    with pytest.raises(TokenError):
        decode_token(token, TokenType.REFRESH)


def test_expired_access_token_is_rejected() -> None:
    token, _, _ = _create_token("user-123", TokenType.ACCESS, timedelta(seconds=-1))
    with pytest.raises(TokenError):
        decode_token(token, TokenType.ACCESS)


def test_invalid_signature_is_rejected() -> None:
    token = jwt.encode(
        {"sub": "user-123", "type": "access"},
        "a-different-secret",
        algorithm=settings.jwt_algorithm,
    )
    with pytest.raises(TokenError):
        decode_token(token, TokenType.ACCESS)


def test_malformed_token_is_rejected() -> None:
    with pytest.raises(TokenError):
        decode_token("not-a-real-token", TokenType.ACCESS)
