from decimal import Decimal

from sqlmodel import Session, select

from app.models import AssetType, Investment, Transaction, TransactionType, User
from app.schemas.dashboard import AssetTypeSummary, DashboardSummary
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


def build_dashboard_summary(
    *,
    current_user: User,
    session: Session,
) -> DashboardSummary:
    investments = session.exec(
        select(Investment)
        .where(Investment.user_id == current_user.id)
        .order_by(Investment.asset_type, Investment.symbol),
    ).all()
    investment_reads = [
        build_investment_read(investment=investment, session=session)
        for investment in investments
    ]

    total_current_value = sum(
        (investment.current_value for investment in investment_reads),
        Decimal("0"),
    )
    total_cost_basis = sum(
        (investment.estimated_cost_basis for investment in investment_reads),
        Decimal("0"),
    )
    total_gain_loss = total_current_value - total_cost_basis
    total_performance_percentage = (
        total_gain_loss / total_cost_basis * Decimal("100")
        if total_cost_basis > 0
        else Decimal("0")
    )

    asset_type_totals: dict[AssetType, dict[str, Decimal]] = {}
    for investment in investment_reads:
        totals = asset_type_totals.setdefault(
            investment.asset_type,
            {
                "current_value": Decimal("0"),
                "cost_basis": Decimal("0"),
                "gain_loss": Decimal("0"),
            },
        )
        totals["current_value"] += investment.current_value
        totals["cost_basis"] += investment.estimated_cost_basis
        totals["gain_loss"] += investment.gain_loss

    return DashboardSummary(
        total_current_value=quantize_money(total_current_value),
        total_cost_basis=quantize_money(total_cost_basis),
        total_gain_loss=quantize_money(total_gain_loss),
        total_performance_percentage=quantize_money(total_performance_percentage),
        asset_type_summary=[
            AssetTypeSummary(
                asset_type=asset_type,
                current_value=quantize_money(totals["current_value"]),
                cost_basis=quantize_money(totals["cost_basis"]),
                gain_loss=quantize_money(totals["gain_loss"]),
            )
            for asset_type, totals in sorted(
                asset_type_totals.items(),
                key=lambda item: item[0].value,
            )
        ],
    )
