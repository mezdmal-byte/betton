from datetime import datetime, timedelta
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database import get_db
from app.telegram_auth import get_current_user
from app.models import (
    User,
    Market,
    GuarantorProfile,
    GuarantorCase,
    GuarantorReview,
    GuarantorMessage,
    AppNotification,
)
from app.services import guarantors as gs, market_service as ms, market_access

router = APIRouter()


class ProfileInput(BaseModel):
    bio: str = Field(default="", max_length=1000)
    topics: str = Field(default="", max_length=300)
    accept_rules: bool = False


class AvailabilityInput(BaseModel):
    available: bool


class ApprovalInput(BaseModel):
    approved: bool


class CaseAction(BaseModel):
    action: Literal[
        "acknowledge",
        "decline",
        "accept",
        "invite",
        "message",
        "edit",
        "confirm",
        "extend",
        "consent",
        "propose",
        "escalate",
        "dispute",
        "admin_resolve",
        "admin_cancel",
        "review",
    ]
    revision: int | None = None
    guarantor_id: int | None = None
    text: str = Field(default="", max_length=4000)
    question: str | None = Field(default=None, min_length=8, max_length=512)
    outcomes: list[str] | None = Field(default=None, min_length=2, max_length=2)
    criteria: str = Field(default="", max_length=4000)
    source: str = Field(default="", max_length=2000)
    close_at: datetime | None = None
    result_due_at: datetime | None = None
    outcome: int | None = None
    rating: int | None = None


def profile_out(db, profile):
    """Public reputation is earned from completed markets, not self-description."""
    user = db.get(User, profile.user_id)
    reviews = (
        db.query(GuarantorReview)
        .filter_by(guarantor_id=user.id)
        .order_by(GuarantorReview.id.desc())
        .all()
    )
    completed = (
        db.query(GuarantorCase)
        .filter_by(guarantor_id=user.id, state="settled")
        .count()
    )
    dispute_count = (
        db.query(GuarantorMessage.market_id)
        .join(GuarantorCase, GuarantorCase.market_id == GuarantorMessage.market_id)
        .filter(
            GuarantorCase.guarantor_id == user.id,
            GuarantorMessage.kind.in_(("escalate", "dispute")),
        )
        .distinct()
        .count()
    )
    rating = round(sum(r.rating for r in reviews) / len(reviews), 2) if reviews else None
    # Earned badge, not a claim of identity verification or guaranteed honesty.
    high_reputation = bool(
        completed >= 10
        and len({review.user_id for review in reviews}) >= 5
        and rating is not None
        and rating >= 4.5
        and dispute_count <= 1
    )
    return dict(
        user_id=user.id,
        name=user.display_name or user.telegram_username or "Гарант",
        bio=profile.bio,
        topics=profile.topics,
        status=profile.status,
        is_moderator=user.is_admin,
        high_reputation=high_reputation,
        available_until=profile.available_until,
        available=bool(
            profile.status == "approved"
            and profile.available_until
            and profile.available_until > gs.now()
            and profile.last_seen_at
            and profile.last_seen_at > gs.now() - timedelta(seconds=90)
        ),
        completed=completed,
        disputes=dispute_count,
        rating=rating,
        review_count=len(reviews),
        rating_distribution={
            str(stars): sum(r.rating == stars for r in reviews)
            for stars in range(5, 0, -1)
        },
        reviews=[dict(rating=r.rating, text=r.text) for r in reviews[:20]],
    )


@router.get("/guarantors")
def directory(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(GuarantorProfile)
        .filter_by(status="approved")
        .order_by(GuarantorProfile.user_id)
        .all()
    )
    return [profile_out(db, p) for p in rows]


