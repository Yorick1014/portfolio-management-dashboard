from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.api.auth import get_current_user
from app.api.investments import get_owned_investment
from app.db import get_session
from app.models import Investment, Transaction, TransactionType, User
from app.schemas.transactions import TransactionCreate, TransactionRead, TransactionUpdate
from app.services.portfolio import quantize_money, quantize_quantity


router = APIRouter(prefix="/transactions", tags=["transactions"])


def get_owned_transaction(
    transaction_id: UUID,
    current_user: User,
    session: Session,
) -> Transaction:
    transaction = session.exec(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id,
        ),
    ).first()
    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found",
        )
    return transaction


def calculate_quantity_after_change(
    *,
    investment_id: UUID,
    session: Session,
    replacement_type: TransactionType | None = None,
    replacement_quantity: Decimal | None = None,
    exclude_transaction_id: UUID | None = None,
) -> Decimal:
    transactions = session.exec(
        select(Transaction).where(Transaction.investment_id == investment_id),
    ).all()
    quantity = Decimal("0")
    for transaction in transactions:
        if transaction.id == exclude_transaction_id:
            continue
        if transaction.transaction_type == TransactionType.BUY:
            quantity += transaction.quantity
        else:
            quantity -= transaction.quantity

    if replacement_type is not None and replacement_quantity is not None:
        if replacement_type == TransactionType.BUY:
            quantity += replacement_quantity
        else:
            quantity -= replacement_quantity

    return quantity


def ensure_transaction_keeps_quantity_non_negative(
    *,
    investment_id: UUID,
    session: Session,
    transaction_type: TransactionType,
    quantity: Decimal,
    exclude_transaction_id: UUID | None = None,
) -> None:
    resulting_quantity = calculate_quantity_after_change(
        investment_id=investment_id,
        session=session,
        replacement_type=transaction_type,
        replacement_quantity=quantity,
        exclude_transaction_id=exclude_transaction_id,
    )
    if resulting_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot sell more quantity than currently held",
        )


def ensure_delete_keeps_quantity_non_negative(
    *,
    transaction: Transaction,
    session: Session,
) -> None:
    resulting_quantity = calculate_quantity_after_change(
        investment_id=transaction.investment_id,
        session=session,
        exclude_transaction_id=transaction.id,
    )
    if resulting_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete transaction because it would make quantity negative",
        )


def build_transaction_read(
    *,
    transaction: Transaction,
    session: Session,
) -> TransactionRead:
    investment = session.get(Investment, transaction.investment_id)
    investment_symbol = investment.symbol if investment is not None else ""
    return TransactionRead(
        id=transaction.id,
        investment_id=transaction.investment_id,
        investment_symbol=investment_symbol,
        transaction_type=transaction.transaction_type,
        quantity=quantize_quantity(transaction.quantity),
        price=quantize_money(transaction.price),
        transaction_date=transaction.transaction_date,
    )


@router.get("", response_model=list[TransactionRead])
def list_transactions(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
    investment_id: Annotated[UUID | None, Query()] = None,
    transaction_type: Annotated[TransactionType | None, Query()] = None,
    from_date: Annotated[date | None, Query()] = None,
    to_date: Annotated[date | None, Query()] = None,
) -> list[TransactionRead]:
    statement = select(Transaction).where(Transaction.user_id == current_user.id)
    if investment_id is not None:
        statement = statement.where(Transaction.investment_id == investment_id)
    if transaction_type is not None:
        statement = statement.where(Transaction.transaction_type == transaction_type)
    if from_date is not None:
        statement = statement.where(Transaction.transaction_date >= from_date)
    if to_date is not None:
        statement = statement.where(Transaction.transaction_date <= to_date)

    transactions = session.exec(
        statement.order_by(
            Transaction.transaction_date.desc(),
            Transaction.created_at.desc(),
        ),
    ).all()
    return [
        build_transaction_read(transaction=transaction, session=session)
        for transaction in transactions
    ]


@router.post(
    "",
    response_model=TransactionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_transaction(
    payload: TransactionCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
) -> TransactionRead:
    investment = get_owned_investment(payload.investment_id, current_user, session)
    ensure_transaction_keeps_quantity_non_negative(
        investment_id=investment.id,
        session=session,
        transaction_type=payload.transaction_type,
        quantity=payload.quantity,
    )

    transaction = Transaction(
        user_id=current_user.id,
        investment_id=investment.id,
        transaction_type=payload.transaction_type,
        quantity=payload.quantity,
        price=payload.price,
        transaction_date=payload.transaction_date,
    )
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return build_transaction_read(transaction=transaction, session=session)


@router.put("/{transaction_id}", response_model=TransactionRead)
def update_transaction(
    transaction_id: UUID,
    payload: TransactionUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
) -> TransactionRead:
    transaction = get_owned_transaction(transaction_id, current_user, session)
    ensure_transaction_keeps_quantity_non_negative(
        investment_id=transaction.investment_id,
        session=session,
        transaction_type=payload.transaction_type,
        quantity=payload.quantity,
        exclude_transaction_id=transaction.id,
    )

    transaction.transaction_type = payload.transaction_type
    transaction.quantity = payload.quantity
    transaction.price = payload.price
    transaction.transaction_date = payload.transaction_date
    transaction.updated_at = datetime.now(UTC)
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return build_transaction_read(transaction=transaction, session=session)


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, str]:
    transaction = get_owned_transaction(transaction_id, current_user, session)
    ensure_delete_keeps_quantity_non_negative(transaction=transaction, session=session)

    session.delete(transaction)
    session.commit()
    return {"message": "Transaction deleted"}
