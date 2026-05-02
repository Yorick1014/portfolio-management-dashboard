from decimal import Decimal

from sqlalchemy import ForeignKeyConstraint, UniqueConstraint
from sqlmodel import SQLModel

import app.models as models


def test_metadata_registers_core_tables() -> None:
    assert {"users", "investments", "transactions"} <= set(SQLModel.metadata.tables)


def test_user_model_has_username_login_fields() -> None:
    users = SQLModel.metadata.tables["users"]

    assert set(users.columns.keys()) == {"id", "username", "hashed_password"}
    assert users.columns["id"].primary_key
    assert users.columns["username"].unique
    assert users.columns["username"].index
    assert not users.columns["username"].nullable
    assert not users.columns["hashed_password"].nullable


def test_investment_model_stores_metadata_without_editable_position_fields() -> None:
    investments = SQLModel.metadata.tables["investments"]

    assert set(investments.columns.keys()) == {
        "id",
        "user_id",
        "name",
        "symbol",
        "asset_type",
        "current_price",
        "created_at",
        "updated_at",
    }
    assert "quantity" not in investments.columns
    assert "purchase_price" not in investments.columns
    assert "cost_basis" not in investments.columns
    assert investments.columns["user_id"].index
    assert not investments.columns["current_price"].nullable
    assert any(
        isinstance(constraint, UniqueConstraint)
        and tuple(column.name for column in constraint.columns) == ("user_id", "symbol")
        for constraint in investments.constraints
    )


def test_transaction_model_links_user_and_investment_with_required_ledger_fields() -> None:
    transactions = SQLModel.metadata.tables["transactions"]

    assert set(transactions.columns.keys()) == {
        "id",
        "user_id",
        "investment_id",
        "transaction_type",
        "quantity",
        "price",
        "transaction_date",
        "created_at",
        "updated_at",
    }
    assert transactions.columns["user_id"].index
    assert transactions.columns["investment_id"].index
    assert not transactions.columns["quantity"].nullable
    assert not transactions.columns["price"].nullable
    assert any(
        isinstance(constraint, ForeignKeyConstraint)
        and constraint.referred_table.name == "investments"
        and constraint.ondelete == "CASCADE"
        for constraint in transactions.constraints
    )


def test_model_defaults_and_enums_match_portfolio_rules() -> None:
    assert hasattr(models, "AssetType")
    assert hasattr(models, "Investment")
    assert hasattr(models, "Transaction")
    assert hasattr(models, "TransactionType")
    assert hasattr(models, "User")

    user = models.User(username="demo_user", hashed_password="hashed")
    investment = models.Investment(
        user_id=user.id,
        name="Apple Inc.",
        symbol="AAPL",
        asset_type=models.AssetType.STOCK,
        current_price=Decimal("180.00"),
    )
    transaction = models.Transaction(
        user_id=user.id,
        investment_id=investment.id,
        transaction_type=models.TransactionType.BUY,
        quantity=Decimal("10"),
        price=Decimal("150.00"),
    )

    assert user.id is not None
    assert investment.asset_type == models.AssetType.STOCK
    assert transaction.transaction_type == models.TransactionType.BUY
    assert investment.created_at is not None
    assert investment.updated_at is not None
    assert transaction.transaction_date is not None
