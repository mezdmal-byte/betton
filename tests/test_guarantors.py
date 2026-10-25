from datetime import timedelta
import pytest
from app.database import SessionLocal
from app.models import Market, GuarantorCase, GuarantorProfile, User, SettlementRecord
from app.services import guarantors as gs
from tests.test_markets_api import _admin, _login, _close_at
from tests.test_p2p import submit


def call(client, mid, headers, action, **fields):
    return client.post(
        f"/markets/{mid}/guarantor", headers=headers, json={"action": action, **fields}
    )


def setup_case(client, monkeypatch):
    admin, ah = _admin(client, monkeypatch)
    creator, ch = _login(client)
    guarantor, gh = _login(client)
    bettor, bh = _login(client)
    assert (
        client.put(
            "/guarantors/me",
            headers=gh,
            json={
                "bio": "Проверяю результаты по официальным записям",
                "topics": "Любые проверяемые события",
                "accept_rules": True,
            },
        ).status_code
        == 200
    )
    assert (
        client.post(
            f"/guarantors/{guarantor['id']}/approval",
            headers=ah,
            json={"approved": True},
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/guarantors/me/availability", headers=gh, json={"available": True}
        ).status_code
        == 200
    )
    r = client.post(
        "/markets",
        headers=ch,
        json={
            "question": "Закончится ли проверяемое событие?",
            "close_at": _close_at(),
            "visibility": "unlisted",
            "guarantor_id": guarantor["id"],
            "resolution_criteria": "Победитель по записи матча. Ничья — отмена.",
            "resolution_source": "Запись и официальная страница",
            "result_due_at": _close_at(24),
        },
    )
    assert r.status_code == 200, r.text
    m = r.json()
    bh = {**bh, "X-Market-Share-Token": m["share_token"]}
    return admin, ah, creator, ch, guarantor, gh, bettor, bh, m


def open_case(client, ch, gh, mid):
    assert call(client, mid, gh, "acknowledge").status_code == 200
    r = call(client, mid, gh, "accept", revision=1)
    assert r.status_code == 200, r.text
    assert r.json()["state"] == "active"
    assert call(client, mid, ch, "consent", revision=1).status_code == 200


def test_terms_review_permissions_and_no_creation_money(client, monkeypatch):
    admin, ah, creator, ch, g, gh, b, bh, m = setup_case(client, monkeypatch)
    mid = m["id"]
    assert m["status"] == "closed" and m["pot"] == 0 and m["lock_ton"] == 0
    assert client.get(f"/users/{creator['id']}", headers=ch).json()["balance"] == 1000
    assert client.get(f"/markets/{mid}", headers=gh).status_code == 200
    assert submit(client, mid, ch).status_code == 400
    assert call(client, mid, ch, "acknowledge").status_code == 403
    assert call(client, mid, gh, "acknowledge").json()["state"] == "review"
    assert (
        call(
            client,
            mid,
            ch,
            "edit",
            revision=1,
            criteria="Играть с видеозаписью",
            source="Запись обоих игроков",
        ).json()["revision"]
        == 2
    )
    assert call(client, mid, gh, "accept", revision=1).status_code == 409
    assert call(client, mid, gh, "accept", revision=2).status_code == 409
    assert call(client, mid, ch, "confirm", revision=2).status_code == 200
    assert call(client, mid, gh, "accept", revision=2).status_code == 200
    assert submit(client, mid, gh).status_code == 403
    assert submit(client, mid, ch).status_code == 403
    assert call(client, mid, ch, "consent", revision=2).status_code == 200
    assert submit(client, mid, ch).status_code == 200
    assert (
        call(
            client, mid, ch, "edit", revision=2, criteria="Подмена", source="Подмена"
        ).status_code
        == 409
    )
    assert (
        client.post(
            f"/markets/{mid}/resolve", headers=ah, json={"winning_outcome": 0}
        ).status_code
        == 409
    )
    _, stranger = _login(client)
    assert client.get(f"/markets/{mid}/guarantor", headers=stranger).status_code == 404
    assert call(client, mid, stranger, "message", text="guess").status_code == 404


