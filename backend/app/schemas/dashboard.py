from decimal import Decimal

from pydantic import BaseModel

from app.models import AssetType


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
