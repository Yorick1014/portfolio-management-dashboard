from decimal import Decimal
from typing import Literal

from pydantic import BaseModel

from app.models import AssetType

TrendPeriod = Literal["1D", "1M", "YTD", "ALL"]


class AssetTypeSummary(BaseModel):
    asset_type: AssetType
    current_value: Decimal
    cost_basis: Decimal
    gain_loss: Decimal


class DashboardSummary(BaseModel):
    total_current_value: Decimal
    total_cost_basis: Decimal
    total_gain_loss: Decimal
    total_performance_percentage: Decimal
    asset_type_summary: list[AssetTypeSummary]


class DashboardTrendPoint(BaseModel):
    date: str
    value: Decimal
    cost_basis: Decimal


class DashboardTrend(BaseModel):
    period: TrendPeriod
    points: list[DashboardTrendPoint]
