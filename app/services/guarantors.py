"""Private-event governance. All case transitions serialize on the existing market lock.

No matching or payout math here. Frozen terms, append-only evidence, delayed resolution.
"""

import json
from datetime import timedelta
from fastapi import HTTPException
from sqlalchemy import or_
from app.models import (
    User,
    Market,
    MarketStatus,
    P2POrder,
    GuarantorProfile,
    GuarantorCase,
    GuarantorMessage,
    GuarantorReview,
    PrivateTermsConsent,
    AppNotification,
)
from app.services import market_service as ms


def now():
    return ms._naive_utc(ms.utcnow())


def fail(detail, status=409):
    raise HTTPException(status, detail)


def notice(db, uid, mid, text):
    db.add(AppNotification(user_id=uid, market_id=mid, text=text))


def log(db, case, uid, kind, text):
    db.add(
        GuarantorMessage(
            market_id=case.market_id,
            user_id=uid,
            kind=kind,
            text=text,
            revision=case.revision,
        )
    )


def recipients(db, market, case):
    return {market.creator_id, case.guarantor_id} | {
        r[0] for r in db.query(P2POrder.user_id).filter_by(market_id=market.id).all()
    }


def broadcast(db, market, case, text):
    audience = recipients(db, market, case)
    if case.state == "disputed":
        audience |= {u.id for u in db.query(User).all() if u.is_admin}
    for uid in audience:
        notice(db, uid, market.id, text)


def participant(db, mid, uid):
    return (
        db.query(P2POrder)
        .filter_by(market_id=mid, user_id=uid)
        .filter(P2POrder.filled > 0)
        .first()
        is not None
    )


def available(db, uid, creator_id):
    profile = (
        db.query(GuarantorProfile)
        .filter_by(user_id=uid)
        .with_for_update()
        .populate_existing()
        .first()
    )
    if uid == creator_id:
        fail("Создатель не может быть гарантом своего пари", 422)
    if (
        not profile
        or profile.status != "approved"
        or not profile.available_until
        or profile.available_until <= now()
        or not profile.last_seen_at
        or profile.last_seen_at <= now() - timedelta(seconds=90)
    ):
        fail("Гарант сейчас не принимает новые пари")
    return profile


def snapshot(market, case):
    return json.dumps(
        dict(
            question=market.question,
            outcomes=market.outcomes,
            description=market.description,
            close_at=market.close_at.isoformat(),
            criteria=case.criteria,
            source=case.source,
            result_due_at=case.result_due_at.isoformat(),
        ),
        ensure_ascii=False,
    )


def create_case(db, market, req):
    if (
        not req.guarantor_id
        or not req.resolution_criteria
        or not req.resolution_source
        or not req.result_due_at
    ):
        fail(
            "Выберите гаранта, укажите условия, подтверждение результата и срок проверки",
            422,
        )
    available(db, req.guarantor_id, market.creator_id)
    due = ms._naive_utc(req.result_due_at)
    if due <= market.close_at:
        fail("Срок проверки должен быть позже конца приёма ставок", 422)
    case = GuarantorCase(
        market_id=market.id,
        guarantor_id=req.guarantor_id,
        criteria=req.resolution_criteria.strip(),
        source=req.resolution_source.strip(),
        result_due_at=due,
        state="invited",
        revision=1,
        creator_confirmed=1,
        deadline=now() + timedelta(minutes=1),
    )
    if not case.criteria or not case.source:
        fail("Укажите условия и подтверждение результата", 422)
    db.add(case)
    log(db, case, market.creator_id, "terms", snapshot(market, case))
    notice(
        db,
        case.guarantor_id,
        market.id,
        "Новое частное пари: откликнитесь в течение минуты",
    )


