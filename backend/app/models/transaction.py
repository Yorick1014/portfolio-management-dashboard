from datetime import UTC, date, datetime
from decimal import Decimal
from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, Column, Date, DateTime
from sqlalchemy import Enum, ForeignKey, Numeric, Uuid
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.investment import Investment
    from app.models.user import User


class TransactionType(StrEnum):
    BUY = "BUY"
    SELL = "SELL"


class Transaction(SQLModel, table=True):
    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_transactions_quantity_positive"),
        CheckConstraint("price > 0", name="ck_transactions_price_positive"),
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
    investment_id: UUID = Field(
        sa_column=Column(
            Uuid(as_uuid=True),
            ForeignKey("investments.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    transaction_type: TransactionType = Field(
        sa_column=Column(
            Enum(TransactionType, name="transaction_type", native_enum=False),
            nullable=False,
        ),
    )
    quantity: Decimal = Field(sa_column=Column(Numeric(18, 6), nullable=False))
    price: Decimal = Field(sa_column=Column(Numeric(18, 4), nullable=False))
    transaction_date: date = Field(
        default_factory=date.today,
        sa_column=Column(Date, nullable=False),
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )

    user: "User" = Relationship(back_populates="transactions")
    investment: "Investment" = Relationship(back_populates="transactions")
