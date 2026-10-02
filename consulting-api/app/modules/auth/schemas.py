from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    name: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    first_name: str
    last_name: str
    is_active: bool
    tenant_id: str | None = None
    roles: list[RoleOut] = Field(default_factory=list)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class TokenPairOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_expires_in: int


class LoginResponse(TokenPairOut):
    user: UserOut


class MessageResponse(BaseModel):
    message: str
