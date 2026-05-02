from datetime import UTC, datetime, timedelta

import bcrypt
from jose import jwt

from app.core.config import get_settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def create_access_token(subject: str) -> str:
    settings = get_settings()
    expires_at = datetime.now(UTC) + timedelta(
        minutes=settings.access_token_expire_minutes,
    )
    payload = {"sub": subject, "exp": expires_at}
    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
