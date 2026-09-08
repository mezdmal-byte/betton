from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models import MarketStatus, Outcome


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

    class Config:
        from_attributes = True


class MarketCreate(BaseModel):
    creator_id: int
    question: str
    b: float = Field(default=100.0, gt=0)
    description: Optional[str] = ""


class BuySharesRequest(BaseModel):
    user_id: int
    outcome: Outcome
    money: float = Field(gt=0)


class ClaimWinningsRequest(BaseModel):
    user_id: int
    tip_rate: float = Field(default=0.0, ge=0.0, le=0.01)


class ResolveRequest(BaseModel):
    winning_outcome: Outcome


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
    winning_outcome: Optional[Outcome]
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
