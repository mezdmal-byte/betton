"""Version-specific authority only. All payouts use the existing tested P2P settlement."""

from datetime import timedelta
from decimal import Decimal
from fastapi import HTTPException
from app.services import guarantors as gs
from app.services import p2p_service as p2p
from app.models import MarketStatus, GuarantorProfile, EventRevisionV3


def transition_v3(db, market, case, config, user, req):
    action = req.action
    party = user.id in (market.creator_id, case.guarantor_id)
    if action in ("dispute", "admin_resolve", "admin_cancel", "escalate"):
        raise HTTPException(
            409,
            "В UX v3 своевременное решение гаранта окончательное; пересмотр обычной модерацией недоступен",
        )
    if action == "edit":
        raise HTTPException(
            409, "Редактируйте структурированные условия через форму UX v3"
        )
    if action == "invite":
        if user.id != market.creator_id:
            raise HTTPException(403, "Другого гаранта приглашает создатель")
        if case.state != "needs_guarantor":
            raise HTTPException(409, "Дождитесь завершения предыдущего приглашения")
        gs.available(db, req.guarantor_id, user.id)
        config.revision += 1
        config.terms = {**config.terms, "guarantor_id": req.guarantor_id}
        config.reward = {}
        case.guarantor_id, case.revision = req.guarantor_id, config.revision
        case.creator_confirmed = case.revision
        case.state, case.deadline = "invited", gs.now() + timedelta(minutes=1)
        gs.log(db, case, user.id, "invite", "Создатель выбрал нового гаранта")
        gs.notice(
            db,
            case.guarantor_id,
            market.id,
            "Приглашение к согласованию условий события",
        )
        db.add(
            EventRevisionV3(
                market_id=market.id,
                revision=config.revision,
                actor_id=user.id,
                kind="invite",
                snapshot=config.terms,
            )
        )
        db.commit()
        return True
    if action == "message" and not party:
        raise HTTPException(
            403,
            "Переговоры доступны только создателю и гаранту; используйте обсуждение события",
        )
    if action == "accept":
        reward = config.reward or {}
        if (
            Decimal(reward.get("fixed_ton", "0")) > 0
            or Decimal(reward.get("percent", "0")) > 0
        ):
            raise HTTPException(
                409,
                "Выплаты гаранту ещё не подключены. Платное событие нельзя открыть с неподдерживаемым вознаграждением",
            )
        if reward and set(reward.get("accepted_by", [])) != {
            market.creator_id,
            case.guarantor_id,
        }:
            raise HTTPException(
                409,
                "Оба участника должны подтвердить последнюю редакцию вознаграждения",
            )
    if action != "propose":
        return False
    if user.id != case.guarantor_id:
        raise HTTPException(403, "Окончательное решение принимает назначенный гарант")
    if req.revision != case.revision:
        raise HTTPException(409, "Редакция изменилась. Обновите условия")
    profile = (
        db.query(GuarantorProfile)
        .filter_by(user_id=user.id)
        .with_for_update()
        .populate_existing()
        .first()
    )
    if not profile or profile.status != "approved":
        raise HTTPException(403, "Статус гаранта приостановлен")
    current = gs.now()
    if case.state != "active" or market.status in (
        MarketStatus.cancelled,
        MarketStatus.resolved,
    ):
        raise HTTPException(409, "Решение уже принято или событие отменено")
    if current < config.ends_at or current >= config.ends_at + timedelta(hours=24):
        raise HTTPException(
            409, "Решение доступно после окончания события и в течение 24 часов"
        )
    if req.outcome not in (0, 1) or not req.text.strip():
        raise HTTPException(422, "Выберите исход и укажите основание решения")
    case.state, case.proposed_outcome = "settled", req.outcome
    case.decision_reason, case.deadline = req.text.strip(), None
    gs.log(db, case, user.id, "final_decision", req.text.strip())
    db.add(
        EventRevisionV3(
            market_id=market.id,
            revision=config.revision,
            actor_id=user.id,
            kind="guarantor_decision",
            snapshot={"outcome": req.outcome, "reason": req.text.strip()},
        )
    )
    gs.broadcast(
        db, market, case, "Гарант принял окончательное решение. Событие рассчитано"
    )
    p2p.settle(db, market, req.outcome)
    return True