def test_invitation_expiry_extension_and_reinvite(client, monkeypatch):
    _, ah, _, ch, _, gh, _, _, m = setup_case(client, monkeypatch)
    mid = m["id"]
    with SessionLocal() as db:
        db.get(GuarantorCase, mid).deadline = gs.now() - timedelta(seconds=1)
        db.commit()
    assert call(client, mid, gh, "acknowledge").status_code == 409
    # Expiry must work in action as well as in worker.
    assert (
        call(client, mid, ch, "invite", guarantor_id=m["creator_id"]).status_code == 422
    )
    gs.process_due()
    with SessionLocal() as db:
        case = db.get(GuarantorCase, mid)
        gid = case.guarantor_id
        assert case.state == "needs_guarantor"
    assert call(client, mid, ch, "invite", guarantor_id=gid).status_code == 200
    assert call(client, mid, gh, "acknowledge").status_code == 200
    first = call(client, mid, ch, "extend").json()
    second = call(client, mid, ch, "extend").json()
    assert first["deadline"] == second["deadline"]
    assert call(client, mid, gh, "extend").json()["extension_by"] is None


def make_filled(client, ch, gh, bh, mid):
    open_case(client, ch, gh, mid)
    assert call(client, mid, bh, "consent", revision=1).status_code == 200
    assert submit(client, mid, ch, odds=2, amount=100).status_code == 200
    assert submit(client, mid, bh, side=1, odds=2, amount=100).status_code == 200
    with SessionLocal() as db:
        db.get(Market, mid).close_at = gs.now() - timedelta(seconds=1)
        db.commit()
    r = call(
        client, mid, gh, "propose", outcome=0, text="Запись подтверждает первый исход"
    )
    assert r.status_code == 200, r.text


def test_automatic_payout_once_and_reviews(client, monkeypatch):
    _, ah, creator, ch, g, gh, b, bh, m = setup_case(client, monkeypatch)
    mid = m["id"]
    make_filled(client, ch, gh, bh, mid)
    with SessionLocal() as db:
        assert db.get(Market, mid).pot_nano == 200_000_000_000
        db.get(GuarantorCase, mid).deadline = gs.now() - timedelta(seconds=1)
        db.commit()
    gs.process_due()
    gs.process_due()
    with SessionLocal() as db:
        assert db.get(GuarantorCase, mid).state == "settled"
        assert db.get(Market, mid).pot_nano == 0
        assert db.get(User, creator["id"]).balance_nano == 1099_000_000_000
        assert db.query(SettlementRecord).filter_by(market_id=mid).count() == 2
    assert (
        call(client, mid, gh, "propose", outcome=1, text="Другая версия").status_code
        == 409
    )
    assert (
        call(client, mid, bh, "review", rating=4, text="Проверил запись").status_code
        == 200
    )
    assert call(client, mid, bh, "review", rating=5).status_code == 409
    assert call(client, mid, gh, "review", rating=5).status_code == 403
    row = next(
        gp
        for gp in client.get("/guarantors", headers=bh).json()
        if gp["user_id"] == g["id"]
    )
    assert row["completed"] == 1 and row["rating"] == 4 and row["review_count"] == 1


def test_dispute_prevents_payout_and_admin_can_refund(client, monkeypatch):
    _, ah, creator, ch, _, gh, b, bh, m = setup_case(client, monkeypatch)
    mid = m["id"]
    make_filled(client, ch, gh, bh, mid)
    assert (
        call(client, mid, bh, "dispute", text="Не та запись").json()["state"]
        == "disputed"
    )
    gs.process_due()
    with SessionLocal() as db:
        assert db.get(Market, mid).pot_nano == 200_000_000_000
    r = call(client, mid, ah, "admin_cancel", text="Результат невозможно проверить")
    assert r.status_code == 200, r.text
    with SessionLocal() as db:
        assert db.get(User, creator["id"]).balance_nano == 1000_000_000_000
        assert db.get(User, b["id"]).balance_nano == 1000_000_000_000
    assert call(client, mid, ah, "admin_cancel", text="Повтор").status_code == 409


def test_private_creation_requires_guarantor_and_profile_approval(client, monkeypatch):
    _, ah = _admin(client, monkeypatch)
    u, h = _login(client)
    assert (
        client.post(
            "/markets",
            headers=h,
            json={
                "question": "Проверяем обязательного гаранта?",
                "visibility": "unlisted",
                "close_at": _close_at(),
            },
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/guarantors/me/availability", headers=h, json={"available": True}
        ).status_code
        == 403
    )
    assert client.get("/guarantors/applications", headers=h).status_code == 403
    assert client.get("/notifications", headers=h).status_code == 200
    assert client.post("/notifications/999999/read", headers=h).status_code == 404


