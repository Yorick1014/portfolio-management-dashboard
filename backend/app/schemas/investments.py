from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import AssetType


def normalize_symbol(symbol: str) -> str:
    return symbol.strip().upper()


class InvestmentMetadata(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    symbol: str = Field(min_length=1, max_length=32)
    asset_type: AssetType
    current_price: Decimal = Field(gt=0, max_digits=18, decimal_places=4)

    model_config = ConfigDict(extra="forbid")

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            msg = "Name must not be empty"
            raise ValueError(msg)
        return stripped

    @field_validator("symbol")
    @classmethod
    def normalize_symbol_field(cls, value: str) -> str:
        normalized = normalize_symbol(value)
        if not normalized:
            msg = "Symbol must not be empty"
            raise ValueError(msg)
        return normalized


class InvestmentCreate(InvestmentMetadata):
    initial_quantity: Decimal = Field(gt=0, max_digits=18, decimal_places=6)
    initial_purchase_price: Decimal = Field(gt=0, max_digits=18, decimal_places=4)
    transaction_date: date


class InvestmentUpdate(InvestmentMetadata):
    pass


class InvestmentRead(InvestmentMetadata):
    id: UUID
    current_quantity: Decimal
    average_buy_price: Decimal
    estimated_cost_basis: Decimal
    current_value: Decimal
    gain_loss: Decimal
    performance_percentage: Decimal

    model_config = ConfigDict(from_attributes=True)
