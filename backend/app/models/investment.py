from datetime import UTC, datetime
from decimal import Decimal
from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, Column, DateTime, Enum
from sqlalchemy import ForeignKey, Numeric, String, Uuid, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.transaction import Transaction
    from app.models.user import User


class AssetType(StrEnum):
    STOCK = "STOCK"
    BOND = "BOND"
    MUTUAL_FUND = "MUTUAL_FUND"


class Investment(SQLModel, table=True):
    __tablename__ = "investments"
    __table_args__ = (
        UniqueConstraint("user_id", "symbol", name="uq_investments_user_id_symbol"),
        CheckConstraint("current_price > 0", name="ck_investments_current_price_positive"),
    )

    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(Uuid(as_uuid=True), primary_key=True, nullable=False),
    )
    user_id: UUID = Field(
        sa_column=Column(
            Uuid(as_uuid=True),
            ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    name: str = Field(sa_column=Column(String(255), nullable=False))
    symbol: str = Field(sa_column=Column(String(32), nullable=False))
    asset_type: AssetType = Field(
        sa_column=Column(
            Enum(AssetType, name="asset_type", native_enum=False),
            nullable=False,
        ),
    )
    current_price: Decimal = Field(
        sa_column=Column(Numeric(18, 4), nullable=False),
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )

    user: "User" = Relationship(back_populates="investments")
    transactions: list["Transaction"] = Relationship(back_populates="investment")
