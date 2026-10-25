"""Versioned reward funding. Call state-changing helpers with market row locked."""

from fastapi import HTTPException

from app.config import settings
from app.models import EventRevisionV3, MarketStatus, P2PFill
from app.services.guarantor_rewards import RewardTariff, funded_outcomes


def enabled(config):
    return bool(
        config
        and config.event_type == "guarantor"
        and config.terms.get("_reward_engine") == 1
    )


def require_agreement(market, config, case):
    reward = config.reward or {}
    if (
        not case
        or reward.get("agreed_revision") != case.revision
        or config.revision != case.revision
        or set(reward.get("accepted_by", [])) != {market.creator_id, case.guarantor_id}
        or case.creator_confirmed != case.revision
    ):
        raise HTTPException(
            409,
            "Нет одной редакции вознаграждения, подтверждённой создателем и текущим гарантом",
        )


def plans(db, market, config):
    try:
        reward = config.reward or {}
        fills = (
            db.query(P2PFill).filter_by(market_id=market.id).order_by(P2PFill.id).all()
        )
        pot = (
            sum(f.maker_stake + f.taker_stake for f in fills)
            if market.status == MarketStatus.resolved and market.pot_nano == 0
            else market.pot_nano
        )
        return funded_outcomes(
            fills,
            RewardTariff.from_terms(reward),
            pot,
            reward.get("minimum_keep_bps", settings.guarantor_minimum_profit_bps),
        )
    except ValueError as exc:
        raise HTTPException(409, str(exc)) from exc


def begin_collection(db, market, config, case):
    from app.services import guarantors as gs

    if market.close_at <= gs.now() or config.ends_at <= gs.now():
        raise HTTPException(409, "Срок формирования фонда уже истёк")
    reward = config.reward or {"mode": "fixed", "fixed_ton": "0", "percent": "0"}
    RewardTariff.from_terms(reward)
    config.reward = {
        **reward,
        "accepted_by": sorted({market.creator_id, case.guarantor_id}),
        "agreed_revision": case.revision,
        "minimum_keep_bps": settings.guarantor_minimum_profit_bps,
    }
    case.state, case.deadline = "collecting", market.close_at
    market.status = MarketStatus.open
    db.add(
        EventRevisionV3(
            market_id=market.id,
            revision=config.revision,
            actor_id=case.guarantor_id,
            kind="funding_started",
            snapshot={**config.reward, "close_at": market.close_at.isoformat()},
        )
    )


def after_fills(db, market, config, case):
    if not enabled(config) or case.state not in ("collecting", "active"):
        return
    require_agreement(market, config, case)
    choices = plans(db, market, config)
    if case.state == "active" and not all(choices):
        raise HTTPException(
            409,
            "Эта сделка нарушит обеспечение вознаграждения или минимальную прибыль победителей. Средства не списаны",
        )
    if case.state == "collecting" and all(choices):
        from app.services import guarantors as gs

        if gs.now() >= min(market.close_at, config.ends_at):
            raise HTTPException(
                409, "Нельзя активировать событие после окончания формирования фонда"
            )
        case.state, case.deadline = "active", None
        db.add(
            EventRevisionV3(
                market_id=market.id,
                revision=config.revision,
                actor_id=None,
                kind="funding_secured",
                snapshot={
                    "at": gs.now().isoformat(),
                    "profit_nano": [str(p.profit_nano) for p in choices],
                },
            )
        )
        gs.broadcast(
            db,
            market,
            case,
            "Фонд сформирован. Вознаграждение обеспечено при обоих исходах",
        )


def deductions(db, market, config, case, outcome):
    if not enabled(config):
        return {}, 0
    require_agreement(market, config, case)
    choices = plans(db, market, config)
    if case.state not in ("active", "settled") or not all(choices):
        raise HTTPException(409, "Событие не обеспечено для окончательного расчёта")
    selected = choices[outcome]
    charges = {w.user_id: w.guarantor_reward_nano for w in selected.winners}
    if case.guarantor_id in charges:
        raise HTTPException(409, "Гарант не может участвовать в ставках этого события")
    return charges, selected.reward_nano


