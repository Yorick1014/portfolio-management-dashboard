from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.db import get_session
from app.main import app


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
    name: str,
    symbol: str,
    asset_type: str,
    current_price: str,
    initial_quantity: str,
    initial_purchase_price: str,
    transaction_date: str = "2026-05-01",
) -> str:
    response = client.post(
        "/api/investments",
        headers=headers,
        json={
            "name": name,
            "symbol": symbol,
            "asset_type": asset_type,
            "current_price": current_price,
            "initial_quantity": initial_quantity,
            "initial_purchase_price": initial_purchase_price,
            "transaction_date": transaction_date,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_dashboard_summary_totals_asset_types_and_current_user_scope(
    client: TestClient,
) -> None:
    first_headers = auth_headers(client, "first_user")
    second_headers = auth_headers(client, "second_user")
    stock_id = create_investment(
        client,
        first_headers,
        name="Apple Inc.",
        symbol="AAPL",
        asset_type="STOCK",
        current_price="180.00",
        initial_quantity="10",
        initial_purchase_price="150.00",
    )
    create_investment(
        client,
        first_headers,
        name="Treasury Bond",
        symbol="TBOND",
        asset_type="BOND",
        current_price="95.00",
        initial_quantity="20",
        initial_purchase_price="100.00",
    )
    create_investment(
        client,
        second_headers,
        name="Vanguard Fund",
        symbol="VFINX",
        asset_type="MUTUAL_FUND",
        current_price="250.00",
        initial_quantity="4",
        initial_purchase_price="200.00",
    )
    sell_response = client.post(
        "/api/transactions",
        headers=first_headers,
        json={
            "investment_id": stock_id,
            "transaction_type": "SELL",
            "quantity": "2",
            "price": "190.00",
            "transaction_date": "2026-05-10",
        },
    )
    assert sell_response.status_code == 201

    response = client.get("/api/dashboard/summary", headers=first_headers)

    assert response.status_code == 200
    assert response.json() == {
        "total_current_value": "3340.0000",
        "total_cost_basis": "3200.0000",
        "total_gain_loss": "140.0000",
        "total_performance_percentage": "4.3750",
        "asset_type_summary": [
            {
                "asset_type": "BOND",
                "current_value": "1900.0000",
                "cost_basis": "2000.0000",
                "gain_loss": "-100.0000",
            },
            {
                "asset_type": "STOCK",
                "current_value": "1440.0000",
                "cost_basis": "1200.0000",
                "gain_loss": "240.0000",
            },
        ],
    }


def test_dashboard_summary_returns_empty_totals_for_user_without_investments(
    client: TestClient,
) -> None:
    headers = auth_headers(client)

    response = client.get("/api/dashboard/summary", headers=headers)

    assert response.status_code == 200
    assert response.json() == {
        "total_current_value": "0.0000",
        "total_cost_basis": "0.0000",
        "total_gain_loss": "0.0000",
        "total_performance_percentage": "0.0000",
        "asset_type_summary": [],
    }


def test_dashboard_trend_filters_points_by_period_and_current_user_scope(
    client: TestClient,
) -> None:
    first_headers = auth_headers(client, "first_user")
    second_headers = auth_headers(client, "second_user")
    stock_id = create_investment(
        client,
        first_headers,
        name="Apple Inc.",
        symbol="AAPL",
        asset_type="STOCK",
        current_price="200.00",
        initial_quantity="10",
        initial_purchase_price="100.00",
        transaction_date="2026-01-15",
    )
    create_investment(
        client,
        second_headers,
        name="Other Holding",
        symbol="OTHR",
        asset_type="STOCK",
        current_price="999.00",
        initial_quantity="99",
        initial_purchase_price="99.00",
        transaction_date="2026-05-01",
    )
    buy_response = client.post(
        "/api/transactions",
        headers=first_headers,
        json={
            "investment_id": stock_id,
            "transaction_type": "BUY",
            "quantity": "5",
            "price": "120.00",
            "transaction_date": "2026-04-20",
        },
    )
    sell_response = client.post(
        "/api/transactions",
        headers=first_headers,
        json={
            "investment_id": stock_id,
            "transaction_type": "SELL",
            "quantity": "3",
            "price": "180.00",
            "transaction_date": "2026-05-01",
        },
    )
    assert buy_response.status_code == 201
    assert sell_response.status_code == 201

    all_response = client.get("/api/dashboard/trend?period=ALL", headers=first_headers)
    month_response = client.get("/api/dashboard/trend?period=1M", headers=first_headers)
    day_response = client.get("/api/dashboard/trend?period=1D", headers=first_headers)

    assert all_response.status_code == 200
    assert month_response.status_code == 200
    assert day_response.status_code == 200
    assert all_response.json()["period"] == "ALL"
    assert [point["date"] for point in all_response.json()["points"]] == [
        "2026-01-15",
        "2026-04-20",
        "2026-05-01",
    ]
    assert [point["date"] for point in month_response.json()["points"]] == [
        "2026-04-20",
        "2026-05-01",
    ]
    assert [point["date"] for point in day_response.json()["points"]] == [
        "2026-05-01",
    ]
    assert all_response.json()["points"][-1] == {
        "date": "2026-05-01",
        "value": "2400.0000",
        "cost_basis": "1280.0000",
    }


def test_dashboard_trend_rejects_unknown_period(client: TestClient) -> None:
    headers = auth_headers(client)

    response = client.get("/api/dashboard/trend?period=BAD", headers=headers)

    assert response.status_code == 422
