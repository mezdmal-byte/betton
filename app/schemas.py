from datetime import datetime
from typing import Literal, Optional, Union

from pydantic import BaseModel, Field

from app.models import MarketStatus

MarketCategory = Literal["sport", "politics", "unique"]
OutcomeRef = Union[str, int]


class UserCreate(BaseModel):
    username: str
    telegram_id: Optional[int] = None


class TelegramAuth(BaseModel):
    telegram_id: int
    username: Optional[str] = None


class UserOut(BaseModel):
    id: int
    username: str
    telegram_id: Optional[int]
    balance: float
    is_admin: bool = False

    class Config:
        from_attributes = True


class MarketCreate(BaseModel):
    creator_id: int
    question: str
    description: Optional[str] = ""
    category: MarketCategory = "unique"
    outcomes: list[str] = Field(default_factory=lambda: ["Да", "Нет"])
    lock_ton: float = Field(default=50.0, ge=10)
    close_at: datetime
    target_odds: Optional[list[float]] = None
    target_probs: Optional[list[float]] = None


class QuoteRequest(BaseModel):
    outcome: OutcomeRef
    money: float = Field(gt=0)


class BuySharesRequest(BaseModel):
    user_id: int
    outcome: OutcomeRef
    money: float = Field(gt=0)


class ClaimWinningsRequest(BaseModel):
    user_id: int
    tip_rate: float = Field(default=0.01, ge=0.0, le=0.01)


class ResolveRequest(BaseModel):
    winning_outcome: OutcomeRef
    user_id: int


class CloseMarketRequest(BaseModel):
    user_id: int


class CollectResidualRequest(BaseModel):
    user_id: int


class QuoteOut(BaseModel):
    shares: float
    avg_price: float
    odds: float
    outcome: str
    outcome_index: int


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
