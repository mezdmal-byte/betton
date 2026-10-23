"""Read the actual SQLAlchemy schema and P2P-generated rows, only in conftest's isolated DB."""

from fastapi.testclient import TestClient
from sqlalchemy import select

from admin_center.app import create_app
from admin_center.security import make_password_hash
from admin_center.store import read_only_engine
from app.database import SessionLocal, engine as fixture_engine
from app.models import Market, P2POrder, P2PFill, P2PMoneyEntry, User
from app.services import p2p_service
from tests.test_p2p import ready, submit


def snapshot():
    with SessionLocal() as db:
        return {
            model.__tablename__: [
                tuple(row)
                for row in db.execute(select(model.__table__).order_by(model.id))
            ]
            for model in (User, Market, P2POrder, P2PFill, P2PMoneyEntry)
        }


def test_reads_actual_p2p_rows_without_money_side_effects(client, monkeypatch):
    _, _, a, ha, b, hb, mid = ready(client, monkeypatch)
    first = submit(client, mid, ha).json()
    assert submit(client, mid, hb, 1, 50, 1.83).status_code == 200
    before = snapshot()

    def forbidden(*_args, **_kwargs):
        raise AssertionError("Admin read called a money-changing business service")

    for name in ("create_market", "expire_due_orders", "_refund"):
        monkeypatch.setattr(p2p_service, name, forbidden)

    reader = read_only_engine(fixture_engine.url.render_as_string(hide_password=False))
    with TestClient(
        create_app(
            engine=reader,
            username="local-reader",
            password_hash=make_password_hash("isolated-integration-secret"),
            allow_testclient=True,
        )
    ) as c:
        c.auth = ("local-reader", "isolated-integration-secret")
        user = c.get(f"/api/users/{a['id']}")
        assert user.status_code == 200, user.text
        assert any(row["id"] == first["id"] for row in user.json()["orders"])
        event = c.get(f"/api/events/{mid}").json()
        assert len(event["fills"]) == 1 and event["coverage"] == "full"
        assert len(event["ledger"]) == 4
        order = c.get(f"/api/orders/{first['id']}").json()
        assert (
            int(order["order"]["remaining"]) > 0 and int(order["order"]["filled"]) > 0
        )
        fill = c.get("/api/fills/" + str(event["fills"][0]["id"])).json()
        assert len(fill["ledger"]) == 2
        assert c.get("/api/ledger?user_id=" + str(b["id"])).status_code == 200
    reader.dispose()
    assert snapshot() == before
