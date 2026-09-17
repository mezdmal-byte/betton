import enum
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    BigInteger,
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
    pending = "pending"
    rejected = "rejected"
    open = "open"
    closed = "closed"
    resolved = "resolved"
    cancelled = "cancelled"


class Outcome(str, enum.Enum):
    yes = "yes"
    no = "no"


class User(Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint('balance_nano IS NOT NULL AND balance_nano BETWEEN 0 AND 9223372036854775807'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    telegram_id: Mapped[int | None] = mapped_column(Integer, unique=True, nullable=True)
    username: Mapped[str] = mapped_column(String(64), unique=True)
    balance_legacy: Mapped[float] = mapped_column('balance', Float, default=0.0)
    balance_nano: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    markets: Mapped[list["Market"]] = relationship(back_populates="creator")
    positions: Mapped[list["Position"]] = relationship(back_populates="user")
    trades: Mapped[list["Trade"]] = relationship(back_populates="user")
    settlements: Mapped[list["SettlementRecord"]] = relationship(back_populates="user")

    @property
    def balance(self):
        from app.money import as_ton
        return as_ton(self.balance_nano)

    @balance.setter
    def balance(self, value):
        from app.money import nonnegative_nano
        self.balance_nano = nonnegative_nano(value)
        if self.balance_legacy is None:
            self.balance_legacy = float(value)

    @property
    def is_admin(self) -> bool:
        return settings.is_admin_telegram(self.telegram_id)


class Market(Base):
    __tablename__ = "markets"
    __table_args__ = (
        CheckConstraint('pot_nano IS NOT NULL AND pot_nano BETWEEN 0 AND 9223372036854775807'),
        CheckConstraint('lock_nano IS NOT NULL AND lock_nano BETWEEN 0 AND 9223372036854775807'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    question: Mapped[str] = mapped_column(String(512))
    description: Mapped[str] = mapped_column(Text, default="")
    creator_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    category: Mapped[str] = mapped_column(String(32), default="unique", server_default="unique")
    mechanism: Mapped[str] = mapped_column(String(16), default="lmsr", server_default="lmsr")
    b: Mapped[float] = mapped_column(Float)
    q_yes: Mapped[float] = mapped_column(Float, default=0.0)
    q_no: Mapped[float] = mapped_column(Float, default=0.0)
    outcomes: Mapped[list] = mapped_column(JSON, default=list)
    q: Mapped[list] = mapped_column(JSON, default=list)
    lock_ton_legacy: Mapped[float] = mapped_column('lock_ton', Float, default=0.0)
    pot_legacy: Mapped[float] = mapped_column('pot', Float, default=0.0)
    pot_nano: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    lock_nano: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    close_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    lock_returned: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[MarketStatus] = mapped_column(
        Enum(MarketStatus, native_enum=False, values_callable=lambda xs: [e.value for e in xs]),
        default=MarketStatus.open,
    )
    winning_outcome: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    moderated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    moderated_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    cancelled_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
    settlement_kind: Mapped[str | None] = mapped_column(String(16), nullable=True)
    # full = journal from market creation; incomplete = existed before the journal.
    p2p_journal_coverage: Mapped[str] = mapped_column(
        String(16), default="not_applicable", server_default="not_applicable"
    )

    creator: Mapped[User] = relationship(back_populates="markets")
    positions: Mapped[list["Position"]] = relationship(back_populates="market")
    trades: Mapped[list["Trade"]] = relationship(back_populates="market")
    settlements: Mapped[list["SettlementRecord"]] = relationship(back_populates="market")

    @property
    def pot(self):
        from app.money import as_ton
        return as_ton(self.pot_nano)

    @pot.setter
    def pot(self, value):
        from app.money import nonnegative_nano
        self.pot_nano = nonnegative_nano(value)
        if self.pot_legacy is None:
            self.pot_legacy = float(value)

    @property
    def lock_ton(self):
        from app.money import as_ton
        return as_ton(self.lock_nano)

    @lock_ton.setter
    def lock_ton(self, value):
        from app.money import nonnegative_nano
        self.lock_nano = nonnegative_nano(value)
        if self.lock_ton_legacy is None:
            self.lock_ton_legacy = float(value)


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


class P2POrder(Base):
    __tablename__ = "p2p_orders"
    __table_args__ = (UniqueConstraint("user_id", "request_id"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    market_id: Mapped[int] = mapped_column(ForeignKey("markets.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    request_id: Mapped[str] = mapped_column(String(64))
    outcome: Mapped[int] = mapped_column(Integer)
    price: Mapped[int] = mapped_column(Integer)
    amount: Mapped[int] = mapped_column(BigInteger)
    remaining: Mapped[int] = mapped_column(BigInteger)
    filled: Mapped[int] = mapped_column(BigInteger, default=0)
    refunded: Mapped[int] = mapped_column(BigInteger, default=0)
    kind: Mapped[str] = mapped_column(String(8))
    status: Mapped[str] = mapped_column(String(16), default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class P2PFill(Base):
    __tablename__ = "p2p_fills"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    market_id: Mapped[int] = mapped_column(ForeignKey("markets.id"), index=True)
    maker_order_id: Mapped[int] = mapped_column(ForeignKey("p2p_orders.id"))
    taker_order_id: Mapped[int] = mapped_column(ForeignKey("p2p_orders.id"))
    maker_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    taker_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    maker_outcome: Mapped[int] = mapped_column(Integer)
    maker_stake: Mapped[int] = mapped_column(BigInteger)
    taker_stake: Mapped[int] = mapped_column(BigInteger)
    price: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class P2PMoneyEntry(Base):
    """Immutable P2P money movement. Insert-only; regular API never updates or deletes rows."""

    __tablename__ = "p2p_money_entries"
    __table_args__ = (UniqueConstraint("entry_key", name="uq_p2p_money_entry_key"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entry_key: Mapped[str] = mapped_column(String(128), nullable=False)
    op_type: Mapped[str] = mapped_column(String(32), nullable=False)
    market_id: Mapped[int] = mapped_column(ForeignKey("markets.id"), index=True)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("p2p_orders.id"), nullable=True)
    fill_id: Mapped[int | None] = mapped_column(ForeignKey("p2p_fills.id"), nullable=True)
    from_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    from_user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    from_order_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    to_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    to_user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    to_order_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    origin_key: Mapped[str | None] = mapped_column(String(128), nullable=True)
    reason: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
