from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.api.auth import get_current_user
from app.db import get_session
from app.models import User
from app.schemas.dashboard import DashboardSummary, DashboardTrend, TrendPeriod
from app.services.portfolio import build_dashboard_summary, build_dashboard_trend


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
) -> DashboardSummary:
    return build_dashboard_summary(current_user=current_user, session=session)


@router.get("/trend", response_model=DashboardTrend)
def get_dashboard_trend(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
    period: Annotated[TrendPeriod, Query()] = "ALL",
) -> DashboardTrend:
    return build_dashboard_trend(
        current_user=current_user,
        period=period,
        session=session,
    )
