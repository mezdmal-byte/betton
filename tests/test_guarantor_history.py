from datetime import timedelta

from app.database import SessionLocal
from app.models import EventConfigV3, User, P2PMoneyEntry
from app.services import guarantors as gs, market_service as ms, history
from tests.test_guarantor_funding import paid_case, NANO
from tests.test_guarantors import call
from tests.test_p2p import submit


def assert_history_matches_balance(db, mid, initial):
    count = db.query(P2PMoneyEntry).count()
    for uid, balance in initial.items():
        rows = [r for r in history.list_transactions(db, uid) if r['market_id'] == mid]
        assert sum(r['amount_nano'] for r in rows) == db.get(User, uid).balance_nano - balance
    assert db.query(P2PMoneyEntry).count() == count  # Read-only projection.


def test_net_credit_and_guarantor_income(client, monkeypatch):
    _, _, a, ha, g, hg, b, hb, event = paid_case(client, monkeypatch, fixed='5')
    mid = event['id']
    with SessionLocal() as db:
        initial = {uid: db.get(User, uid).balance_nano for uid in [a['id'], b['id'], g['id']]}
    assert submit(client, mid, ha, 0, 100, 2).status_code == 200
    assert submit(client, mid, hb, 1, 100, 2).status_code == 200
    with SessionLocal() as db:
        ends = db.get(EventConfigV3, mid).ends_at
    monkeypatch.setattr(gs, 'now', lambda: ends + timedelta(hours=1))
    monkeypatch.setattr(ms, 'utcnow', lambda: ms.as_utc(ends) + timedelta(hours=1))
    assert call(client, mid, hg, 'propose', revision=2, outcome=0, text='Verified').status_code == 200
    with SessionLocal() as db:
        assert_history_matches_balance(db, mid, initial)
        winner = {r['type']: r for r in history.list_transactions(db, a['id']) if r['market_id'] == mid}
        assert winner['win']['amount_nano'] == 194 * NANO
        assert winner['fee']['display_nano'] == -NANO
        assert winner['guarantor_fee']['display_nano'] == -5 * NANO
        for key in ['fee', 'guarantor_fee']:
            assert winner[key]['amount_nano'] == 0
            assert winner[key]['informational']
        income = [r for r in history.list_transactions(db, g['id'], 'wins') if r['market_id'] == mid]
        assert sum(r['amount_nano'] for r in income) == 5 * NANO
        settlement = next(s for s in ms.list_settlements_out(db, a['id']) if s.market_id == mid)
        assert (settlement.payout, settlement.tip, settlement.guarantor_reward, settlement.credited) == (200, 1, 5, 194)
