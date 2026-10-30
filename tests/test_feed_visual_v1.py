"""Read-only feed fields and filters on synthetic disposable test data."""
from datetime import datetime, timedelta, timezone

from app.database import SessionLocal
from app.models import Market, P2POrder
from tests.test_markets_api import _admin
from tests.test_profile_creators import _login
from tests.test_p2p import submit


def test_offer_metrics_and_filters_are_exact_before_pagination(client, monkeypatch):
    _, ah = _admin(client, monkeypatch)
    _, maker = _login(client)
    _, taker = _login(client)
    now = datetime.now(timezone.utc)
    ids = []
    for index in range(3):
        response = client.post('/markets', headers=maker, json={
            'question': f'Visual V1 feed read model unique event {index}?',
            'outcomes': ['A', 'B'],
            'close_at': (now + timedelta(days=index + 1)).isoformat(),
        })
        assert response.status_code == 200, response.text
        mid = response.json()['id']
        assert client.post(f'/markets/{mid}/approve', headers=ah).status_code == 200
        ids.append(mid)
    assert submit(client, ids[0], maker, 0, 100, 2).status_code == 200
    assert submit(client, ids[0], taker, 1, 40, 2).status_code == 200
    assert submit(client, ids[2], maker, 0, 10, 2).status_code == 200

    base = {'q': 'Visual V1 feed read model', 'sort': 'new'}
    response = client.get('/markets', params={**base, 'offers': 'available', 'limit': 1})
    assert response.status_code == 200
    assert response.headers['X-Total-Count'] == '2'
    assert [m['id'] for m in response.json()] == [ids[2]]
    page2 = client.get('/markets', params={**base, 'offers': 'available', 'limit': 1, 'offset': 1})
    assert [m['id'] for m in page2.json()] == [ids[0]]
    activity = page2.json()[0]['activity']
    assert activity['active_offers_nano'] == '60000000000'
    assert activity['offers_count'] == 1
    assert activity['volume_nano'] == 80000000000

    empty = client.get('/markets', params={**base, 'offers': 'empty'})
    assert [m['id'] for m in empty.json()] == [ids[1]]
    cutoff = (now + timedelta(days=1, hours=1)).isoformat()
    before = client.get('/markets', params={**base, 'close_before': cutoff})
    assert [m['id'] for m in before.json()] == [ids[0]]

    # Reading cannot consume/cancel reserves, and expired rows are not offers.
    with SessionLocal() as db:
        orders_before = [(o.id, o.remaining, o.status) for o in db.query(P2POrder).filter(P2POrder.market_id.in_(ids)).all()]
        db.get(Market, ids[2]).visibility = 'unlisted'
        db.commit()
    hidden = client.get('/markets', params={**base, 'offers': 'available'})
    assert [m['id'] for m in hidden.json()] == [ids[0]]
    with SessionLocal() as db:
        assert orders_before == [(o.id, o.remaining, o.status) for o in db.query(P2POrder).filter(P2POrder.market_id.in_(ids)).all()]


def test_feed_filter_input_validation(client):
    # The application's existing validation handler translates invalid input to 400.
    assert client.get('/markets', params={'offers': 'invented'}).status_code == 400
    assert client.get('/markets', params={'close_before': 'not-a-date'}).status_code == 400
