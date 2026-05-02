from collections.abc import Generator
from decimal import Decimal
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from app.db import get_session
from app.main import app
from app.models import Transaction, TransactionType


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


def create_investment(
    client: TestClient,
    headers: dict[str, str],
    *,
    symbol: str = "AAPL",
    initial_quantity: str = "10",
) -> str:
    response = client.post(
        "/api/investments",
        headers=headers,
        json={
            "name": f"{symbol} Holding",
            "symbol": symbol,
            "asset_type": "STOCK",
            "current_price": "180.00",
            "initial_quantity": initial_quantity,
            "initial_purchase_price": "150.00",
            "transaction_date": "2026-05-01",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_create_and_list_transactions_are_scoped_and_newest_first(
    client_and_session: tuple[TestClient, Session],
) -> None:
    client, session = client_and_session
    first_headers = auth_headers(client, "first_user")
    second_headers = auth_headers(client, "second_user")
    investment_id = create_investment(client, first_headers)

    sell_response = client.post(
        "/api/transactions",
        headers=first_headers,
        json={
            "investment_id": investment_id,
            "transaction_type": "SELL",
            "quantity": "2",
            "price": "190.00",
            "transaction_date": "2026-05-10",
        },
    )
    list_response = client.get("/api/transactions", headers=first_headers)
    other_list_response = client.get("/api/transactions", headers=second_headers)

    assert sell_response.status_code == 201
    sell_body = sell_response.json()
    assert sell_body["investment_id"] == investment_id
    assert sell_body["investment_symbol"] == "AAPL"
    assert sell_body["transaction_type"] == "SELL"
    assert sell_body["quantity"] == "2.000000"
    assert sell_body["price"] == "190.0000"

    assert list_response.status_code == 200
    assert [item["transaction_type"] for item in list_response.json()] == ["SELL", "BUY"]
    assert other_list_response.status_code == 200
    assert other_list_response.json() == []

    transaction = session.get(Transaction, UUID(sell_body["id"]))
    assert transaction is not None
    assert transaction.transaction_type == TransactionType.SELL


def test_transaction_create_rejects_unowned_investment_and_oversell(
    client_and_session: tuple[TestClient, Session],
) -> None:
    client, _session = client_and_session
    first_headers = auth_headers(client, "first_user")
    second_headers = auth_headers(client, "second_user")
    investment_id = create_investment(client, first_headers)

    unowned_response = client.post(
        "/api/transactions",
        headers=second_headers,
        json={
            "investment_id": investment_id,
            "transaction_type": "BUY",
            "quantity": "1",
            "price": "190.00",
            "transaction_date": "2026-05-10",
        },
    )
    oversell_response = client.post(
        "/api/transactions",
        headers=first_headers,
        json={
            "investment_id": investment_id,
            "transaction_type": "SELL",
            "quantity": "11",
            "price": "190.00",
            "transaction_date": "2026-05-10",
        },
    )
    invalid_response = client.post(
        "/api/transactions",
        headers=first_headers,
        json={
            "investment_id": investment_id,
            "transaction_type": "BUY",
            "quantity": "0",
            "price": "190.00",
            "transaction_date": "2026-05-10",
        },
    )

    assert unowned_response.status_code == 404
    assert oversell_response.status_code == 400
    assert oversell_response.json()["detail"] == "Cannot sell more quantity than currently held"
    assert invalid_response.status_code == 422


def test_update_transaction_preserves_ownership_and_non_negative_quantity(
    client_and_session: tuple[TestClient, Session],
) -> None:
    client, session = client_and_session
    first_headers = auth_headers(client, "first_user")
    second_headers = auth_headers(client, "second_user")
    investment_id = create_investment(client, first_headers)
    sell_response = client.post(
        "/api/transactions",
        headers=first_headers,
        json={
            "investment_id": investment_id,
            "transaction_type": "SELL",
            "quantity": "2",
            "price": "190.00",
            "transaction_date": "2026-05-10",
        },
    )
    transaction_id = sell_response.json()["id"]

    forbidden_response = client.put(
        f"/api/transactions/{transaction_id}",
        headers=second_headers,
        json={
            "transaction_type": "SELL",
            "quantity": "3",
            "price": "191.00",
            "transaction_date": "2026-05-11",
        },
    )
    oversell_response = client.put(
        f"/api/transactions/{transaction_id}",
        headers=first_headers,
        json={
            "transaction_type": "SELL",
            "quantity": "11",
            "price": "191.00",
            "transaction_date": "2026-05-11",
        },
    )
    update_response = client.put(
        f"/api/transactions/{transaction_id}",
        headers=first_headers,
        json={
            "transaction_type": "SELL",
            "quantity": "3",
            "price": "191.00",
            "transaction_date": "2026-05-11",
        },
    )

    assert forbidden_response.status_code == 404
    assert oversell_response.status_code == 400
    assert oversell_response.json()["detail"] == "Cannot sell more quantity than currently held"
    assert update_response.status_code == 200
    assert update_response.json()["quantity"] == "3.000000"
    assert update_response.json()["price"] == "191.0000"

    session.expire_all()
    transaction = session.get(Transaction, UUID(transaction_id))
    assert transaction is not None
    assert transaction.quantity == Decimal("3.000000")


def test_delete_transaction_rejects_negative_result_and_deletes_owned_transaction(
    client_and_session: tuple[TestClient, Session],
) -> None:
    client, session = client_and_session
    headers = auth_headers(client)
    investment_id = create_investment(client, headers)
    sell_response = client.post(
        "/api/transactions",
        headers=headers,
        json={
            "investment_id": investment_id,
            "transaction_type": "SELL",
            "quantity": "5",
            "price": "190.00",
            "transaction_date": "2026-05-10",
        },
    )
    buy_transaction = session.exec(
        select(Transaction).where(Transaction.transaction_type == TransactionType.BUY),
    ).one()

    delete_buy_response = client.delete(
        f"/api/transactions/{buy_transaction.id}",
        headers=headers,
    )
    delete_sell_response = client.delete(
        f"/api/transactions/{sell_response.json()['id']}",
        headers=headers,
    )

    assert delete_buy_response.status_code == 400
    assert delete_buy_response.json()["detail"] == "Cannot delete transaction because it would make quantity negative"
    assert delete_sell_response.status_code == 200
    assert delete_sell_response.json() == {"message": "Transaction deleted"}
    session.expire_all()
    assert session.get(Transaction, UUID(sell_response.json()["id"])) is None
