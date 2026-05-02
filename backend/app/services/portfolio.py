from decimal import Decimal

from sqlmodel import Session, select

from app.models import Investment, Transaction, TransactionType
from app.schemas.investments import InvestmentRead

MONEY_PLACES = Decimal("0.0001")
QUANTITY_PLACES = Decimal("0.000001")


def quantize_money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_PLACES)


def quantize_quantity(value: Decimal) -> Decimal:
    return value.quantize(QUANTITY_PLACES)


def build_investment_read(
    investment: Investment,
    session: Session,
) -> InvestmentRead:
    transactions = session.exec(
        select(Transaction).where(Transaction.investment_id == investment.id),
    ).all()

    total_buy_quantity = sum(
        (
            transaction.quantity
            for transaction in transactions
            if transaction.transaction_type == TransactionType.BUY
        ),
        Decimal("0"),
    )
    total_sell_quantity = sum(
        (
            transaction.quantity
            for transaction in transactions
            if transaction.transaction_type == TransactionType.SELL
        ),
        Decimal("0"),
    )
    total_buy_cost = sum(
        (
            transaction.quantity * transaction.price
            for transaction in transactions
            if transaction.transaction_type == TransactionType.BUY
        ),
        Decimal("0"),
    )

    current_quantity = total_buy_quantity - total_sell_quantity
    average_buy_price = (
        total_buy_cost / total_buy_quantity
        if total_buy_quantity > 0
        else Decimal("0")
    )
    estimated_cost_basis = current_quantity * average_buy_price
    current_value = current_quantity * investment.current_price
    gain_loss = current_value - estimated_cost_basis
    performance_percentage = (
        gain_loss / estimated_cost_basis * Decimal("100")
        if estimated_cost_basis > 0
        else Decimal("0")
    )

    return InvestmentRead(
        id=investment.id,
        name=investment.name,
        symbol=investment.symbol,
        asset_type=investment.asset_type,
        current_price=quantize_money(investment.current_price),
        current_quantity=quantize_quantity(current_quantity),
        average_buy_price=quantize_money(average_buy_price),
        estimated_cost_basis=quantize_money(estimated_cost_basis),
        current_value=quantize_money(current_value),
        gain_loss=quantize_money(gain_loss),
        performance_percentage=quantize_money(performance_percentage),
    )
