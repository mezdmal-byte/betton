from app.database import SessionLocal
from app.models import P2POrder, Market
from tests.test_p2p import ready, submit
from tests.test_markets_api import _login
from datetime import timedelta
from app.services import market_service as ms


def test_active_offers_count_only_funded_unfilled_parts(client, monkeypatch):
    baseline = int(client.get("/feed/stats").json()["active_offers_nano"])
    _, _, a, ha, b, hb, mid = ready(client, monkeypatch)
    first = submit(client, mid, ha, 0, 100, 2).json()
    submit(client, mid, hb, 0, 50, 2)
    assert (
        int(client.get("/feed/stats").json()["active_offers_nano"])
        == baseline + 150_000_000_000
    )
    _, hc = _login(client)
    assert submit(client, mid, hc, 1, 40, 2).status_code == 200
    assert (
        int(client.get("/feed/stats").json()["active_offers_nano"])
        == baseline + 110_000_000_000
    )
    with SessionLocal() as db:
        market = db.get(Market, mid)
        market.close_at = ms._naive_utc(ms.utcnow()) - timedelta(seconds=1)
        before = db.get(P2POrder, first["id"]).remaining
        db.commit()
    assert int(client.get("/feed/stats").json()["active_offers_nano"]) == baseline
    with SessionLocal() as db:
        assert db.get(P2POrder, first["id"]).remaining == before
