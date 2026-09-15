from datetime import datetime
from typing import Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

from app.models import MarketStatus

MarketCategory = Literal["sport", "politics", "unique"]
OutcomeRef = Union[str, int]


class UserCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    username: Optional[str] = None
    telegram_id: Optional[int] = None


class TelegramAuth(BaseModel):
    model_config = ConfigDict(extra="ignore")
    telegram_id: Optional[int] = None
    username: Optional[str] = None


class UserOut(BaseModel):
    id: int
    username: str
    telegram_id: Optional[int]
    balance: float
    is_admin: bool = False
    telegram_username: Optional[str] = None
    display_name: Optional[str] = None
    photo_url: Optional[str] = None

    class Config:
        from_attributes = True


class CreatorBriefOut(BaseModel):
    id: int
    display_name: str
    telegram_username: Optional[str] = None


class MarketActivityOut(BaseModel):
    volume: float = 0.0
    volume_nano: int = 0
    fills: int = 0
    unique_participants: int = 0


class AccountOut(BaseModel):
    id: int
    username: str
    telegram_id: Optional[int] = None
    telegram_username: Optional[str] = None
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    is_admin: bool = False
    balance: float
    balance_nano: int
    reserved: float
    reserved_nano: int
    in_positions: float
    in_positions_nano: int
    creator_earnings: float = 0.0
    creator_earnings_nano: int = 0


class CreatorStatsOut(BaseModel):
    id: int
    display_name: str
    telegram_username: Optional[str] = None
    photo_url: Optional[str] = None
    rank: Optional[int] = None
    markets_created: int = 0
    volume: float = 0.0
    volume_nano: int = 0
    fills: int = 0
    unique_participants: int = 0
    active_markets: int = 0
    completed_markets: int = 0


class MarketCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    mechanism: Literal["lmsr", "p2p"] = "p2p"
    question: str
    description: Optional[str] = ""
    category: MarketCategory = "unique"
    outcomes: list[str] = Field(default_factory=lambda: ["Да", "Нет"])
    lock_ton: float = Field(default=50.0, ge=10)
    close_at: datetime
    target_odds: Optional[list[float]] = None
    target_probs: Optional[list[float]] = None
    visibility: Literal["public", "unlisted"] = "public"


class QuoteRequest(BaseModel):
    outcome: OutcomeRef
    money: float = Field(gt=0)


class BuySharesRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    outcome: OutcomeRef
    money: float = Field(gt=0)


class ClaimWinningsRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    tip_rate: float = Field(default=0.01, ge=0.0, le=0.01)


class ResolveRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    winning_outcome: OutcomeRef


class RejectMarketRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


class CancelMarketRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


class CloseMarketRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")


class CollectResidualRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")


class QuoteOut(BaseModel):
    shares: float
    avg_price: float
    odds: float
    outcome: str
    outcome_index: int


class BestOfferOut(BaseModel):
    odds: float
    available: float


class MarketOut(BaseModel):
    id: int
    question: str
    description: str
    creator_id: int
    category: str
    b: float
    q: list[float]
    outcomes: list[str]
    prices: list[float]
    odds: list[float]
    lock_ton: float
    pot: float
    close_at: Optional[datetime] = None
    q_yes: float = 0.0
    q_no: float = 0.0
    price_yes: float = 0.0
    price_no: float = 0.0
    cost_c: float
    status: MarketStatus
    winning_outcome: Optional[str] = None
    created_at: Optional[datetime] = None
    accepting_bets: bool = False
    rejection_reason: Optional[str] = None
    moderated_at: Optional[datetime] = None
    moderated_by: Optional[int] = None
    cancellation_reason: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    cancelled_by: Optional[int] = None
    mechanism: str = "lmsr"
    settlement_kind: Optional[str] = None
    best_offers: Optional[list[Optional[BestOfferOut]]] = None
    creator: Optional[CreatorBriefOut] = None
    activity: Optional[MarketActivityOut] = None
    visibility: str = "public"
    share_token: Optional[str] = None

    class Config:
        from_attributes = True


class PositionOut(BaseModel):
    market_id: int
    shares: list[float]
    costs: list[float]
    shares_yes: float = 0.0
    shares_no: float = 0.0
    cost_yes: float = 0.0
    cost_no: float = 0.0
    claimed: bool
    tip_paid: float
    market: MarketOut


class TransactionOut(BaseModel):
    id: str
    type: str
    market_id: Optional[int] = None
    question: str = ""
    created_at: Optional[datetime] = None
    amount_nano: int
    amount: float
    display_nano: int
    display_amount: float
    informational: bool = False


class SettlementOut(BaseModel):
    market_id: int
    question: str
    winning_outcome: str
    chosen_outcomes: list[str]
    stakes_total: float
    payout: float
    tip: float
    credited: float
    result: float
    lock_ton: float = 0.0
    residual_returned: float = 0.0
    resolved_at: Optional[datetime] = None
    is_loss: bool = False
    settlement_kind: Optional[str] = None
    cancellation_reason: Optional[str] = None


from decimal import Decimal


class OrderPreviewRequest(BaseModel):
    outcome: int = Field(ge=0, le=1)
    money: Decimal
    odds: Decimal


class OrderRequest(OrderPreviewRequest):
    kind: Literal["limit", "ioc"] = "limit"
    request_id: str = Field(min_length=8, max_length=64)


class P2PMoneyEntryOut(BaseModel):
    id: int
    entry_key: str
    op_type: str
    market_id: int
    order_id: Optional[int] = None
    fill_id: Optional[int] = None
    from_kind: str
    from_user_id: Optional[int] = None
    from_order_id: Optional[int] = None
    to_kind: str
    to_user_id: Optional[int] = None
    to_order_id: Optional[int] = None
    amount_nano: int
    origin_key: Optional[str] = None
    reason: Optional[str] = None
    created_at: Optional[datetime] = None


class P2PReconciliationOut(BaseModel):
    market_id: int
    status: str
    journal_coverage: str
    fully_verified: bool
    coverage_note: str
    float_tolerance_ton: float
    float_fields: list[str]
    integer_fields: list[str]
    orders: dict
    pot: dict
    entry_counts: dict
    coverage_gaps: list[dict]
    discrepancies: list[dict]
    entries: list[P2PMoneyEntryOut]
