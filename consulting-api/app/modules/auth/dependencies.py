from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import InvalidAccessTokenError
from app.core.security import TokenError, TokenType, decode_token
from app.modules.auth.schemas import UserOut
from app.modules.auth.service import AuthService

bearer_scheme = HTTPBearer(auto_error=False)


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> UserOut:
    if credentials is None:
        raise InvalidAccessTokenError("Missing authentication credentials")

    try:
        payload = decode_token(credentials.credentials, TokenType.ACCESS)
    except TokenError as exc:
        raise InvalidAccessTokenError() from exc

    return auth_service.get_current_user(payload["sub"])
