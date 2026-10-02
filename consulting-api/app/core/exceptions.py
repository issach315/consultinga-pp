from fastapi import status


class AppError(Exception):
    """Base application error, rendered as the standard error envelope."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    code: str = "APP_ERROR"

    def __init__(
        self, message: str, code: str | None = None, status_code: int | None = None
    ) -> None:
        self.message = message
        if code is not None:
            self.code = code
        if status_code is not None:
            self.status_code = status_code
        super().__init__(message)


class InvalidCredentialsError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "INVALID_CREDENTIALS"

    def __init__(self, message: str = "Invalid email or password") -> None:
        super().__init__(message)


class InactiveUserError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "INVALID_CREDENTIALS"

    def __init__(self, message: str = "Invalid email or password") -> None:
        super().__init__(message)


class InvalidAccessTokenError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "INVALID_ACCESS_TOKEN"

    def __init__(self, message: str = "Access token is invalid or expired") -> None:
        super().__init__(message)


class InvalidRefreshTokenError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "INVALID_REFRESH_TOKEN"

    def __init__(self, message: str = "Refresh token is invalid or expired") -> None:
        super().__init__(message)


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "NOT_FOUND"


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    code = "CONFLICT"


class InvalidInvitationError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST
    code = "INVALID_INVITATION"

    def __init__(self, message: str = "This invitation link is invalid or has expired") -> None:
        super().__init__(message)
