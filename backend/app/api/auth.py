from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.db import get_session
from app.models import User
from app.schemas.auth import Token, UserCreate, UserLogin, UserRead


router = APIRouter(tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def authentication_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: Annotated[Session, Depends(get_session)],
) -> User:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        subject = payload.get("sub")
        if subject is None:
            raise authentication_error()
        user_id = UUID(subject)
    except (JWTError, ValueError):
        raise authentication_error() from None

    user = session.get(User, user_id)
    if user is None:
        raise authentication_error()
    return user


@router.post(
    "/auth/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    payload: UserCreate,
    session: Annotated[Session, Depends(get_session)],
) -> User:
    existing_user = session.exec(
        select(User).where(User.username == payload.username),
    ).first()
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    user = User(
        username=payload.username,
        hashed_password=hash_password(payload.password),
    )
    session.add(user)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        ) from None
    session.refresh(user)
    return user


@router.post("/auth/login", response_model=Token)
def login_user(
    payload: UserLogin,
    session: Annotated[Session, Depends(get_session)],
) -> Token:
    user = session.exec(select(User).where(User.username == payload.username)).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return Token(access_token=create_access_token(str(user.id)))


@router.get("/me", response_model=UserRead)
def read_current_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    return current_user