def test_offline_guarantor_and_missing_result_escalate(client, monkeypatch):
    _, ah, _, ch, g, gh, _, bh, m = setup_case(client, monkeypatch)
    mid = m["id"]
    open_case(client, ch, gh, mid)
    assert (
        client.post(
            "/guarantors/me/availability", headers=gh, json={"available": False}
        ).status_code
        == 200
    )
    # Going offline does not abandon an accepted event.
    assert (
        client.get(f"/markets/{mid}/guarantor", headers=ch).json()["state"] == "active"
    )
    with SessionLocal() as db:
        db.get(GuarantorCase, mid).result_due_at = gs.now() - timedelta(seconds=1)
        db.commit()
    gs.process_due()
    assert (
        client.get(f"/markets/{mid}/guarantor", headers=ch).json()["state"]
        == "disputed"
    )
    assert any(
        "администратору" in n["text"]
        for n in client.get("/notifications", headers=ah).json()
    )


def test_bank_failure_rolls_back_and_escalates(client, monkeypatch):
    _, ah, _, ch, g, gh, _, bh, m = setup_case(client, monkeypatch)
    mid = m["id"]
    make_filled(client, ch, gh, bh, mid)
    with SessionLocal() as db:
        db.get(GuarantorCase, mid).deadline = gs.now() - timedelta(seconds=1)
        db.get(Market, mid).pot_nano -= 1
        db.commit()
    gs.process_due()
    with SessionLocal() as db:
        assert db.get(GuarantorCase, mid).state == "disputed"
        assert db.query(SettlementRecord).filter_by(market_id=mid).count() == 0
        db.get(Market, mid).pot_nano += 1
        db.commit()
    assert (
        client.post(
            f"/guarantors/{g['id']}/approval", headers=ah, json={"approved": False}
        ).status_code
        == 200
    )
    gs.process_due()
    with SessionLocal() as db:
        assert db.get(GuarantorCase, mid).state == "disputed"
        assert db.get(Market, mid).pot_nano == 200_000_000_000


def test_parallel_workers_settle_only_once(client, monkeypatch):
    from concurrent.futures import ThreadPoolExecutor

    _, _, _, ch, _, gh, _, bh, m = setup_case(client, monkeypatch)
    mid = m["id"]
    make_filled(client, ch, gh, bh, mid)
    with SessionLocal() as db:
        db.get(GuarantorCase, mid).deadline = gs.now() - timedelta(seconds=1)
        db.commit()
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(lambda _: gs.process_due(), range(2)))
    with SessionLocal() as db:
        assert db.get(GuarantorCase, mid).state == "settled"
        assert db.query(SettlementRecord).filter_by(market_id=mid).count() == 2
        assert db.get(Market, mid).pot_nano == 0


def test_admin_guarantor_cannot_decide_own_dispute(client, monkeypatch):
    admin, ah, _, ch, _, gh, _, bh, m = setup_case(client, monkeypatch)
    mid = m["id"]
    make_filled(client, ch, gh, bh, mid)
    assert call(client, mid, bh, "dispute", text="Спор").status_code == 200
    # Simulate an event whose guarantor also has the administrator role.
    with SessionLocal() as db:
        db.get(GuarantorCase, mid).guarantor_id = admin["id"]
        db.commit()
    assert (
        call(
            client, mid, ah, "admin_resolve", outcome=0, text="Решаю свой спор"
        ).status_code
        == 403
    )
    assert (
        client.post(
            f"/markets/{mid}/cancel",
            headers=ah,
            json={"reason": "Обход через старый API"},
        ).status_code
        == 403
    )


def test_revocation_blocks_due_payout(client, monkeypatch):
    _, ah, _, ch, g, gh, _, bh, m = setup_case(client, monkeypatch)
    mid = m["id"]
    make_filled(client, ch, gh, bh, mid)
    assert (
        client.post(
            f"/guarantors/{g['id']}/approval", headers=ah, json={"approved": False}
        ).status_code
        == 200
    )
    with SessionLocal() as db:
        db.get(GuarantorCase, mid).deadline = gs.now() - timedelta(seconds=1)
        db.commit()
    gs.process_due()
    with SessionLocal() as db:
        assert db.get(GuarantorCase, mid).state == "disputed"
        assert db.get(Market, mid).pot_nano == 200_000_000_000
        assert db.query(SettlementRecord).filter_by(market_id=mid).count() == 0


