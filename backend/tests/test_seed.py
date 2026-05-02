from collections.abc import Generator
from decimal import Decimal

import pytest
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from app.models import AssetType, Investment, Transaction, TransactionType, User
from app.seed import seed_demo_data


@pytest.fixture
def session() -> Generator[Session]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as test_session:
        yield test_session


def test_seed_demo_data_creates_demo_account_holdings_and_transactions(
    session: Session,
) -> None:
    seed_demo_data(session)

    user = session.exec(select(User).where(User.username == "demo_user")).one()
    investments = session.exec(
        select(Investment).where(Investment.user_id == user.id).order_by(Investment.symbol),
    ).all()
    transactions = session.exec(
        select(Transaction).where(Transaction.user_id == user.id),
    ).all()

    assert len(investments) == 8
    assert {investment.symbol for investment in investments} == {
        "AAPL",
        "AMZN",
        "BND",
        "GOOGL",
        "MSFT",
        "NVDA",
        "SCHD",
        "VTSAX",
    }
    assert {investment.asset_type for investment in investments} == {
        AssetType.STOCK,
        AssetType.BOND,
        AssetType.MUTUAL_FUND,
    }
    assert len(transactions) == 23
    assert sum(
        1
        for transaction in transactions
        if transaction.transaction_type == TransactionType.SELL
    ) == 6
    assert any(
        transaction.transaction_type == TransactionType.SELL
        and transaction.quantity == Decimal("2.000000")
        for transaction in transactions
    )


def test_seed_demo_data_is_idempotent(session: Session) -> None:
    seed_demo_data(session)
    seed_demo_data(session)

    users = session.exec(select(User).where(User.username == "demo_user")).all()
    investments = session.exec(select(Investment)).all()
    transactions = session.exec(select(Transaction)).all()

    assert len(users) == 1
    assert len(investments) == 8
    assert len(transactions) == 23