def quote_costs(db, market, config, case, user_id, outcome, match_plan):
    """Pure projection, never fake fills in DB. Prices/order stay unchanged."""
    from types import SimpleNamespace
    from app.services.p2p_ledger import _match_rows

    require_agreement(market, config, case)
    existing = (
        db.query(P2PFill).filter_by(market_id=market.id).order_by(P2PFill.id).all()
    )
    projected = list(existing)
    bank = market.pot_nano
    tariff = RewardTariff.from_terms(config.reward or {})
    keep = (config.reward or {}).get(
        "minimum_keep_bps", settings.guarantor_minimum_profit_bps
    )
    # Also check actual bank before considering any projected stake.
    choices = funded_outcomes(projected, tariff, bank, keep)
    active = case.state == "active"
    can_place = not active or all(choices)
    for maker, maker_stake, taker_stake in match_plan:
        projected.append(
            SimpleNamespace(
                maker_user_id=maker.user_id,
                taker_user_id=user_id,
                maker_outcome=maker.outcome,
                maker_stake=maker_stake,
                taker_stake=taker_stake,
            )
        )
        bank += maker_stake + taker_stake
        choices = funded_outcomes(projected, tariff, bank, keep)
        if active and not all(choices):
            can_place = False
        if all(choices):
            active = True
    matched = sum(taker for _, _, taker in match_plan)
    gross = sum(maker + taker for _, maker, taker in match_plan)
    selected = choices[outcome]
    row = _match_rows(projected, outcome).get(user_id, {"payout": 0, "cost": 0})
    fee = max(0, row["payout"] - row["cost"]) // 100
    charge = (
        next(
            (w.guarantor_reward_nano for w in selected.winners if w.user_id == user_id),
            0,
        )
        if selected
        else None
    )
    return {
        "preliminary": True,
        "scope": "event_positions",
        "matched_nano": str(matched),
        "gross_new_payout_nano": str(gross),
        "event_payout_after_fees_nano": str(row["payout"] - fee - charge)
        if selected and matched
        else None,
        "service_fee_nano": str(fee) if selected and matched else None,
        "guarantor_reward_nano": str(charge) if selected and matched else None,
        "secured_for_both_outcomes": all(choices),
        "can_place": can_place,
        "reason": None
        if selected and matched
        else "Нет исполнимой части"
        if not matched
        else "Фонд ещё не обеспечивает вознаграждение при обоих исходах",
    }


def view(db, market, config, viewer_id):
    choices = (
        (None, None)
        if market.status == MarketStatus.cancelled
        else plans(db, market, config)
    )
    reward = config.reward or {}
    winning = (
        market.outcomes.index(market.winning_outcome)
        if market.status == MarketStatus.resolved
        and market.winning_outcome in market.outcomes
        else None
    )
    return {
        "secured": all(choices),
        "minimum_keep_bps": reward.get(
            "minimum_keep_bps", settings.guarantor_minimum_profit_bps
        ),
        "preliminary": market.status
        not in (MarketStatus.resolved, MarketStatus.cancelled),
        "outcomes": [
            {
                "outcome": side,
                "secured": p is not None,
                "profit_nano": str(p.profit_nano) if p else None,
                "reward_nano": str(p.reward_nano) if p else None,
                "service_fee_nano": str(p.service_fee_nano) if p else None,
                "viewer_net_profit_nano": str(
                    next(
                        (
                            w.net_profit_nano
                            for w in p.winners
                            if w.user_id == viewer_id
                        ),
                        0,
                    )
                )
                if p
                else None,
                "reason": None
                if p
                else "Ожидаем достаточного объёма заключённых ставок",
            }
            for side, p in enumerate(choices)
            if winning is None or side == winning
        ],
    }
