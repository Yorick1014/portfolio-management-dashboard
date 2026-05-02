from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


def normalize_username(username: str) -> str:
    return username.strip().lower()


class UserCredentials(BaseModel):
    username: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=72)

    @field_validator("username")
    @classmethod
    def normalize_username_field(cls, value: str) -> str:
        normalized = normalize_username(value)
        if not normalized:
            msg = "Username must not be empty"
            raise ValueError(msg)
        return normalized

    @field_validator("password")
    @classmethod
    def validate_bcrypt_password_length(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            msg = "Password must be 72 bytes or fewer"
            raise ValueError(msg)
        return value


class UserCreate(UserCredentials):
    pass


class UserLogin(UserCredentials):
    pass


class UserRead(BaseModel):
    id: UUID
    username: str

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
