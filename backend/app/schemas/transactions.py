from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models import TransactionType


class TransactionBase(BaseModel):
    transaction_type: TransactionType
    quantity: Decimal = Field(gt=0, max_digits=18, decimal_places=6)
    price: Decimal = Field(gt=0, max_digits=18, decimal_places=4)
    transaction_date: date

    model_config = ConfigDict(extra="forbid")


class TransactionCreate(TransactionBase):
    investment_id: UUID


class TransactionUpdate(TransactionBase):
    pass


class TransactionRead(TransactionBase):
    id: UUID
    investment_id: UUID
    investment_symbol: str

    model_config = ConfigDict(from_attributes=True)
