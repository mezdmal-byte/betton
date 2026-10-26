"""Read the actual SQLAlchemy schema and P2P-generated rows, only in conftest's isolated DB."""

from fastapi.testclient import TestClient
from sqlalchemy import select, create_engine
from sqlalchemy.engine import URL

from admin_center.app import create_app
from admin_center.security import make_password_hash
from admin_center.store import read_only_engine
from app.database import SessionLocal, engine as fixture_engine, Base
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


def sqlite_fixture_snapshot(path):
    """Test-only online relational copy; never used by the runtime launcher."""
    target_engine=create_engine(URL.create('sqlite',database=str(path)))
    Base.metadata.create_all(target_engine)
    with fixture_engine.connect() as source:
        if fixture_engine.dialect.name=='postgresql':
            source=source.execution_options(isolation_level='REPEATABLE READ')
        with source.begin(), target_engine.begin() as target:
            for table in Base.metadata.sorted_tables:
                rows=[dict(row._mapping) for row in source.execute(select(table))]
                if rows: target.execute(table.insert(),rows)
    url=target_engine.url.render_as_string(hide_password=False)
    target_engine.dispose()
    return url


def test_reads_actual_p2p_rows_without_money_side_effects(client, monkeypatch, tmp_path):
    _, _, a, ha, b, hb, mid = ready(client, monkeypatch)
    first = submit(client, mid, ha).json()
    assert submit(client, mid, hb, 1, 50, 1.83).status_code == 200
    before = snapshot()

    def forbidden(*_args, **_kwargs):
        raise AssertionError("Admin read called a money-changing business service")

    for name in ("create_market", "expire_due_orders", "_refund"):
        monkeypatch.setattr(p2p_service, name, forbidden)

    if fixture_engine.dialect.name == 'sqlite':
        reader_url=fixture_engine.url.render_as_string(hide_password=False)
    else:
        # The normal PG test role owns fixtures and must remain forbidden to the
        # admin reader. Copy real fixture rows to a separate SQLite test snapshot
        # instead of weakening the SELECT-only role guard or skipping assertions.
        reader_url=sqlite_fixture_snapshot(tmp_path/'admin-test-snapshot.sqlite')
    reader = read_only_engine(reader_url)
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


def test_fixture_snapshot_adapter_retains_actual_rows_and_source(client,monkeypatch,tmp_path):
    _,_,a,ha,b,hb,mid=ready(client,monkeypatch)
    assert submit(client,mid,ha).status_code==200
    assert submit(client,mid,hb,1,50,1.83).status_code==200
    before=snapshot()
    engine=read_only_engine(sqlite_fixture_snapshot(tmp_path/'adapter-test.sqlite'))
    try:
        with engine.connect() as conn:
            assert conn.execute(select(Market.__table__).where(Market.id==mid)).one().question
            assert conn.execute(select(P2PFill.__table__).where(P2PFill.market_id==mid)).one().maker_stake>0
    finally:engine.dispose()
    assert snapshot()==before
