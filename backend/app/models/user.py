from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import Column, String, Uuid
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.investment import Investment
    from app.models.transaction import Transaction


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(Uuid(as_uuid=True), primary_key=True, nullable=False),
    )
    username: str = Field(
        sa_column=Column(String(255), nullable=False, unique=True, index=True),
    )
    hashed_password: str = Field(sa_column=Column(String(255), nullable=False))

    investments: list["Investment"] = Relationship(back_populates="user")
    transactions: list["Transaction"] = Relationship(back_populates="user")
