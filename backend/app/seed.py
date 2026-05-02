from datetime import date
from decimal import Decimal

from sqlmodel import Session, select

from app.core.security import hash_password
from app.db import engine
from app.models import AssetType, Investment, Transaction, TransactionType, User

DEMO_USERNAME = "demo_user"
DEMO_PASSWORD = "password123"

DEMO_INVESTMENTS = [
    {
        "asset_type": AssetType.STOCK,
        "current_price": Decimal("192.50"),
        "name": "Apple Inc.",
        "symbol": "AAPL",
        "transactions": [
            {
                "price": Decimal("150.00"),
                "quantity": Decimal("12"),
                "transaction_date": date(2026, 1, 15),
                "transaction_type": TransactionType.BUY,
            },
            {
                "price": Decimal("172.40"),
                "quantity": Decimal("4"),
                "transaction_date": date(2026, 2, 20),
                "transaction_type": TransactionType.BUY,
            },
            {
                "price": Decimal("188.00"),
                "quantity": Decimal("2"),
                "transaction_date": date(2026, 4, 10),
                "transaction_type": TransactionType.SELL,
            },
            {
                "price": Decimal("190.40"),
                "quantity": Decimal("3"),
                "transaction_date": date(2026, 5, 1),
                "transaction_type": TransactionType.BUY,
            },
        ],
    },
    {
        "asset_type": AssetType.STOCK,
        "current_price": Decimal("431.20"),
        "name": "Microsoft Corporation",
        "symbol": "MSFT",
        "transactions": [
            {
                "price": Decimal("365.00"),
                "quantity": Decimal("8"),
                "transaction_date": date(2026, 1, 22),
                "transaction_type": TransactionType.BUY,
            },
            {
                "price": Decimal("390.50"),
                "quantity": Decimal("3"),
                "transaction_date": date(2026, 3, 12),
                "transaction_type": TransactionType.BUY,
            },
            {
                "price": Decimal("418.25"),
                "quantity": Decimal("1"),
                "transaction_date": date(2026, 4, 22),
                "transaction_type": TransactionType.SELL,
            },
            {
                "price": Decimal("428.10"),
                "quantity": Decimal("2"),
                "transaction_date": date(2026, 5, 2),
                "transaction_type": TransactionType.SELL,
            },
        ],
    },
    {
        "asset_type": AssetType.STOCK,
        "current_price": Decimal("176.30"),
        "name": "Alphabet Inc.",
        "symbol": "GOOGL",
        "transactions": [
            {
                "price": Decimal("142.80"),
                "quantity": Decimal("9"),
                "transaction_date": date(2026, 1, 29),
                "transaction_type": TransactionType.BUY,
            },
            {
                "price": Decimal("160.10"),
                "quantity": Decimal("5"),
                "transaction_date": date(2026, 3, 18),
                "transaction_type": TransactionType.BUY,
            },
        ],
    },
    {
        "asset_type": AssetType.STOCK,
        "current_price": Decimal("875.75"),
        "name": "NVIDIA Corporation",
        "symbol": "NVDA",
        "transactions": [
            {
                "price": Decimal("690.00"),
                "quantity": Decimal("5"),
                "transaction_date": date(2026, 2, 7),
                "transaction_type": TransactionType.BUY,
            },
            {
                "price": Decimal("810.00"),
                "quantity": Decimal("1"),
                "transaction_date": date(2026, 4, 5),
                "transaction_type": TransactionType.SELL,
            },
            {
                "price": Decimal("842.20"),
                "quantity": Decimal("2"),
                "transaction_date": date(2026, 4, 25),
                "transaction_type": TransactionType.BUY,
            },
        ],
    },
    {
        "asset_type": AssetType.STOCK,
        "current_price": Decimal("189.90"),
        "name": "Amazon.com Inc.",
        "symbol": "AMZN",
        "transactions": [
            {
                "price": Decimal("155.25"),
                "quantity": Decimal("6"),
                "transaction_date": date(2026, 2, 14),
                "transaction_type": TransactionType.BUY,
            },
            {
                "price": Decimal("181.60"),
                "quantity": Decimal("1"),
                "transaction_date": date(2026, 4, 18),
                "transaction_type": TransactionType.SELL,
            },
        ],
    },
    {
        "asset_type": AssetType.BOND,
        "current_price": Decimal("95.25"),
        "name": "Vanguard Total Bond Market ETF",
        "symbol": "BND",
        "transactions": [
            {
                "price": Decimal("96.40"),
                "quantity": Decimal("25"),
                "transaction_date": date(2026, 2, 1),
                "transaction_type": TransactionType.BUY,
            },
            {
                "price": Decimal("94.80"),
                "quantity": Decimal("5"),
                "transaction_date": date(2026, 4, 12),
                "transaction_type": TransactionType.SELL,
            },
            {
                "price": Decimal("95.10"),
                "quantity": Decimal("10"),
                "transaction_date": date(2026, 5, 2),
                "transaction_type": TransactionType.BUY,
            },
        ],
    },
    {
        "asset_type": AssetType.STOCK,
        "current_price": Decimal("81.40"),
        "name": "Schwab US Dividend Equity ETF",
        "symbol": "SCHD",
        "transactions": [
            {
                "price": Decimal("75.20"),
                "quantity": Decimal("18"),
                "transaction_date": date(2026, 2, 28),
                "transaction_type": TransactionType.BUY,
            },
            {
                "price": Decimal("78.10"),
                "quantity": Decimal("7"),
                "transaction_date": date(2026, 3, 29),
                "transaction_type": TransactionType.BUY,
            },
            {
                "price": Decimal("80.35"),
                "quantity": Decimal("5"),
                "transaction_date": date(2026, 4, 30),
                "transaction_type": TransactionType.BUY,
            },
        ],
    },
    {
        "asset_type": AssetType.MUTUAL_FUND,
        "current_price": Decimal("142.75"),
        "name": "Vanguard Total Stock Market Index Fund",
        "symbol": "VTSAX",
        "transactions": [
            {
                "price": Decimal("130.00"),
                "quantity": Decimal("12"),
                "transaction_date": date(2026, 3, 5),
                "transaction_type": TransactionType.BUY,
            },
            {
                "price": Decimal("136.80"),
                "quantity": Decimal("8"),
                "transaction_date": date(2026, 4, 15),
                "transaction_type": TransactionType.BUY,
            },
        ],
    },
]


