from datetime import datetime

from pydantic import BaseModel, Field

from app.models import MarketStatus, Outcome


class UserCreate(BaseModel):
    username: str = Field(min_length=2, max_length=64)
    telegram_id: int | None = None


class UserOut(BaseModel):
    id: int
    username: str
    telegram_id: int | None
    balance: float

    model_config = {"from_attributes": True}


class MarketCreate(BaseModel):
    creator_id: int
    question: str = Field(min_length=8, max_length=512)
    description: str = ""
    b: float = Field(gt=0, description="Параметр ликвидности LMSR")


class MarketOut(BaseModel):
    id: int
    question: str
    description: str
    creator_id: int
    b: float
    q_yes: float
    q_no: float
    price_yes: float
    price_no: float
    cost_c: float
    status: MarketStatus
    winning_outcome: Outcome | None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class BuySharesRequest(BaseModel):
    user_id: int
    outcome: Outcome
    money: float = Field(gt=0, description="Сумма ставки, комиссия 0%")


class BuySharesResponse(BaseModel):
    market_id: int
    outcome: Outcome
    money: float
    shares: float
    avg_price: float
    price_yes: float
    price_no: float
    balance: float


class ResolveRequest(BaseModel):
    winning_outcome: Outcome


class ClaimRequest(BaseModel):
    user_id: int
    tip_rate: float = Field(
        default=0.0,
        ge=0.0,
        le=0.01,
        description="Чаевые как доля чистой прибыли, максимум 1%",
    )


class ClaimResponse(BaseModel):
    payout: float
    net_profit: float
    tip: float
    credited: float
    balance: float
