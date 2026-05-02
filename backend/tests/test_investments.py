from collections.abc import Generator
from decimal import Decimal
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from app.db import get_session
from app.main import app
from app.models import Investment, Transaction, TransactionType, User


@pytest.fixture
def client_and_session() -> Generator[tuple[TestClient, Session]]:
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
    with Session(engine) as inspection_session:
        with TestClient(app) as test_client:
            yield test_client, inspection_session
    app.dependency_overrides.clear()


def auth_headers(client: TestClient, username: str = "demo_user") -> dict[str, str]:
    client.post(
        "/api/auth/register",
        json={"username": username, "password": "password123"},
    )
    response = client.post(
        "/api/auth/login",
        json={"username": username, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_investment_creates_initial_buy_and_calculated_response(
    client_and_session: tuple[TestClient, Session],
) -> None:
    client, session = client_and_session
    headers = auth_headers(client)

    response = client.post(
        "/api/investments",
        headers=headers,
        json={
            "name": "Apple Inc.",
            "symbol": " aapl ",
            "asset_type": "STOCK",
            "current_price": "180.00",
            "initial_quantity": "10",
            "initial_purchase_price": "150.00",
            "transaction_date": "2026-05-01",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Apple Inc."
    assert body["symbol"] == "AAPL"
    assert body["asset_type"] == "STOCK"
    assert body["current_price"] == "180.0000"
    assert body["current_quantity"] == "10.000000"
    assert body["average_buy_price"] == "150.0000"
    assert body["estimated_cost_basis"] == "1500.0000"
    assert body["current_value"] == "1800.0000"
    assert body["gain_loss"] == "300.0000"
    assert body["performance_percentage"] == "20.0000"

    investment = session.get(Investment, UUID(body["id"]))
    user = session.exec(select(User).where(User.username == "demo_user")).one()
    transactions = session.exec(select(Transaction)).all()
    assert investment is not None
    assert investment.user_id == user.id
    assert len(transactions) == 1
    assert transactions[0].investment_id == investment.id
    assert transactions[0].user_id == user.id
    assert transactions[0].transaction_type == TransactionType.BUY
    assert transactions[0].quantity == Decimal("10.000000")
    assert transactions[0].price == Decimal("150.0000")


def test_list_and_update_investments_are_scoped_to_current_user(
    client_and_session: tuple[TestClient, Session],
) -> None:
    client, session = client_and_session
    first_headers = auth_headers(client, "first_user")
    second_headers = auth_headers(client, "second_user")

    create_response = client.post(
        "/api/investments",
        headers=first_headers,
        json={
            "name": "Apple Inc.",
            "symbol": "AAPL",
            "asset_type": "STOCK",
            "current_price": "180.00",
            "initial_quantity": "10",
            "initial_purchase_price": "150.00",
            "transaction_date": "2026-05-01",
        },
    )
    investment_id = create_response.json()["id"]

    list_response = client.get("/api/investments", headers=first_headers)
    other_list_response = client.get("/api/investments", headers=second_headers)
    forbidden_update_response = client.put(
        f"/api/investments/{investment_id}",
        headers=second_headers,
        json={
            "name": "Apple Inc.",
            "symbol": "AAPL",
            "asset_type": "STOCK",
            "current_price": "185.00",
        },
    )
    update_response = client.put(
        f"/api/investments/{investment_id}",
        headers=first_headers,
        json={
            "name": "Apple Computer",
            "symbol": "AAPL",
            "asset_type": "STOCK",
            "current_price": "185.00",
        },
    )

    assert create_response.status_code == 201
    assert list_response.status_code == 200
    assert [item["id"] for item in list_response.json()] == [investment_id]
    assert other_list_response.status_code == 200
    assert other_list_response.json() == []
    assert forbidden_update_response.status_code == 404
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Apple Computer"
    assert update_response.json()["current_price"] == "185.0000"

    session.expire_all()
    investment = session.get(Investment, UUID(investment_id))
    assert investment is not None
    assert investment.current_price == Decimal("185.0000")


def test_delete_investment_hard_deletes_owned_investment_and_transactions(
    client_and_session: tuple[TestClient, Session],
) -> None:
    client, session = client_and_session
    headers = auth_headers(client)

    create_response = client.post(
        "/api/investments",
        headers=headers,
        json={
            "name": "Apple Inc.",
            "symbol": "AAPL",
            "asset_type": "STOCK",
            "current_price": "180.00",
            "initial_quantity": "10",
            "initial_purchase_price": "150.00",
            "transaction_date": "2026-05-01",
        },
    )
    investment_id = create_response.json()["id"]

    response = client.delete(f"/api/investments/{investment_id}", headers=headers)

    assert response.status_code == 200
    assert response.json() == {"message": "Investment deleted"}
    session.expire_all()
    assert session.get(Investment, UUID(investment_id)) is None
    assert session.exec(select(Transaction)).all() == []


def test_investment_create_rejects_duplicate_symbols_and_non_positive_values(
    client_and_session: tuple[TestClient, Session],
) -> None:
    client, _session = client_and_session
    headers = auth_headers(client)
    payload = {
        "name": "Apple Inc.",
        "symbol": "AAPL",
        "asset_type": "STOCK",
        "current_price": "180.00",
        "initial_quantity": "10",
        "initial_purchase_price": "150.00",
        "transaction_date": "2026-05-01",
    }

    first_response = client.post("/api/investments", headers=headers, json=payload)
    duplicate_response = client.post("/api/investments", headers=headers, json=payload)
    invalid_response = client.post(
        "/api/investments",
        headers=headers,
        json={
            **payload,
            "symbol": "MSFT",
            "current_price": "0",
        },
    )

    assert first_response.status_code == 201
    assert duplicate_response.status_code == 400
    assert duplicate_response.json()["detail"] == "Investment symbol already exists"
    assert invalid_response.status_code == 422