def expire(db, market, case):
    if case.deadline and case.deadline <= now() and case.state in ("invited", "review"):
        case.state = "needs_guarantor"
        case.extension_by = None
        broadcast(
            db,
            market,
            case,
            "Время согласования истекло. Создатель может выбрать гаранта заново",
        )
    if case.state == "active" and case.result_due_at <= now():
        case.state = "disputed"
        market.status = MarketStatus.closed
        from app.services.p2p_service import cancel_all

        cancel_all(db, market)
        broadcast(
            db, market, case, "Срок проверки истёк. Решение передано администратору"
        )


def trading_guard(db, market, uid, *, consent=False):
    case = db.get(GuarantorCase, market.id)
    if not case:
        return  # Existing private markets keep their existing admin resolution.
    if case.guarantor_id == uid:
        fail("Гарант не может делать ставки в этом пари", 403)
    if case.state != "active" or case.result_due_at <= now():
        fail("Ставки в этом пари пока недоступны")
    accepted = db.get(PrivateTermsConsent, (market.id, uid))
    if consent and (not accepted or accepted.revision != case.revision):
        fail("Сначала ознакомьтесь с условиями и подтвердите выбор гаранта", 403)


def case_view(db, market, case, user):
    messages = (
        db.query(GuarantorMessage)
        .filter_by(market_id=market.id)
        .order_by(GuarantorMessage.id)
        .all()
    )
    guarantor = db.get(User, case.guarantor_id)
    accepted = db.get(PrivateTermsConsent, (market.id, user.id))
    return dict(
        market_id=market.id,
        question=market.question,
        state=case.state,
        revision=case.revision,
        creator_id=market.creator_id,
        guarantor_id=case.guarantor_id,
        guarantor_name=guarantor.display_name
        or guarantor.telegram_username
        or "Гарант",
        creator_confirmed=case.creator_confirmed,
        criteria=case.criteria,
        source=case.source,
        description=market.description,
        outcomes=market.outcomes,
        close_at=market.close_at,
        result_due_at=case.result_due_at,
        deadline=case.deadline,
        extension_by=case.extension_by,
        proposed_outcome=case.proposed_outcome,
        decision_reason=case.decision_reason,
        consent=bool(accepted and accepted.revision == case.revision),
        participant=participant(db, market.id, user.id),
        messages=[
            dict(
                id=m.id,
                user_id=m.user_id,
                kind=m.kind,
                text=m.text,
                revision=m.revision,
                created_at=m.created_at,
            )
            for m in messages
        ],
    )


