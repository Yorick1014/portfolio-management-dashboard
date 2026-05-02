from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.api.auth import get_current_user
from app.db import get_session
from app.models import Investment, Transaction, TransactionType, User
from app.schemas.investments import InvestmentCreate, InvestmentRead, InvestmentUpdate
from app.services.portfolio import build_investment_read


router = APIRouter(prefix="/investments", tags=["investments"])


def get_owned_investment(
    investment_id: UUID,
    current_user: User,
    session: Session,
) -> Investment:
    investment = session.exec(
        select(Investment).where(
            Investment.id == investment_id,
            Investment.user_id == current_user.id,
        ),
    ).first()
    if investment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment not found",
        )
    return investment


def ensure_symbol_available(
    symbol: str,
    current_user: User,
    session: Session,
    *,
    investment_id: UUID | None = None,
) -> None:
    existing_investment = session.exec(
        select(Investment).where(
            Investment.user_id == current_user.id,
            Investment.symbol == symbol,
        ),
    ).first()
    if existing_investment is not None and existing_investment.id != investment_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Investment symbol already exists",
        )


@router.get("", response_model=list[InvestmentRead])
def list_investments(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
) -> list[InvestmentRead]:
    investments = session.exec(
        select(Investment)
        .where(Investment.user_id == current_user.id)
        .order_by(Investment.symbol),
    ).all()
    return [
        build_investment_read(investment=investment, session=session)
        for investment in investments
    ]


@router.post(
    "",
    response_model=InvestmentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_investment(
    payload: InvestmentCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
) -> InvestmentRead:
    ensure_symbol_available(payload.symbol, current_user, session)

    investment = Investment(
        user_id=current_user.id,
        name=payload.name,
        symbol=payload.symbol,
        asset_type=payload.asset_type,
        current_price=payload.current_price,
    )
    session.add(investment)
    session.flush()

    transaction = Transaction(
        user_id=current_user.id,
        investment_id=investment.id,
        transaction_type=TransactionType.BUY,
        quantity=payload.initial_quantity,
        price=payload.initial_purchase_price,
        transaction_date=payload.transaction_date,
    )
    session.add(transaction)

    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Investment symbol already exists",
        ) from None

    session.refresh(investment)
    return build_investment_read(investment=investment, session=session)


@router.put("/{investment_id}", response_model=InvestmentRead)
def update_investment(
    investment_id: UUID,
    payload: InvestmentUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
) -> InvestmentRead:
    investment = get_owned_investment(investment_id, current_user, session)
    ensure_symbol_available(
        payload.symbol,
        current_user,
        session,
        investment_id=investment.id,
    )

    investment.name = payload.name
    investment.symbol = payload.symbol
    investment.asset_type = payload.asset_type
    investment.current_price = payload.current_price
    investment.updated_at = datetime.now(UTC)

    try:
        session.add(investment)
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Investment symbol already exists",
        ) from None

    session.refresh(investment)
    return build_investment_read(investment=investment, session=session)


@router.delete("/{investment_id}")
def delete_investment(
    investment_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, str]:
    investment = get_owned_investment(investment_id, current_user, session)
    transactions = session.exec(
        select(Transaction).where(Transaction.investment_id == investment.id),
    ).all()
    for transaction in transactions:
        session.delete(transaction)
    session.delete(investment)
    session.commit()

    return {"message": "Investment deleted"}
