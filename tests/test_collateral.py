from tests.legacy_helpers import post_legacy_market
import math
import random

import pytest

from app.database import SessionLocal
from app.lmsr import apply_buy, cost, prices
from app.models import Market, Position, Trade
from app.services import market_service as service
from tests.test_markets_api import _admin, _login, _close_at


@pytest.mark.parametrize('probabilities', [[0.9, 0.1], [0.01, 0.99], [0.8, 0.15, 0.05], [1/8]*8])
def test_collateral_covers_every_outcome(client, monkeypatch, probabilities):
    admin, headers = _admin(client, monkeypatch)
    market = post_legacy_market(client,'/markets', headers=headers, json={
        'question': 'Every outcome is funded?', 'lock_ton': 50,
        'outcomes': [f'Outcome {i}' for i in range(len(probabilities))],
        'target_probs': probabilities, 'close_at': _close_at(),
    }).json()
    b, q = market['b'], market['q']
    assert market['prices'] == pytest.approx(probabilities)
    assert cost(q, b) - min(q) == pytest.approx(50)
    if len(set(probabilities)) == 1:
        assert b == pytest.approx(50 / math.log(len(probabilities)))
    rng = random.Random(41)
    liabilities = [0.0]*len(q)
    pot = 50.0
    # Includes very large trades relative to b and purchases on all outcomes.
    for step in range(60):
        outcome = step % len(q)
        q, shares, paid = apply_buy(q, b, outcome, rng.choice([0.01, 1, 100, 10000]))
        liabilities[outcome] += shares
        pot += paid
        assert max(liabilities) <= pot + 1e-8
        assert sum(prices(q, b)) == pytest.approx(1)


@pytest.mark.parametrize('winner', [0, 1, 2])
def test_unequal_market_resolves_full_payout(client, monkeypatch, winner):
    admin, admin_h = _admin(client, monkeypatch)
    player, player_h = _login(client)
    market = post_legacy_market(client,'/markets', headers=admin_h, json={
        'question': 'Full payout with unequal probabilities?', 'lock_ton': 50,
        'outcomes': ['A','B','C'], 'target_probs': [0.85, 0.1, 0.05],
        'close_at': _close_at(),
    }).json()
    mid = market['id']
    shares = []
    for i in range(3):
        response = client.post(f'/markets/{mid}/buy', headers=player_h,
                               json={'outcome': i, 'money': 100})
        assert response.status_code == 200, response.text
        shares.append(response.json()['shares'])
    assert client.post(f'/markets/{mid}/close', headers=admin_h).status_code == 200
    response = client.post(f'/markets/{mid}/resolve', headers=admin_h, json={'winning_outcome': winner})
    assert response.status_code == 200, response.text
    record = next(r for r in client.get(f"/users/{player['id']}/settlements", headers=player_h).json() if r['market_id'] == mid)
    assert record['payout'] == pytest.approx(shares[winner])
    assert record['credited'] + record['tip'] == pytest.approx(shares[winner])


def test_original_90_10_failure_is_funded(client, monkeypatch):
    admin, admin_h = _admin(client, monkeypatch)
    player, player_h = _login(client)
    mid = post_legacy_market(client,'/markets', headers=admin_h, json={
        'question': '50 collateral, 100 on rare outcome', 'lock_ton': 50,
        'target_odds': [1/0.9, 10], 'close_at': _close_at(),
    }).json()['id']
    response = client.post(f'/markets/{mid}/buy', headers=player_h, json={'outcome': 1, 'money': 100})
    assert response.status_code == 200, response.text
    assert 100 < response.json()['shares'] <= 150
    client.post(f'/markets/{mid}/close', headers=admin_h)
    assert client.post(f'/markets/{mid}/resolve', headers=admin_h, json={'winning_outcome': 1}).status_code == 200


def test_legacy_unfunded_trade_is_rejected_without_mutations(client, monkeypatch):
    admin, admin_h = _admin(client, monkeypatch)
    player, player_h = _login(client)
    mid = post_legacy_market(client,'/markets', headers=admin_h, json={
        'question': 'Legacy depth is preserved', 'lock_ton': 50, 'close_at': _close_at(),
    }).json()['id']
    with SessionLocal() as db:
        market = db.get(Market, mid)
        market.b = 50 / math.log(2)
        service._set_quantities(market, service.q_from_target_probs([.9, .1], market.b))
        db.commit()
    before = client.get(f'/markets/{mid}').json()
    balance = client.get(f"/users/{player['id']}", headers=player_h).json()['balance']
    for action in ['quote', 'buy']:
        response = client.post(f'/markets/{mid}/{action}', headers=player_h,
                               json={'outcome': 1, 'money': 100})
        assert response.status_code == 409, response.text
    after = client.get(f'/markets/{mid}').json()
    assert (after['q'], after['b'], after['pot']) == (before['q'], before['b'], before['pot'])
    assert client.get(f"/users/{player['id']}", headers=player_h).json()['balance'] == balance
    with SessionLocal() as db:
        assert db.query(Position).filter_by(market_id=mid).count() == 0
        assert db.query(Trade).filter_by(market_id=mid).count() == 0


@pytest.mark.parametrize('probs', [[0,1], [-1,2], [math.nan,1], [math.inf,1]])
def test_invalid_probability_rejected(probs):
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as error:
        service._probs_from_create(2, None, probs)
    assert error.value.status_code == 400