def transition(db, mid, user, req, token=None):
    from app.services.market_access import require_unlisted_access
    from app.services import p2p_service

    try:
        market = ms._lock_market(db, mid)
        case = (
            db.query(GuarantorCase).filter_by(market_id=mid).populate_existing().first()
        )
        if not case:
            fail("Для этого пари гарант не назначен", 404)
        require_unlisted_access(market, viewer=user, share_token=token)
        expire(db, market, case)
        action = req.action
        if (
            market.status in (MarketStatus.cancelled, MarketStatus.resolved)
            and action != "review"
        ):
            fail("Пари уже завершено")
        creator = user.id == market.creator_id
        guarantor = user.id == case.guarantor_id
        is_participant = participant(db, mid, user.id)
        current = now()
        if (
            action in ("acknowledge", "decline", "accept", "propose", "escalate")
            and not guarantor
        ):
            fail("Действие доступно назначенному гаранту", 403)
        if action in ("edit", "confirm", "invite") and not creator:
            fail("Действие доступно создателю", 403)
        if action in ("admin_resolve", "admin_cancel") and not user.is_admin:
            fail("Действие доступно администратору", 403)
        if action == "acknowledge":
            if case.state != "invited":
                fail("Приглашение уже недоступно")
            case.state = "review"
            case.deadline = current + timedelta(minutes=5)
            notice(
                db,
                market.creator_id,
                mid,
                "Гарант знакомится с условиями. На обсуждение — пять минут",
            )
        elif action == "invite":
            if case.state != "needs_guarantor":
                fail("Сначала дождитесь ответа или завершения приглашения")
            available(db, req.guarantor_id, user.id)
            case.guarantor_id = req.guarantor_id
            case.state = "invited"
            case.deadline = current + timedelta(minutes=1)
            case.creator_confirmed = case.revision
            notice(
                db,
                case.guarantor_id,
                mid,
                "Новое частное пари: откликнитесь в течение минуты",
            )
        elif action == "decline":
            if case.state not in ("invited", "review"):
                fail("Приглашение уже недоступно")
            case.state = "needs_guarantor"
            case.extension_by = None
            notice(
                db, market.creator_id, mid, "Гарант отклонил запрос. Выберите другого"
            )
        elif action == "message":
            if not (creator or guarantor or is_participant or user.is_admin):
                fail("Обсуждение доступно участникам пари", 403)
            if case.state in ("settled", "cancelled"):
                fail("Обсуждение завершено")
            if not req.text.strip():
                fail("Введите сообщение", 422)
            recent = (
                db.query(GuarantorMessage)
                .filter_by(market_id=mid, user_id=user.id, kind="message")
                .filter(GuarantorMessage.created_at >= current - timedelta(minutes=1))
                .count()
            )
            if recent >= 10:
                fail("Слишком много сообщений. Подождите минуту", 429)
            log(db, case, user.id, "message", req.text.strip())
            for uid in recipients(db, market, case) - {user.id}:
                notice(db, uid, mid, "Новое сообщение в частном пари")
        elif action == "edit":
            if case.state != "review":
                fail("Условия можно менять только во время согласования")
            if req.revision != case.revision:
                fail("Условия изменились. Обновите страницу")
            if not req.criteria.strip() or not req.source.strip():
                fail("Заполните условия и подтверждение результата", 422)
            if req.question is not None:
                if not 8 <= len(req.question.strip()) <= 512:
                    fail("Вопрос: от 8 до 512 символов", 422)
                market.question = req.question.strip()
            if req.outcomes is not None:
                market.outcomes = ms._normalize_outcomes(req.outcomes)
                if len(market.outcomes) != 2:
                    fail("Укажите два разных исхода", 422)
            case.criteria, case.source = req.criteria.strip(), req.source.strip()
            if req.result_due_at:
                case.result_due_at = ms._naive_utc(req.result_due_at)
            if req.close_at:
                market.close_at = ms._naive_utc(req.close_at)
            if market.close_at <= current or case.result_due_at <= market.close_at:
                fail("Проверьте сроки приёма и проверки", 422)
            case.revision += 1
            case.creator_confirmed = 0
            log(db, case, user.id, "terms", snapshot(market, case))
            notice(db, case.guarantor_id, mid, "Создатель обновил условия пари")
        elif action == "confirm":
            if case.state != "review" or req.revision != case.revision:
                fail("Обновите условия перед подтверждением")
            case.creator_confirmed = case.revision
        elif action == "extend":
            if not (creator or guarantor):
                fail("Продление доступно создателю и гаранту", 403)
            if case.state != "review":
                fail("Обсуждение уже завершено")
            if case.extension_by and case.extension_by != user.id:
                case.deadline = current + timedelta(minutes=5)
                case.extension_by = None
                broadcast(
                    db,
                    market,
                    case,
                    "Оба участника продлили согласование на пять минут",
                )
            elif not case.extension_by:
                case.extension_by = user.id
                notice(
                    db,
                    case.guarantor_id if creator else market.creator_id,
                    mid,
                    "Запрошено продление обсуждения на пять минут",
                )
        elif action == "accept":
            profile = (
                db.query(GuarantorProfile)
                .filter_by(user_id=user.id)
                .with_for_update()
                .populate_existing()
                .first()
            )
            if not profile or profile.status != "approved":
                fail("Статус гаранта приостановлен", 403)
            if (
                case.state != "review"
                or req.revision != case.revision
                or case.creator_confirmed != case.revision
            ):
                fail("Нужна одна версия условий, подтверждённая создателем и гарантом")
            if market.close_at <= current:
                fail("Конец приёма ставок уже наступил")
            case.state, case.deadline = "active", None
            market.status = MarketStatus.open
            broadcast(db, market, case, "Условия согласованы. Пари открыто для ставок")
        elif action == "consent":
            if case.state != "active" or req.revision != case.revision:
                fail("Обновите условия перед подтверждением")
            if guarantor:
                fail("Гарант не может участвовать в ставках", 403)
            row = db.get(PrivateTermsConsent, (mid, user.id))
            if row:
                row.revision = case.revision
            else:
                db.add(
                    PrivateTermsConsent(
                        market_id=mid, user_id=user.id, revision=case.revision
                    )
                )
        elif action == "propose":
            profile = (
                db.query(GuarantorProfile)
                .filter_by(user_id=user.id)
                .with_for_update()
                .populate_existing()
                .first()
            )
            if not profile or profile.status != "approved":
                fail("Статус гаранта приостановлен", 403)
            if case.state != "active":
                fail("Пари уже ожидает другого решения")
            if market.close_at > current and market.status != MarketStatus.closed:
                fail("Дождитесь конца приёма ставок")
            if req.outcome not in (0, 1) or not req.text.strip():
                fail("Выберите исход и обоснуйте решение", 422)
            market.status = MarketStatus.closed
            p2p_service.cancel_all(db, market)
            case.state, case.proposed_outcome = "proposed", req.outcome
            case.decision_reason = req.text.strip()
            case.deadline = current + timedelta(hours=24)
            broadcast(
                db,
                market,
                case,
                "Гарант предложил результат. До выплаты есть 24 часа на возражение",
            )
        elif action == "escalate":
            if case.state != "active" or not req.text.strip():
                fail("Укажите причину передачи администратору", 422)
            case.state = "disputed"
            market.status = MarketStatus.closed
            p2p_service.cancel_all(db, market)
            broadcast(
                db,
                market,
                case,
                "Гарант не может определить результат. Решение передано администратору",
            )
        elif action == "dispute":
            if not is_participant:
                fail("Возражение доступно участникам исполненных ставок", 403)
            if case.state != "proposed" or case.deadline <= current:
                fail("Срок возражений завершён")
            if not req.text.strip():
                fail("Объясните причину возражения", 422)
            case.state = "disputed"
            broadcast(
                db,
                market,
                case,
                "Есть возражение. Выплата приостановлена до решения администратора",
            )
        elif action in ("admin_resolve", "admin_cancel"):
            if user.id in (market.creator_id, case.guarantor_id) or is_participant:
                fail(
                    "Для решения нужен администратор, который не участвует в этом пари",
                    403,
                )
            if case.state != "disputed":
                fail("Администратор рассматривает только переданные ему споры")
            if not req.text.strip():
                fail("Укажите обоснование решения", 422)
            log(db, case, user.id, action, req.text.strip())
            if action == "admin_cancel":
                case.state = "cancelled"
                broadcast(
                    db,
                    market,
                    case,
                    "Пари отменено администратором. Средства возвращены",
                )
                db.flush()
                p2p_service.void_market(db, mid, user.id, req.text[:1000])
            else:
                if req.outcome not in (0, 1):
                    fail("Выберите исход", 422)
                case.state, case.proposed_outcome = "settled", req.outcome
                case.decision_reason = req.text.strip()
                broadcast(db, market, case, "Спор рассмотрен. Выплаты начислены")
                p2p_service.settle(db, market, req.outcome)
            return case_view(db, market, case, user)
        elif action == "review":
            if not is_participant or guarantor:
                fail("Отзыв доступен участникам исполненных ставок", 403)
            if case.state != "settled":
                fail("Отзыв доступен после расчёта")
            if req.rating not in (1, 2, 3, 4, 5):
                fail("Оценка: от 1 до 5", 422)
            if (
                db.query(GuarantorReview)
                .filter_by(market_id=mid, user_id=user.id)
                .first()
            ):
                fail("Вы уже оставили отзыв")
            db.add(
                GuarantorReview(
                    market_id=mid,
                    user_id=user.id,
                    guarantor_id=case.guarantor_id,
                    rating=req.rating,
                    text=req.text[:1000],
                )
            )
        else:
            fail("Неизвестное действие", 422)
        if action not in ("message", "edit", "consent", "review"):
            labels = {
                "acknowledge": "Гарант начал ознакомление",
                "invite": "Отправлено новое приглашение гаранту",
                "decline": "Гарант отказался от пари",
                "confirm": "Создатель подтвердил условия",
                "extend": "Обсуждение продления срока",
                "accept": "Гарант принял условия. Ставки открыты",
            }
            log(
                db,
                case,
                user.id,
                action,
                req.text.strip() or labels.get(action, action),
            )
        db.commit()
        return case_view(db, market, case, user)
    except Exception:
        db.rollback()
        raise