@router.get("/guarantors/me")
def my_profile(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.get(GuarantorProfile, user.id)
    return profile_out(db, row) if row else None


@router.put("/guarantors/me")
def apply(
    req: ProfileInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = (
        db.query(GuarantorProfile)
        .filter_by(user_id=user.id)
        .with_for_update()
        .populate_existing()
        .first()
    )
    if not row:
        ms._lock_users(db, [user.id])
        row = db.get(GuarantorProfile, user.id)
    if row and row.status == "rejected":
        gs.fail("Аккаунт гаранта приостановлен администратором", 403)
    if (not row or row.status == "pending") and not req.accept_rules:
        gs.fail("Для регистрации подтвердите правила работы гаранта", 422)
    if not row:
        row = GuarantorProfile(user_id=user.id, status="approved")
        db.add(row)
    row.bio, row.topics = req.bio.strip(), req.topics.strip()
    row.status = "approved"
    db.commit()
    return profile_out(db, row)


@router.post("/guarantors/me/availability")
def availability(
    req: AvailabilityInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = (
        db.query(GuarantorProfile)
        .filter_by(user_id=user.id)
        .with_for_update()
        .populate_existing()
        .first()
    )
    if not row or row.status != "approved":
        gs.fail("Сначала дождитесь одобрения профиля", 403)
    row.available_until = gs.now() + timedelta(hours=1) if req.available else None
    row.last_seen_at = gs.now()
    db.commit()
    return profile_out(db, row)


@router.get("/guarantors/applications")
def applications(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ms.require_admin(user)
    return [
        profile_out(db, p)
        for p in db.query(GuarantorProfile).order_by(GuarantorProfile.user_id).all()
    ]


@router.post("/guarantors/{uid}/approval")
def approve(
    uid: int,
    req: ApprovalInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ms.require_admin(user)
    row = (
        db.query(GuarantorProfile)
        .filter_by(user_id=uid)
        .with_for_update()
        .populate_existing()
        .first()
    )
    if not row:
        gs.fail("Профиль не найден", 404)
    row.status = "approved" if req.approved else "rejected"
    row.available_until = None
    gs.notice(
        db,
        uid,
        None,
        (
            "Профиль гаранта одобрен"
            if req.approved
            else "Приём новых пари приостановлен администратором"
        ),
    )
    db.commit()
    return profile_out(db, row)


@router.get("/guarantor-cases")
def inbox(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(GuarantorCase).join(Market, Market.id == GuarantorCase.market_id)
    if not user.is_admin:
        query = query.filter(
            (GuarantorCase.guarantor_id == user.id) | (Market.creator_id == user.id)
        )
    rows = query.order_by(GuarantorCase.market_id.desc()).limit(100).all()
    result = []
    for case in rows:
        market = db.get(Market, case.market_id)
        # Read-only response; persisted expiry is processed by worker/actions.
        result.append(
            dict(
                market_id=market.id,
                question=market.question,
                state=case.state,
                deadline=case.deadline,
                guarantor_id=case.guarantor_id,
                creator_id=market.creator_id,
            )
        )
    return result


@router.get("/markets/{mid}/guarantor")
def detail(
    mid: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    market = ms.get_market(db, mid)
    market_access.require_unlisted_access(
        market, viewer=user, share_token=market_access.share_token_from_request(request)
    )
    case = db.get(GuarantorCase, mid)
    return gs.case_view(db, market, case, user) if case else None


@router.post("/markets/{mid}/guarantor")
def act(
    mid: int,
    req: CaseAction,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return gs.transition(
        db, mid, user, req, market_access.share_token_from_request(request)
    )


@router.get("/notifications")
def notifications(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    rows = (
        db.query(AppNotification)
        .filter_by(user_id=user.id)
        .order_by(AppNotification.id.desc())
        .limit(100)
        .all()
    )
    return [
        dict(
            id=r.id,
            market_id=r.market_id,
            text=r.text,
            read=r.read,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.post("/notifications/{nid}/read")
def mark_read(
    nid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    row = db.query(AppNotification).filter_by(id=nid, user_id=user.id).first()
    if not row:
        gs.fail("Уведомление не найдено", 404)
    row.read = True
    db.commit()
    return {"ok": True}


@router.post("/guarantors/me/heartbeat")
def heartbeat(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Heartbeat updates presence only; it cannot turn availability back on.
    db.query(GuarantorProfile).filter_by(user_id=user.id).update(
        {"last_seen_at": gs.now()}
    )
    db.commit()
    return {"ok": True}