def test_admin_resolution_and_new_device_participant_access(client, monkeypatch):
    _, ah, _, ch, _, gh, b, bh, m = setup_case(client, monkeypatch)
    mid = m["id"]
    make_filled(client, ch, gh, bh, mid)
    without_token = {"Authorization": bh["Authorization"]}
    assert (
        client.get(f"/markets/{mid}/guarantor", headers=without_token).status_code
        == 200
    )
    assert (
        call(client, mid, without_token, "dispute", text="Проверьте итог").status_code
        == 200
    )
    assert (
        call(
            client,
            mid,
            ah,
            "admin_resolve",
            outcome=1,
            text="Запись подтверждает второй исход",
        ).status_code
        == 200
    )
    assert (
        call(client, mid, ah, "admin_resolve", outcome=0, text="Повтор").status_code
        == 409
    )
    with SessionLocal() as db:
        assert db.get(GuarantorCase, mid).state == "settled"
        assert db.get(User, b["id"]).balance_nano == 1099_000_000_000


def test_stale_presence_not_available_and_heartbeat_does_not_enable(
    client, monkeypatch
):
    _, _, _, _, g, gh, _, bh, _ = setup_case(client, monkeypatch)
    with SessionLocal() as db:
        db.get(GuarantorProfile, g["id"]).last_seen_at = gs.now() - timedelta(
            seconds=91
        )
        db.commit()
    profile = next(
        row
        for row in client.get("/guarantors", headers=bh).json()
        if row["user_id"] == g["id"]
    )
    assert not profile["available"]
    assert (
        client.post(
            "/guarantors/me/availability", headers=gh, json={"available": False}
        ).status_code
        == 200
    )
    assert client.post("/guarantors/me/heartbeat", headers=gh).status_code == 200
    assert not client.get("/guarantors/me", headers=gh).json()["available"]


def test_any_user_can_enroll_with_rules_and_suspension_is_enforced(client, monkeypatch):
    _, ah = _admin(client, monkeypatch)
    user, headers = _login(client)
    # No self-registration without informed acceptance.
    missing = client.put(
        "/guarantors/me", headers=headers,
        json={"bio": "", "topics": "", "accept_rules": False},
    )
    assert missing.status_code == 422
    assert client.get("/guarantors/me", headers=headers).json() is None

    created = client.put(
        "/guarantors/me", headers=headers,
        json={"bio": "", "topics": "", "accept_rules": True},
    )
    assert created.status_code == 200, created.text
    assert created.json()["status"] == "approved"
    assert created.json()["completed"] == 0
    assert created.json()["rating"] is None
    assert created.json()["rating_distribution"] == {
        "5": 0, "4": 0, "3": 0, "2": 0, "1": 0,
    }
    assert created.json()["high_reputation"] is False
    assert created.json()["is_moderator"] is False
    assert client.post(
        "/guarantors/me/availability", headers=headers, json={"available": True}
    ).status_code == 200
    assert any(
        g["user_id"] == user["id"]
        for g in client.get("/guarantors", headers=headers).json()
    )

    # An administrator can revoke access; editing cannot lift that ban.
    assert client.post(
        f"/guarantors/{user['id']}/approval",
        headers=ah, json={"approved": False},
    ).status_code == 200
    assert client.put(
        "/guarantors/me", headers=headers,
        json={"bio": "Trying to bypass suspension", "accept_rules": True},
    ).status_code == 403
    assert client.post(
        "/guarantors/me/availability", headers=headers,
        json={"available": True},
    ).status_code == 403


def test_reputation_metrics_after_authentic_rating(client, monkeypatch):
    _, _, _, ch, guarantor, gh, _, bh, market = setup_case(client, monkeypatch)
    mid = market["id"]
    make_filled(client, ch, gh, bh, mid)
    with SessionLocal() as db:
        db.get(GuarantorCase, mid).deadline = gs.now() - timedelta(seconds=1)
        db.commit()
    gs.process_due()
    assert call(client, mid, bh, "review", rating=5, text="Точно по записи").status_code == 200

    row = client.get("/guarantors/me", headers=gh).json()
    assert row["completed"] == 1
    assert row["review_count"] == 1
    assert row["rating_distribution"]["5"] == 1
    assert row["rating_distribution"]["1"] == 0
    assert row["disputes"] == 0
    assert not row["high_reputation"]
