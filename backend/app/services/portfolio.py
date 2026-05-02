from datetime import timedelta
from decimal import Decimal
from uuid import UUID

from sqlmodel import Session, select

from app.models import AssetType, Investment, Transaction, TransactionType, User
from app.schemas.dashboard import (
    AssetTypeSummary,
    DashboardSummary,
    DashboardTrend,
    DashboardTrendPoint,
    TrendPeriod,
)
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


def build_dashboard_trend(
    *,
    current_user: User,
    period: TrendPeriod,
    session: Session,
) -> DashboardTrend:
    investments = session.exec(
        select(Investment).where(Investment.user_id == current_user.id),
    ).all()
    investment_lookup = {investment.id: investment for investment in investments}
    transactions = session.exec(
        select(Transaction)
        .where(Transaction.user_id == current_user.id)
        .order_by(Transaction.transaction_date, Transaction.created_at),
    ).all()
    if not transactions:
        return DashboardTrend(period=period, points=[])

    latest_date = max(transaction.transaction_date for transaction in transactions)
    if period == "1D":
        start_date = latest_date - timedelta(days=1)
    elif period == "1M":
        start_date = latest_date - timedelta(days=30)
    elif period == "YTD":
        start_date = latest_date.replace(month=1, day=1)
    else:
        start_date = min(transaction.transaction_date for transaction in transactions)

    quantities: dict[UUID, Decimal] = {}
    buy_quantities: dict[UUID, Decimal] = {}
    buy_costs: dict[UUID, Decimal] = {}
    trend_points: list[DashboardTrendPoint] = []

    for index, transaction in enumerate(transactions):
        investment_id = transaction.investment_id
        quantities.setdefault(investment_id, Decimal("0"))
        buy_quantities.setdefault(investment_id, Decimal("0"))
        buy_costs.setdefault(investment_id, Decimal("0"))

        if transaction.transaction_type == TransactionType.BUY:
            quantities[investment_id] += transaction.quantity
            buy_quantities[investment_id] += transaction.quantity
            buy_costs[investment_id] += transaction.quantity * transaction.price
        else:
            quantities[investment_id] -= transaction.quantity

        next_transaction = transactions[index + 1] if index + 1 < len(transactions) else None
        if (
            next_transaction is not None
            and next_transaction.transaction_date == transaction.transaction_date
        ):
            continue

        if transaction.transaction_date < start_date:
            continue

        current_value = Decimal("0")
        cost_basis = Decimal("0")
        for owned_investment_id, quantity in quantities.items():
            investment = investment_lookup.get(owned_investment_id)
            if investment is None:
                continue
            average_buy_price = (
                buy_costs[owned_investment_id] / buy_quantities[owned_investment_id]
                if buy_quantities[owned_investment_id] > 0
                else Decimal("0")
            )
            current_value += quantity * investment.current_price
            cost_basis += quantity * average_buy_price

        trend_points.append(
            DashboardTrendPoint(
                date=transaction.transaction_date.isoformat(),
                value=quantize_money(current_value),
                cost_basis=quantize_money(cost_basis),
            ),
        )

    return DashboardTrend(period=period, points=trend_points)
