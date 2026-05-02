"""create core portfolio tables

Revision ID: 202605021530
Revises:
Create Date: 2026-05-02 15:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202605021530"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "investments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("symbol", sa.String(length=32), nullable=False),
        sa.Column(
            "asset_type",
            sa.Enum(
                "STOCK",
                "BOND",
                "MUTUAL_FUND",
                name="asset_type",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("current_price", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "current_price > 0",
            name="ck_investments_current_price_positive",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "symbol", name="uq_investments_user_id_symbol"),
    )
    op.create_index(op.f("ix_investments_user_id"), "investments", ["user_id"], unique=False)

    op.create_table(
        "transactions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("investment_id", sa.Uuid(), nullable=False),
        sa.Column(
            "transaction_type",
            sa.Enum("BUY", "SELL", name="transaction_type", native_enum=False),
            nullable=False,
        ),
        sa.Column("quantity", sa.Numeric(precision=18, scale=6), nullable=False),
        sa.Column("price", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("transaction_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("price > 0", name="ck_transactions_price_positive"),
        sa.CheckConstraint("quantity > 0", name="ck_transactions_quantity_positive"),
        sa.ForeignKeyConstraint(["investment_id"], ["investments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_transactions_investment_id"),
        "transactions",
        ["investment_id"],
        unique=False,
    )
    op.create_index(op.f("ix_transactions_user_id"), "transactions", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_transactions_user_id"), table_name="transactions")
    op.drop_index(op.f("ix_transactions_investment_id"), table_name="transactions")
    op.drop_table("transactions")
    op.drop_index(op.f("ix_investments_user_id"), table_name="investments")
    op.drop_table("investments")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_table("users")
