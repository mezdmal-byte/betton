"""Additive UX v3 contracts. Existing events, matching and fee arithmetic stay unchanged."""

from datetime import datetime, timedelta
from typing import Literal, ClassVar
from uuid import UUID
import hashlib
import json
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, HttpUrl, model_validator
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi.encoders import jsonable_encoder

from app.database import get_db
from app.models import (
    Market,
    MarketStatus,
    User,
    P2POrder,
    P2PFill,
    GuarantorCase,
    EventConfigV3,
    EventRevisionV3,
    PrivateTermsConsent,
)
from app.telegram_auth import get_current_user, get_optional_user
from app.services import (
    market_service as ms,
    market_access,
    discovery,
    guarantors as gs,
    p2p_service as p2p,
)

router = APIRouter(prefix="/ux-v3", tags=["UX v3"])


class Source(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    url: HttpUrl

    @model_validator(mode="after")
    def trim_name(self):
        self.name = self.name.strip()
        if not self.name:
            raise ValueError("Укажите название источника")
        return self


class EventInput(BaseModel):
    check_future: ClassVar[bool] = True
    event_type: Literal["public", "private", "guarantor"]
    question: str = Field(min_length=8, max_length=512)
    outcomes: list[str] = Field(min_length=2, max_length=2)
    category: (
        Literal["sport", "sports", "esports", "politics", "crypto", "unique"] | None
    ) = None
    description: str = Field(default="", max_length=4000)
    rules: str = Field(min_length=1, max_length=4000)
    criteria: list[str] | None = Field(default=None, min_length=2, max_length=2)
    resolution_method: str = Field(min_length=1, max_length=4000)
    unverifiable: str = Field(default="", max_length=4000)
    primary_source: Source | None = None
    backup_source: Source | None = None
    close_at: datetime
    ends_at: datetime
    guarantor_id: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def validate_terms(self):
        if self.category == "sports":
            self.category = "sport"
        self.question = self.question.strip()
        self.outcomes = [name.strip() for name in self.outcomes]
        self.rules, self.resolution_method = (
            self.rules.strip(),
            self.resolution_method.strip(),
        )
        if len(self.question) < 8 or not self.rules or not self.resolution_method:
            raise ValueError(
                "Заполните название, правила и способ определения результата"
            )
        if (
            any(not name or len(name) > 128 for name in self.outcomes)
            or self.outcomes[0].casefold() == self.outcomes[1].casefold()
        ):
            raise ValueError("Укажите два разных исхода (до 128 символов)")
        if self.criteria and any(
            not value.strip() or len(value) > 4000 for value in self.criteria
        ):
            raise ValueError("Укажите критерии обоих исходов")
        if (self.check_future and ms.as_utc(self.close_at) <= ms.utcnow()) or ms.as_utc(
            self.ends_at
        ) < ms.as_utc(self.close_at):
            raise ValueError("Проверьте окончание приёма ставок и завершение события")
        if self.event_type == "public" and (
            not self.category
            or not self.primary_source
            or not self.criteria
            or not self.unverifiable.strip()
        ):
            raise ValueError(
                "Для публичного события нужны категория, критерии, основной источник и порядок при неопределённом результате"
            )
        if self.event_type == "guarantor" and not self.guarantor_id:
            raise ValueError("Выберите гаранта")
        if self.event_type != "guarantor" and self.guarantor_id:
            raise ValueError("Этот тип события не использует гаранта")
        return self


def record_revision(db, market, config, actor_id, kind):
    db.add(
        EventRevisionV3(
            market_id=market.id,
            revision=config.revision,
            actor_id=actor_id,
            kind=kind,
            snapshot={
                **config.terms,
                "creator_id": market.creator_id,
                "_reward": config.reward or {},
            },
        )
    )


def config_for(db, mid):
    config = db.get(EventConfigV3, mid)
    if not config:
        raise HTTPException(404, "Событие использует прежний протокол")
    return config


def visible(db, mid, user, request):
    market = db.get(Market, mid)
    if not market:
        raise HTTPException(404, "Событие не найдено")
    if market.status in (MarketStatus.pending, MarketStatus.rejected) and (
        not user or not (user.is_admin or market.creator_id == user.id)
    ):
        raise HTTPException(404, "Событие не найдено")
    market_access.require_unlisted_access(
        market, viewer=user, share_token=market_access.share_token_from_request(request)
    )
    return market, config_for(db, mid)


class EventCreateInput(EventInput):
    # A completed request remains replayable after the betting cutoff.
    check_future: ClassVar[bool] = False
    request_id: UUID


def event_payload(req: EventCreateInput) -> dict:
    body = req.model_dump(mode="json", exclude={"request_id"})
    for field in ("close_at", "ends_at"):
        body[field] = ms.as_utc(getattr(req, field)).isoformat()
    return body


@router.post("/events")
def create_event(
    req: EventCreateInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        body = event_payload(req)
        payload_hash = hashlib.sha256(json.dumps(body, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        params = {"uid": user.id, "key": str(req.request_id), "hash": payload_hash}
        claim = db.execute(text("""INSERT INTO event_creation_intents(user_id,operation,request_id,payload_hash)
            VALUES(:uid,'create_event',:key,:hash)
            ON CONFLICT(user_id,operation,request_id) DO NOTHING"""), params)
        if claim.rowcount == 0:
            previous = db.execute(text("""SELECT payload_hash,response FROM event_creation_intents
                WHERE user_id=:uid AND operation='create_event' AND request_id=:key"""), params).mappings().one()
            if previous['payload_hash'] != payload_hash:
                raise HTTPException(409, "Этот идентификатор уже использован для другого события")
            if previous['response'] is None:
                raise HTTPException(409, "Результат создания события ещё не определён")
            result = json.loads(previous['response'])
            db.rollback()
            return result
        # Time-sensitive validation applies only to a new intent, never to replay.
        if ms.as_utc(req.close_at) <= ms.utcnow():
            raise HTTPException(422, "Приём ставок должен завершаться в будущем")
        private = req.event_type != "public"
        market = Market(
            question=req.question,
            description=req.description,
            creator_id=user.id,
            category=req.category or "unique",
            outcomes=req.outcomes,
            mechanism="p2p",
            b=1,
            q=[0, 0],
            q_yes=0,
            q_no=0,
            lock_ton=0,
            pot=0,
            lock_returned=True,
            close_at=ms._naive_utc(req.close_at),
            visibility="unlisted" if private else "public",
            share_token=secrets.token_urlsafe(24) if private else None,
            status=MarketStatus.pending
            if not private
            else MarketStatus.closed
            if req.event_type == "guarantor"
            else MarketStatus.open,
            p2p_journal_coverage="full",
        )
        db.add(market)
        db.flush()
        config = EventConfigV3(
            market_id=market.id,
            event_type=req.event_type,
            ends_at=ms._naive_utc(req.ends_at),
            terms=body,
            revision=1,
            moderator_edited=False,
            reward={},
        )
        db.add(config)
        if req.event_type == 'guarantor':
            config.terms = {**config.terms, '_reward_engine':1}
        record_revision(db, market, config, user.id, "created")
        if req.event_type == "guarantor":
            from types import SimpleNamespace

            gs.create_case(
                db,
                market,
                SimpleNamespace(
                    guarantor_id=req.guarantor_id,
                    resolution_criteria=req.rules,
                    resolution_source=req.resolution_method,
                    result_due_at=req.ends_at + timedelta(hours=24),
                ),
            )
        db.flush()
        result = jsonable_encoder(discovery.attach_market_views(db, [market], include_share_token=True)[0])
        db.execute(text("""UPDATE event_creation_intents SET response=:response
            WHERE user_id=:uid AND operation='create_event' AND request_id=:key"""),
            {**params, "response": json.dumps(result, ensure_ascii=False)})
        db.commit()
        return result
    except Exception:
        db.rollback()
        raise


@router.get("/events/{mid}/terms")
def terms(
    mid: int,
    request: Request,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    market, config = visible(db, mid, user, request)
    consent = db.get(PrivateTermsConsent, (mid, user.id)) if user else None
    return {
        **config.terms,
        "revision": config.revision,
        "creator_id": market.creator_id,
        "guarantor_due_at": config.ends_at + timedelta(hours=24)
        if config.event_type == "guarantor"
        else None,
        "consent": bool(consent and consent.revision == config.revision),
        "moderator_edited": config.moderator_edited,
        "reward_payments_supported": bool(config.event_type == 'guarantor' and config.terms.get('_reward_engine') == 1),
    }


@router.get("/events/{mid}/revisions")
def revisions(
    mid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    market = db.get(Market, mid)
    if not market or not (user.is_admin or market.creator_id == user.id):
        raise HTTPException(404, "История недоступна")
    return [
        {
            "id": r.id,
            "revision": r.revision,
            "actor_id": r.actor_id,
            "kind": r.kind,
            "snapshot": r.snapshot,
            "created_at": r.created_at,
        }
        for r in db.query(EventRevisionV3)
        .filter_by(market_id=mid)
        .order_by(EventRevisionV3.id)
        .limit(100)
    ]


class EditInput(BaseModel):
    expected_revision: int = Field(ge=1)
    event: EventInput


@router.put("/events/{mid}/moderation")
def edit_pending(
    mid: int,
    req: EditInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ms.require_admin(user)
    try:
        market = ms._lock_market(db, mid)
        config = config_for(db, mid)
        if (
            config.event_type != "public"
            or req.event.event_type != "public"
            or market.status != MarketStatus.pending
        ):
            raise HTTPException(
                409, "Редактирование доступно только до публикации публичного события"
            )
        if req.expected_revision != config.revision:
            raise HTTPException(409, "Редакция изменилась. Обновите заявку")
        if (
            db.query(P2POrder.id).filter_by(market_id=mid).first()
            or db.query(P2PFill.id).filter_by(market_id=mid).first()
        ):
            raise HTTPException(409, "Приём ставок уже начался")
        event = req.event
        market.question, market.description, market.outcomes = (
            event.question,
            event.description,
            event.outcomes,
        )
        market.category, market.close_at = event.category, ms._naive_utc(event.close_at)
        config.terms, config.ends_at = (
            event.model_dump(mode="json"),
            ms._naive_utc(event.ends_at),
        )
        config.revision += 1
        config.moderator_edited = True
        record_revision(db, market, config, user.id, "moderation_edit")
        gs.notice(
            db,
            market.creator_id,
            mid,
            "Модератор уточнил заявку события до публикации. Изменения сохранены в истории.",
        )
        db.commit()
        return {
            "revision": config.revision,
            "publication_blocked": False,
        }
    except Exception:
        db.rollback()
        raise


@router.post("/events/{mid}/moderation/approve-original")
def approve_original(
    mid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    ms.require_admin(user)
    try:
        market = ms._lock_market(db, mid)
        config = config_for(db, mid)
        if market.status != MarketStatus.pending or config.event_type != "public":
            raise HTTPException(409, "Заявка уже рассмотрена")
        original = (
            db.query(EventRevisionV3).filter_by(market_id=mid, kind="created").first()
        )
        values = {
            key: value
            for key, value in original.snapshot.items()
            if key not in ("creator_id", "_reward")
        }
        event = EventInput.model_validate(values)
        market.question, market.description, market.outcomes = (
            event.question,
            event.description,
            event.outcomes,
        )
        market.category, market.close_at = event.category, ms._naive_utc(event.close_at)
        config.terms, config.ends_at = (
            event.model_dump(mode="json"),
            ms._naive_utc(event.ends_at),
        )
        config.revision += 1
        config.moderator_edited = False
        record_revision(db, market, config, user.id, "original_approved")
        result = ms.moderate_market(db, mid, user.id)
        return discovery.attach_market_views(db, [result], include_share_token=True)[0]
    except Exception:
        db.rollback()
        raise


class Decision(BaseModel):
    outcome: int = Field(ge=0, le=1)
    reason: str = Field(min_length=1, max_length=4000)


class PublishRevision(BaseModel):
    expected_revision: int = Field(ge=1)


@router.post("/events/{mid}/moderation/publish")
def publish_revision(
    mid: int,
    req: PublishRevision,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ms.require_admin(user)
    try:
        market = ms._lock_market(db, mid)
        config = config_for(db, mid)
        if config.event_type != "public" or market.status != MarketStatus.pending:
            raise HTTPException(409, "Заявка уже рассмотрена")
        if config.revision != req.expected_revision:
            raise HTTPException(
                409, "Редакция изменилась. Проверьте изменения перед публикацией"
            )
        result = ms.moderate_market(db, mid, user.id)
        return discovery.attach_market_views(db, [result], include_share_token=True)[0]
    except Exception:
        db.rollback()
        raise


@router.post("/events/{mid}/creator-decision")
def creator_decision(
    mid: int,
    req: Decision,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        market = ms._lock_market(db, mid)
        config = config_for(db, mid)
        if config.event_type != "private" or market.creator_id != user.id:
            raise HTTPException(
                403, "Результат определяет создатель этого частного события"
            )
        if config.ends_at > gs.now():
            raise HTTPException(409, "Событие ещё не завершилось")
        if market.status in (MarketStatus.resolved, MarketStatus.cancelled):
            raise HTTPException(409, "Результат уже определён")
        if not req.reason.strip():
            raise HTTPException(422, "Укажите основание решения")
        record_revision(db, market, config, user.id, "creator_decision")
        db.add(
            EventRevisionV3(
                market_id=mid,
                revision=config.revision,
                actor_id=user.id,
                kind="decision_reason",
                snapshot={"outcome": req.outcome, "reason": req.reason.strip()},
            )
        )
        result = p2p.settle(db, market, req.outcome)
        return discovery.attach_market_views(db, [result], include_share_token=True)[0]
    except Exception:
        db.rollback()
        raise


class Consent(BaseModel):
    revision: int = Field(ge=1)


@router.post("/events/{mid}/consent")
def creator_terms_consent(
    mid: int,
    req: Consent,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    market, config = visible(db, mid, user, request)
    if (
        config.event_type != "private"
        or config.revision != req.revision
        or market.status != MarketStatus.open
    ):
        raise HTTPException(409, "Обновите условия события")
    row = db.get(PrivateTermsConsent, (mid, user.id))
    if row:
        row.revision = config.revision
    else:
        db.add(
            PrivateTermsConsent(
                market_id=mid, user_id=user.id, revision=config.revision
            )
        )
    db.commit()
    return {"consent": True, "revision": config.revision}


class CancelInput(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


@router.post("/events/{mid}/creator-cancel")
def creator_cancel(
    mid: int,
    req: CancelInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    market = p2p.cancel_creator_v3(db, mid, user, req.reason)
    return discovery.attach_market_views(db, [market], include_share_token=True)[0]


@router.put("/events/{mid}/terms")
def edit_guarantor_terms(
    mid: int,
    req: EditInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        market = ms._lock_market(db, mid)
        config = config_for(db, mid)
        case = db.get(GuarantorCase, mid)
        if not case or config.event_type != "guarantor" or user.id != market.creator_id:
            raise HTTPException(403, "Условия редактирует создатель события с гарантом")
        gs.expire(db, market, case)
        if (
            case.state != "review"
            or req.expected_revision != case.revision
            or req.event.event_type != "guarantor"
        ):
            raise HTTPException(
                409, "Условия уже изменились или согласование закончено"
            )
        if req.event.guarantor_id != case.guarantor_id:
            raise HTTPException(
                422, "Выбор другого гаранта выполняется отдельным приглашением"
            )
        event = req.event
        market.question, market.description, market.outcomes = (
            event.question,
            event.description,
            event.outcomes,
        )
        market.close_at = ms._naive_utc(event.close_at)
        case.criteria, case.source = event.rules, event.resolution_method
        config.ends_at = ms._naive_utc(event.ends_at)
        case.result_due_at = config.ends_at + timedelta(hours=24)
        config.terms = {**event.model_dump(mode="json"), **({'_reward_engine':1} if config.terms.get('_reward_engine') == 1 else {})}
        config.revision += 1
        case.revision = config.revision
        case.creator_confirmed = 0
        config.reward = {}
        record_revision(db, market, config, user.id, "creator_edit")
        gs.log(db, case, user.id, "terms", gs.snapshot(market, case))
        gs.notice(
            db,
            case.guarantor_id,
            mid,
            "Создатель обновил условия. Подтвердите последнюю редакцию",
        )
        db.commit()
        return {"revision": config.revision}
    except Exception:
        db.rollback()
        raise


class RewardInput(BaseModel):
    expected_revision: int = Field(ge=1)
    action: Literal["propose", "accept"] = "propose"
    mode: Literal["fixed", "percent", "combined", "percent_minimum"] = "fixed"
    fixed_ton: str = Field(default="0", max_length=30)
    percent: str = Field(default="0", max_length=10)


@router.post("/events/{mid}/reward")
def negotiate_reward(
    mid: int,
    req: RewardInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from decimal import Decimal, InvalidOperation

    try:
        market = ms._lock_market(db, mid)
        config = config_for(db, mid)
        case = db.get(GuarantorCase, mid)
        if not case or user.id not in (market.creator_id, case.guarantor_id):
            raise HTTPException(403, "Переговоры доступны создателю и гаранту")
        gs.expire(db, market, case)
        if case.state != "review" or req.expected_revision != case.revision:
            raise HTTPException(409, "Обновите условия согласования")
        if req.action == "accept":
            if not config.reward:
                raise HTTPException(409, "Нет предложения о вознаграждении")
            reward = {
                **config.reward,
                "accepted_by": sorted(
                    set(config.reward.get("accepted_by", [])) | {user.id}
                ),
            }
        else:
            try:
                fixed, percent = Decimal(req.fixed_ton), Decimal(req.percent)
                if (
                    not fixed.is_finite()
                    or not percent.is_finite()
                    or not 0 <= fixed <= 1000000
                    or not 0 <= percent <= 100
                ):
                    raise InvalidOperation()
                if fixed.as_tuple().exponent < -9 or percent.as_tuple().exponent < -2:
                    raise InvalidOperation()
            except (InvalidOperation, ValueError):
                raise HTTPException(
                    422, "Проверьте сумму TON и процент от чистой прибыли"
                )
            if req.mode == "fixed":
                percent = Decimal(0)
            if req.mode == "percent":
                fixed = Decimal(0)
            config.revision += 1
            case.revision = config.revision
            case.creator_confirmed = 0
            reward = {
                "mode": req.mode,
                "fixed_ton": str(fixed),
                "percent": str(percent),
                "proposed_by": user.id,
                "accepted_by": [user.id],
            }
        config.reward = reward
        labels = {
            'fixed': f"{reward['fixed_ton']} TON за событие",
            'percent': f"{reward['percent']}% от чистой прибыли победителей",
            'combined': f"{reward['percent']}% от чистой прибыли победителей + {reward['fixed_ton']} TON",
            'percent_minimum': f"{reward['percent']}% от чистой прибыли победителей, но не меньше {reward['fixed_ton']} TON",
        }
        gs.log(
            db,
            case,
            user.id,
            "reward",
            'Условия вознаграждения: ' + labels[reward['mode']] + '. Удерживается только из прибыли победителей.',
        )
        record_revision(db, market, config, user.id, "reward_" + req.action)
        db.commit()
        return {
            "reward": reward,
            "revision": case.revision,
            "payments_supported": bool(config.terms.get('_reward_engine') == 1),
        }
    except Exception:
        db.rollback()
        raise
