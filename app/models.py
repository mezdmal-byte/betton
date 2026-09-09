import enum
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
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

from app.config import settings
from app.database import Base


class MarketStatus(str, enum.Enum):
    open = "open"
    closed = "closed"
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
    settlements: Mapped[list["SettlementRecord"]] = relationship(back_populates="user")

    @property
    def is_admin(self) -> bool:
        return settings.is_admin_telegram(self.telegram_id)


class Market(Base):
    __tablename__ = "markets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    question: Mapped[str] = mapped_column(String(512))
    description: Mapped[str] = mapped_column(Text, default="")
    creator_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    category: Mapped[str] = mapped_column(String(32), default="unique", server_default="unique")
    b: Mapped[float] = mapped_column(Float)
    q_yes: Mapped[float] = mapped_column(Float, default=0.0)
    q_no: Mapped[float] = mapped_column(Float, default=0.0)
    outcomes: Mapped[list] = mapped_column(JSON, default=list)
    q: Mapped[list] = mapped_column(JSON, default=list)
    lock_ton: Mapped[float] = mapped_column(Float, default=0.0)
    pot: Mapped[float] = mapped_column(Float, default=0.0)
    close_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    lock_returned: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[MarketStatus] = mapped_column(
        Enum(MarketStatus, native_enum=False, values_callable=lambda xs: [e.value for e in xs]),
        default=MarketStatus.open,
    )
    winning_outcome: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    settlement_kind: Mapped[str | None] = mapped_column(String(16), nullable=True)

    creator: Mapped[User] = relationship(back_populates="markets")
    positions: Mapped[list["Position"]] = relationship(back_populates="market")
    trades: Mapped[list["Trade"]] = relationship(back_populates="market")
    settlements: Mapped[list["SettlementRecord"]] = relationship(back_populates="market")


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
    shares: Mapped[list] = mapped_column(JSON, default=list)
    costs: Mapped[list] = mapped_column(JSON, default=list)
    claimed: Mapped[bool] = mapped_column(default=False)
    tip_paid: Mapped[float] = mapped_column(Float, default=0.0)

    user: Mapped[User] = relationship(back_populates="positions")
    market: Mapped[Market] = relationship(back_populates="positions")


class Trade(Base):
    __tablename__ = "trades"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    market_id: Mapped[int] = mapped_column(ForeignKey("markets.id"))
    outcome: Mapped[str] = mapped_column(String(128))
    money: Mapped[float] = mapped_column(Float)
    shares: Mapped[float] = mapped_column(Float)
    price_after: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped[User] = relationship(back_populates="trades")
    market: Mapped[Market] = relationship(back_populates="trades")


class SettlementRecord(Base):
    __tablename__ = "settlement_records"
    __table_args__ = (UniqueConstraint("market_id", "user_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    market_id: Mapped[int] = mapped_column(ForeignKey("markets.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    question: Mapped[str] = mapped_column(String(512), default="")
    winning_outcome: Mapped[str] = mapped_column(String(128), default="")
    chosen_outcomes: Mapped[list] = mapped_column(JSON, default=list)
    stakes_total: Mapped[float] = mapped_column(Float, default=0.0)
    payout: Mapped[float] = mapped_column(Float, default=0.0)
    tip: Mapped[float] = mapped_column(Float, default=0.0)
    credited: Mapped[float] = mapped_column(Float, default=0.0)
    result: Mapped[float] = mapped_column(Float, default=0.0)
    lock_ton: Mapped[float] = mapped_column(Float, default=0.0)
    residual_returned: Mapped[float] = mapped_column(Float, default=0.0)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped[User] = relationship(back_populates="settlements")
    market: Mapped[Market] = relationship(back_populates="settlements")
