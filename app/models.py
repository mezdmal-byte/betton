import enum
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MarketStatus(str, enum.Enum):
    open = "open"
    resolved = "resolved"


class Outcome(str, enum.Enum):
    yes = "yes"
    no = "no"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    telegram_id: Mapped[int | None] = mapped_column(Integer, unique=True, nullable=True)
    username: Mapped[str] = mapped_column(String(64), unique=True)
    balance: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    markets: Mapped[list["Market"]] = relationship(back_populates="creator")
    positions: Mapped[list["Position"]] = relationship(back_populates="user")
    trades: Mapped[list["Trade"]] = relationship(back_populates="user")


class Market(Base):
    __tablename__ = "markets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    question: Mapped[str] = mapped_column(String(512))
    description: Mapped[str] = mapped_column(Text, default="")
    creator_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    category: Mapped[str] = mapped_column(String(32), default="unique", server_default="unique")
    b: Mapped[float] = mapped_column(Float)  # параметр ликвидности LMSR
    q_yes: Mapped[float] = mapped_column(Float, default=0.0)
    q_no: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[MarketStatus] = mapped_column(
        Enum(MarketStatus), default=MarketStatus.open
    )
    winning_outcome: Mapped[Outcome | None] = mapped_column(Enum(Outcome), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    creator: Mapped[User] = relationship(back_populates="markets")
    positions: Mapped[list["Position"]] = relationship(back_populates="market")
    trades: Mapped[list["Trade"]] = relationship(back_populates="market")


class Position(Base):
    __tablename__ = "positions"
    __table_args__ = (UniqueConstraint("user_id", "market_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    market_id: Mapped[int] = mapped_column(ForeignKey("markets.id"))
    shares_yes: Mapped[float] = mapped_column(Float, default=0.0)
    shares_no: Mapped[float] = mapped_column(Float, default=0.0)
    cost_yes: Mapped[float] = mapped_column(Float, default=0.0)
    cost_no: Mapped[float] = mapped_column(Float, default=0.0)
    claimed: Mapped[bool] = mapped_column(default=False)
    tip_paid: Mapped[float] = mapped_column(Float, default=0.0)

    user: Mapped[User] = relationship(back_populates="positions")
    market: Mapped[Market] = relationship(back_populates="positions")


class Trade(Base):
    __tablename__ = "trades"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    market_id: Mapped[int] = mapped_column(ForeignKey("markets.id"))
    outcome: Mapped[Outcome] = mapped_column(Enum(Outcome))
    money: Mapped[float] = mapped_column(Float)
    shares: Mapped[float] = mapped_column(Float)
    price_after: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped[User] = relationship(back_populates="trades")
    market: Mapped[Market] = relationship(back_populates="trades")
