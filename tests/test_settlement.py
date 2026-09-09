from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.database import SessionLocal
from app.models import Market, MarketStatus, Position, SettlementRecord, User
from app.services import market_service
from tests.auth_helpers import tma_headers


def _close_at(hours=2):
    return (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()


def _login(client: TestClient, telegram_id: int | None = None):
    telegram_id = telegram_id or (int(uuid.uuid4().int % 1_000_000_000) + 1)
    headers = tma_headers(telegram_id)
    res = client.post("/auth/telegram", headers=headers)
    assert res.status_code == 200, res.text
    return res.json(), headers


def _admin(client, monkeypatch):
    telegram_id = int(uuid.uuid4().int % 1_000_000_000) + 40_000_000
    monkeypatch.setattr(settings, "admin_telegram_id", telegram_id)
    return _login(client, telegram_id)


def _balances(db=None):
    own = db is None
    if own:
        db = SessionLocal()
    try:
        users = {u.id: float(u.balance) for u in db.query(User).all()}
        pot = sum(float(m.pot or 0.0) for m in db.query(Market).all())
        return users, pot, sum(users.values()) + pot
    finally:
        if own:
            db.close()


def test_auto_settle_pays_winners_without_claim(client: TestClient, monkeypatch):
    admin, admin_h = _admin(client, monkeypatch)
    creator, creator_h = _login(client)
    winner, winner_h = _login(client)
    loser, loser_h = _login(client)
    created = client.post(
        "/markets",
        headers=creator_h,
        json={
            "question": "Автоматический расчёт зачисляет всем?",
            "outcomes": ["Да", "Нет"],
            "lock_ton": 50,
            "close_at": _close_at(),
        },
    )
    mid = created.json()["id"]
    client.post(f"/markets/{mid}/buy", headers=winner_h, json={"outcome": 0, "money": 25})
    client.post(f"/markets/{mid}/buy", headers=loser_h, json={"outcome": 1, "money": 15})
    client.post(f"/markets/{mid}/close", headers=admin_h, json={})
    before_w = client.get(f"/users/{winner['id']}", headers=winner_h).json()["balance"]
    before_l = client.get(f"/users/{loser['id']}", headers=loser_h).json()["balance"]
    _, _, conserved_before = _balances()
    resolved = client.post(f"/markets/{mid}/resolve", headers=admin_h, json={"winning_outcome": 0})
    assert resolved.status_code == 200, resolved.text
    assert resolved.json()["settlement_kind"] == "auto"
    assert resolved.json()["pot"] == pytest.approx(0.0, abs=1e-8)
    after_w = client.get(f"/users/{winner['id']}", headers=winner_h).json()["balance"]
    after_l = client.get(f"/users/{loser['id']}", headers=loser_h).json()["balance"]
    assert after_w > before_w
    assert after_l == pytest.approx(before_l)
    claim = client.post(f"/markets/{mid}/claim", headers=winner_h, json={})
    assert claim.status_code == 400
    assert client.get(f"/users/{winner['id']}", headers=winner_h).json()["balance"] == pytest.approx(after_w)
    _, _, conserved_after = _balances()
    assert conserved_after == pytest.approx(conserved_before, abs=1e-6)


def test_winner_is_creator_tips_go_to_platform(client: TestClient, monkeypatch):
    admin, admin_h = _admin(client, monkeypatch)
    creator, creator_h = _login(client)
    created = client.post(
        "/markets",
        headers=creator_h,
        json={"question": "Победитель создатель отдаёт чаевые платформе?", "lock_ton": 40, "close_at": _close_at()},
    )
    mid = created.json()["id"]
    client.post(f"/markets/{mid}/buy", headers=creator_h, json={"outcome": 0, "money": 30})
    client.post(f"/markets/{mid}/close", headers=admin_h, json={})
    admin_before = client.get(f"/users/{admin['id']}", headers=admin_h).json()["balance"]
    client.post(f"/markets/{mid}/resolve", headers=admin_h, json={"winning_outcome": 0})
    hist = client.get(f"/users/{creator['id']}/settlements", headers=creator_h).json()[0]
    assert hist["tip"] >= 0
    admin_after = client.get(f"/users/{admin['id']}", headers=admin_h).json()["balance"]
    assert admin_after == pytest.approx(admin_before + hist["tip"], abs=1e-6)


def test_creator_is_admin_merges_credits(client: TestClient, monkeypatch):
    admin, admin_h = _admin(client, monkeypatch)
    user, user_h = _login(client)
    created = client.post(
        "/markets",
        headers=admin_h,
        json={"question": "Создатель и админ один счёт?", "lock_ton": 30, "close_at": _close_at()},
    )
    mid = created.json()["id"]
    client.post(f"/markets/{mid}/buy", headers=user_h, json={"outcome": 0, "money": 20})
    client.post(f"/markets/{mid}/close", headers=admin_h, json={})
    before = client.get(f"/users/{admin['id']}", headers=admin_h).json()["balance"]
    client.post(f"/markets/{mid}/resolve", headers=admin_h, json={"winning_outcome": 0})
    hist = client.get(f"/users/{user['id']}/settlements", headers=user_h).json()[0]
    admin_hist = client.get(f"/users/{admin['id']}/settlements", headers=admin_h).json()[0]
    after = client.get(f"/users/{admin['id']}", headers=admin_h).json()["balance"]
    assert after == pytest.approx(before + hist["tip"] + admin_hist["residual_returned"], abs=1e-6)


def test_one_account_player_creator_admin(client: TestClient, monkeypatch):
    admin, admin_h = _admin(client, monkeypatch)
    created = client.post(
        "/markets",
        headers=admin_h,
        json={"question": "Один человек все роли?", "lock_ton": 40, "close_at": _close_at()},
    )
    mid = created.json()["id"]
    client.post(f"/markets/{mid}/buy", headers=admin_h, json={"outcome": 0, "money": 20})
    client.post(f"/markets/{mid}/buy", headers=admin_h, json={"outcome": 1, "money": 10})
    client.post(f"/markets/{mid}/close", headers=admin_h, json={})
    before = client.get(f"/users/{admin['id']}", headers=admin_h).json()["balance"]
    _, _, conserved_before = _balances()
    res = client.post(f"/markets/{mid}/resolve", headers=admin_h, json={"winning_outcome": 0})
    assert res.status_code == 200, res.text
    after = client.get(f"/users/{admin['id']}", headers=admin_h).json()["balance"]
    hist = client.get(f"/users/{admin['id']}/settlements", headers=admin_h).json()[0]
    assert after == pytest.approx(before + hist["credited"] + hist["tip"] + hist["residual_returned"], abs=1e-6)
    _, _, conserved_after = _balances()
    assert conserved_after == pytest.approx(conserved_before, abs=1e-6)
    assert client.post(f"/markets/{mid}/claim", headers=admin_h, json={}).status_code == 400


def test_both_outcomes_no_profit_no_tip(client: TestClient, monkeypatch):
    admin, admin_h = _admin(client, monkeypatch)
    user, user_h = _login(client)
    created = client.post(
        "/markets",
        headers=admin_h,
        json={"question": "Ставки на оба исхода без прибыли?", "lock_ton": 50, "close_at": _close_at()},
    )
    mid = created.json()["id"]
    client.post(f"/markets/{mid}/buy", headers=user_h, json={"outcome": 0, "money": 10})
    client.post(f"/markets/{mid}/buy", headers=user_h, json={"outcome": 1, "money": 80})
    client.post(f"/markets/{mid}/close", headers=admin_h, json={})
    client.post(f"/markets/{mid}/resolve", headers=admin_h, json={"winning_outcome": 0})
    hist = client.get(f"/users/{user['id']}/settlements", headers=user_h).json()[0]
    assert hist["stakes_total"] == pytest.approx(90)
    assert hist["payout"] < hist["stakes_total"]
    assert hist["tip"] == pytest.approx(0.0, abs=1e-9)
    assert hist["is_loss"] is True


def test_insufficient_pot_conflict_no_changes(client: TestClient, monkeypatch):
    admin, admin_h = _admin(client, monkeypatch)
    user, user_h = _login(client)
    created = client.post(
        "/markets",
        headers=admin_h,
        json={"question": "Нехватка банка даёт 409?", "lock_ton": 20, "close_at": _close_at()},
    )
    mid = created.json()["id"]
    client.post(f"/markets/{mid}/buy", headers=user_h, json={"outcome": 0, "money": 15})
    client.post(f"/markets/{mid}/close", headers=admin_h, json={})
    db = SessionLocal()
    market = db.get(Market, mid)
    market.pot = 0.01
    db.commit()
    db.close()
    users_before, _, total_before = _balances()
    res = client.post(f"/markets/{mid}/resolve", headers=admin_h, json={"winning_outcome": 0})
    assert res.status_code == 409
    assert "банк" in res.json()["detail"].lower() or "средств" in res.json()["detail"].lower()
    market = client.get(f"/markets/{mid}").json()
    assert market["status"] == "closed"
    users_after, _, total_after = _balances()
    for uid, bal in users_before.items():
        assert users_after[uid] == pytest.approx(bal)
    assert client.get(f"/users/{user['id']}", headers=user_h).json()["balance"] == pytest.approx(
        users_before[user["id"]]
    )
    assert total_after == pytest.approx(total_before, abs=1e-6)


def test_mid_credit_error_rolls_back(client: TestClient, monkeypatch):
    admin, admin_h = _admin(client, monkeypatch)
    user, user_h = _login(client)
    created = client.post(
        "/markets",
        headers=admin_h,
        json={"question": "Ошибка начисления откатывает всё?", "lock_ton": 30, "close_at": _close_at()},
    )
    mid = created.json()["id"]
    client.post(f"/markets/{mid}/buy", headers=user_h, json={"outcome": 0, "money": 20})
    client.post(f"/markets/{mid}/close", headers=admin_h, json={})
    users_before, _, total_before = _balances()
    real = market_service._adjust_balance
    calls = {"n": 0}

    def boom(*args, **kwargs):
        calls["n"] += 1
        if calls["n"] >= 2:
            raise RuntimeError("injected failure")
        return real(*args, **kwargs)

    monkeypatch.setattr(market_service, "_adjust_balance", boom)
    with pytest.raises(RuntimeError):
        client.post(f"/markets/{mid}/resolve", headers=admin_h, json={"winning_outcome": 0})
    users_after, _, total_after = _balances()
    assert client.get(f"/markets/{mid}").json()["status"] == "closed"
    for uid, bal in users_before.items():
        assert users_after[uid] == pytest.approx(bal)
    assert total_after == pytest.approx(total_before, abs=1e-6)


def test_repeat_and_parallel_resolve(client: TestClient, monkeypatch):
    admin, admin_h = _admin(client, monkeypatch)
    user, user_h = _login(client)
    created = client.post(
        "/markets",
        headers=admin_h,
        json={"question": "Повторный resolve не платит дважды?", "lock_ton": 40, "close_at": _close_at()},
    )
    mid = created.json()["id"]
    client.post(f"/markets/{mid}/buy", headers=user_h, json={"outcome": 0, "money": 20})
    client.post(f"/markets/{mid}/close", headers=admin_h, json={})
    first = client.post(f"/markets/{mid}/resolve", headers=admin_h, json={"winning_outcome": 0})
    assert first.status_code == 200
    bal = client.get(f"/users/{user['id']}", headers=user_h).json()["balance"]
    second = client.post(f"/markets/{mid}/resolve", headers=admin_h, json={"winning_outcome": 1})
    assert second.status_code == 400
    assert client.get(f"/markets/{mid}").json()["winning_outcome"] == "Да"
    assert client.get(f"/users/{user['id']}", headers=user_h).json()["balance"] == pytest.approx(bal)

    created2 = client.post(
        "/markets",
        headers=admin_h,
        json={"question": "Параллельный resolve?", "lock_ton": 40, "close_at": _close_at()},
    )
    mid2 = created2.json()["id"]
    client.post(f"/markets/{mid2}/buy", headers=user_h, json={"outcome": 0, "money": 18})
    client.post(f"/markets/{mid2}/close", headers=admin_h, json={})
    before = client.get(f"/users/{user['id']}", headers=user_h).json()["balance"]

    def do_resolve():
        with TestClient(client.app) as c:
            return c.post(f"/markets/{mid2}/resolve", headers=admin_h, json={"winning_outcome": 0}).status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        codes = list(pool.map(lambda _: do_resolve(), range(2)))
    assert 200 in codes
    assert codes.count(200) == 1
    after = client.get(f"/users/{user['id']}", headers=user_h).json()["balance"]
    hist = client.get(f"/users/{user['id']}/settlements", headers=user_h).json()
    row = next(x for x in hist if x["market_id"] == mid2)
    assert after == pytest.approx(before + row["credited"], abs=1e-6)


def test_parallel_buys_do_not_lose_balance(client: TestClient):
    user, headers = _login(client)
    created = client.post(
        "/markets",
        headers=headers,
        json={"question": "Параллельные ставки не теряют баланс?", "lock_ton": 20, "close_at": _close_at()},
    )
    mid = created.json()["id"]
    start = client.get(f"/users/{user['id']}", headers=headers).json()["balance"]

    def buy():
        with TestClient(client.app) as c:
            return c.post(f"/markets/{mid}/buy", headers=headers, json={"outcome": 0, "money": 10})

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = [fut.result() for fut in as_completed([pool.submit(buy), pool.submit(buy)])]
    oks = [r for r in results if r.status_code == 200]
    assert len(oks) == 2
    after = client.get(f"/users/{user['id']}", headers=headers).json()["balance"]
    assert after == pytest.approx(start - 20, abs=1e-6)


def test_legacy_claim_still_works_for_old_resolved(client: TestClient, monkeypatch):
    admin, admin_h = _admin(client, monkeypatch)
    user, user_h = _login(client)
    created = client.post(
        "/markets",
        headers=admin_h,
        json={"question": "Старый расчёт ещё можно забрать?", "lock_ton": 30, "close_at": _close_at()},
    )
    mid = created.json()["id"]
    client.post(f"/markets/{mid}/buy", headers=user_h, json={"outcome": 0, "money": 20})
    client.post(f"/markets/{mid}/close", headers=admin_h, json={})
    db = SessionLocal()
    market = db.get(Market, mid)
    pos = db.query(Position).filter(Position.market_id == mid, Position.user_id == user["id"]).one()
    market.status = MarketStatus.resolved
    market.winning_outcome = "Да"
    market.settlement_kind = None
    market.resolved_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.close()
    before = client.get(f"/users/{user['id']}", headers=user_h).json()["balance"]
    claim = client.post(f"/markets/{mid}/claim", headers=user_h, json={})
    assert claim.status_code == 200, claim.text
    assert client.get(f"/users/{user['id']}", headers=user_h).json()["balance"] > before
    again = client.post(f"/markets/{mid}/claim", headers=user_h, json={})
    assert again.status_code == 400


def test_legacy_collect_residual_keeps_unpaid_liability(client: TestClient, monkeypatch):
    admin, admin_h = _admin(client, monkeypatch)
    user, user_h = _login(client)
    created = client.post(
        "/markets",
        headers=admin_h,
        json={"question": "Остаток не забирает долг победителю?", "lock_ton": 40, "close_at": _close_at()},
    )
    mid = created.json()["id"]
    client.post(f"/markets/{mid}/buy", headers=user_h, json={"outcome": 0, "money": 20})
    client.post(f"/markets/{mid}/close", headers=admin_h, json={})
    db = SessionLocal()
    market = db.get(Market, mid)
    pos = db.query(Position).filter(Position.market_id == mid).one()
    shares = list(pos.shares or [pos.shares_yes, pos.shares_no])
    market.status = MarketStatus.resolved
    market.winning_outcome = "Да"
    market.settlement_kind = None
    market.pot = float(shares[0]) + 7.0
    db.commit()
    db.close()
    creator_before = client.get(f"/users/{admin['id']}", headers=admin_h).json()["balance"]
    user_before = client.get(f"/users/{user['id']}", headers=user_h).json()["balance"]
    res = client.post(f"/markets/{mid}/collect-residual", headers=admin_h, json={})
    assert res.status_code == 200, res.text
    assert res.json()["returned"] == pytest.approx(7.0, abs=1e-6)
    assert client.get(f"/users/{admin['id']}", headers=admin_h).json()["balance"] == pytest.approx(creator_before + 7)
    assert client.get(f"/users/{user['id']}", headers=user_h).json()["balance"] == pytest.approx(user_before)
    claim = client.post(f"/markets/{mid}/claim", headers=user_h, json={})
    assert claim.status_code == 200


def test_history_survives_new_db_session(client: TestClient, monkeypatch):
    admin, admin_h = _admin(client, monkeypatch)
    user, user_h = _login(client)
    created = client.post(
        "/markets",
        headers=admin_h,
        json={"question": "История живёт после новой сессии?", "lock_ton": 25, "close_at": _close_at()},
    )
    mid = created.json()["id"]
    client.post(f"/markets/{mid}/buy", headers=user_h, json={"outcome": 0, "money": 12})
    client.post(f"/markets/{mid}/close", headers=admin_h, json={})
    client.post(f"/markets/{mid}/resolve", headers=admin_h, json={"winning_outcome": 0})
    Session = sessionmaker(bind=SessionLocal().get_bind())
    db = Session()
    row = db.query(SettlementRecord).filter(SettlementRecord.market_id == mid, SettlementRecord.user_id == user["id"]).one()
    payout = row.payout
    db.close()
    db2 = SessionLocal()
    again = db2.query(SettlementRecord).filter(SettlementRecord.market_id == mid, SettlementRecord.user_id == user["id"]).one()
    assert again.payout == pytest.approx(payout)
    db2.close()
    api = client.get(f"/users/{user['id']}/settlements", headers=user_h).json()
    assert api[0]["payout"] == pytest.approx(payout)


def test_stranger_cannot_read_settlements(client: TestClient, monkeypatch):
    admin, admin_h = _admin(client, monkeypatch)
    user, user_h = _login(client)
    other, other_h = _login(client)
    created = client.post(
        "/markets",
        headers=admin_h,
        json={"question": "Чужая история закрыта?", "lock_ton": 20, "close_at": _close_at()},
    )
    mid = created.json()["id"]
    client.post(f"/markets/{mid}/buy", headers=user_h, json={"outcome": 0, "money": 10})
    client.post(f"/markets/{mid}/close", headers=admin_h, json={})
    client.post(f"/markets/{mid}/resolve", headers=admin_h, json={"winning_outcome": 0})
    forbidden = client.get(f"/users/{user['id']}/settlements", headers=other_h)
    assert forbidden.status_code == 403


def test_named_numeric_outcomes_use_name_not_index(client: TestClient, monkeypatch):
    admin, admin_h = _admin(client, monkeypatch)
    user, user_h = _login(client)
    created = client.post(
        "/markets",
        headers=admin_h,
        json={
            "question": "Исходы один и два без путаницы индекса?",
            "outcomes": ["1", "2"],
            "lock_ton": 30,
            "close_at": _close_at(),
        },
    )
    mid = created.json()["id"]
    client.post(f"/markets/{mid}/buy", headers=user_h, json={"outcome": "1", "money": 15})
    client.post(f"/markets/{mid}/close", headers=admin_h, json={})
    res = client.post(f"/markets/{mid}/resolve", headers=admin_h, json={"winning_outcome": "1"})
    assert res.status_code == 200, res.text
    assert res.json()["winning_outcome"] == "1"
    hist = client.get(f"/users/{user['id']}/settlements", headers=user_h).json()[0]
    assert hist["winning_outcome"] == "1"
    assert hist["payout"] > 0


def test_open_market_cannot_resolve(client: TestClient, monkeypatch):
    admin, admin_h = _admin(client, monkeypatch)
    created = client.post(
        "/markets",
        headers=admin_h,
        json={"question": "Пока приём открыт считать нельзя?", "lock_ton": 20, "close_at": _close_at()},
    )
    mid = created.json()["id"]
    res = client.post(f"/markets/{mid}/resolve", headers=admin_h, json={"winning_outcome": 0})
    assert res.status_code == 400
    assert "приём" in res.json()["detail"].lower()
