from collections.abc import Generator

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.api.auth import register_user
from app.db import get_session
from app.main import app
from app.schemas.auth import UserCreate


@pytest.fixture
def client() -> Generator[TestClient]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    def get_test_session() -> Generator[Session]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = get_test_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_register_creates_user_without_issuing_token(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register",
        json={"username": " Demo_User ", "password": "password123"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["username"] == "demo_user"
    assert "id" in body
    assert "access_token" not in body


def test_register_rejects_duplicate_normalized_username(client: TestClient) -> None:
    first_response = client.post(
        "/api/auth/register",
        json={"username": "demo_user", "password": "password123"},
    )
    second_response = client.post(
        "/api/auth/register",
        json={"username": " DEMO_USER ", "password": "password123"},
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 400
    assert second_response.json()["detail"] == "Username already registered"


def test_register_rejects_passwords_longer_than_bcrypt_limit(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/auth/register",
        json={"username": "demo_user", "password": "p" * 73},
    )

    assert response.status_code == 422


def test_register_rejects_multibyte_passwords_longer_than_bcrypt_limit(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/auth/register",
        json={"username": "demo_user", "password": "é" * 37},
    )

    assert response.status_code == 422


def test_register_converts_unique_constraint_race_to_duplicate_error() -> None:
    class EmptyResult:
        def first(self) -> None:
            return None

    class RaceSession:
        rolled_back = False

        def exec(self, statement: object) -> EmptyResult:
            return EmptyResult()

        def add(self, instance: object) -> None:
            pass

        def commit(self) -> None:
            raise IntegrityError("insert user", {}, Exception("duplicate username"))

        def rollback(self) -> None:
            self.rolled_back = True

    session = RaceSession()

    with pytest.raises(HTTPException) as exc_info:
        register_user(UserCreate(username="demo_user", password="password123"), session)  # type: ignore[arg-type]

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Username already registered"
    assert session.rolled_back


def test_login_issues_bearer_token_and_me_returns_current_user(
    client: TestClient,
) -> None:
    register_response = client.post(
        "/api/auth/register",
        json={"username": "demo_user", "password": "password123"},
    )

    login_response = client.post(
        "/api/auth/login",
        json={"username": " demo_USER ", "password": "password123"},
    )

    assert register_response.status_code == 201
    assert login_response.status_code == 200
    token_body = login_response.json()
    assert token_body["token_type"] == "bearer"
    assert token_body["access_token"]

    me_response = client.get(
        "/api/me",
        headers={"Authorization": f"Bearer {token_body['access_token']}"},
    )

    assert me_response.status_code == 200
    assert me_response.json() == register_response.json()


def test_login_rejects_invalid_credentials(client: TestClient) -> None:
    client.post(
        "/api/auth/register",
        json={"username": "demo_user", "password": "password123"},
    )

    response = client.post(
        "/api/auth/login",
        json={"username": "demo_user", "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid username or password"


def test_me_requires_valid_bearer_token(client: TestClient) -> None:
    missing_response = client.get("/api/me")
    invalid_response = client.get(
        "/api/me",
        headers={"Authorization": "Bearer not-a-valid-token"},
    )

    assert missing_response.status_code == 401
    assert invalid_response.status_code == 401
