from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

import app.models  # noqa: F401
from app.core.config import get_settings


settings = get_settings()
engine = create_engine(settings.database_url, echo=False)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session]:
    with Session(engine) as session:
        yield session