def seed_demo_data(session: Session) -> None:
    user = session.exec(select(User).where(User.username == DEMO_USERNAME)).first()
    if user is None:
        user = User(
            username=DEMO_USERNAME,
            hashed_password=hash_password(DEMO_PASSWORD),
        )
        session.add(user)
        session.flush()

    for demo_investment in DEMO_INVESTMENTS:
        investment = session.exec(
            select(Investment).where(
                Investment.user_id == user.id,
                Investment.symbol == demo_investment["symbol"],
            ),
        ).first()
        if investment is None:
            investment = Investment(
                user_id=user.id,
                name=demo_investment["name"],
                symbol=demo_investment["symbol"],
                asset_type=demo_investment["asset_type"],
                current_price=demo_investment["current_price"],
            )
            session.add(investment)
            session.flush()
        else:
            investment.name = demo_investment["name"]
            investment.asset_type = demo_investment["asset_type"]
            investment.current_price = demo_investment["current_price"]
            session.add(investment)

        existing_transactions = session.exec(
            select(Transaction).where(Transaction.investment_id == investment.id),
        ).all()

        for demo_transaction in demo_investment["transactions"]:
            transaction_exists = any(
                transaction.transaction_type == demo_transaction["transaction_type"]
                and transaction.quantity == demo_transaction["quantity"]
                and transaction.price == demo_transaction["price"]
                and transaction.transaction_date == demo_transaction["transaction_date"]
                for transaction in existing_transactions
            )
            if transaction_exists:
                continue

            session.add(
                Transaction(
                    user_id=user.id,
                    investment_id=investment.id,
                    transaction_type=demo_transaction["transaction_type"],
                    quantity=demo_transaction["quantity"],
                    price=demo_transaction["price"],
                    transaction_date=demo_transaction["transaction_date"],
                ),
            )

    session.commit()


def main() -> None:
    with Session(engine) as session:
        seed_demo_data(session)
    print(f"Seeded demo account: {DEMO_USERNAME} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