def process_due():
    from app.database import SessionLocal
    from app.services import p2p_service

    with SessionLocal() as db:
        ids = [
            r[0]
            for r in db.query(GuarantorCase.market_id)
            .filter(
                or_(
                    (GuarantorCase.state.in_(["invited", "review", "proposed"]))
                    & (GuarantorCase.deadline <= now()),
                    (GuarantorCase.state == "active")
                    & (GuarantorCase.result_due_at <= now()),
                )
            )
            .order_by(GuarantorCase.market_id)
            .limit(100)
            .all()
        ]
    for mid in ids:
        with SessionLocal() as db:
            try:
                market = ms._lock_market(db, mid)
                case = (
                    db.query(GuarantorCase)
                    .filter_by(market_id=mid)
                    .populate_existing()
                    .one()
                )
                expire(db, market, case)
                if case.state == "proposed" and case.deadline <= now():
                    profile = (
                        db.query(GuarantorProfile)
                        .filter_by(user_id=case.guarantor_id)
                        .with_for_update()
                        .populate_existing()
                        .first()
                    )
                    if not profile or profile.status != "approved":
                        case.state = "disputed"
                        broadcast(
                            db,
                            market,
                            case,
                            "Статус гаранта изменился. Решение передано администратору",
                        )
                    else:
                        case.state = "settled"
                        broadcast(
                            db,
                            market,
                            case,
                            "Пари рассчитано. Выплаты начислены автоматически",
                        )
                        p2p_service.settle(db, market, case.proposed_outcome)
                db.commit()
            except Exception as exc:
                db.rollback()
                import logging

                logging.getLogger(__name__).exception(
                    "Guarantor workflow failed for market %s", mid
                )
                # Inconsistent escrow needs human attention, not an expired
                # proposal which nobody can dispute or administer anymore.
                if isinstance(exc, HTTPException) and exc.status_code == 409:
                    try:
                        market = ms._lock_market(db, mid)
                        case = (
                            db.query(GuarantorCase)
                            .filter_by(market_id=mid)
                            .populate_existing()
                            .one()
                        )
                        if (
                            case.state == "proposed"
                            and market.status == MarketStatus.closed
                        ):
                            case.state = "disputed"
                            log(
                                db,
                                case,
                                case.guarantor_id,
                                "settlement_error",
                                "Автоматическая выплата остановлена: необходима проверка учёта администратором",
                            )
                            broadcast(
                                db,
                                market,
                                case,
                                "Выплата остановлена для проверки учёта. Средства не списаны",
                            )
                        db.commit()
                    except Exception:
                        db.rollback()
                        logging.getLogger(__name__).exception(
                            "Could not escalate settlement for %s", mid
                        )
