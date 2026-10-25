"""Admin Center tests: auth isolation, readonly SQLite and correct P2P reserved amount."""

from __future__ import annotations
import base64
from pathlib import Path
import sqlite3

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
import hashlib
import subprocess
import sys

from admin_center.app import create_app
from admin_center.security import make_password_hash, verify_password
from admin_center.store import read_only_engine


@pytest.fixture()
def fixture_db(tmp_path: Path):
    location = tmp_path / "test.sqlite"
    con = sqlite3.connect(location)
    con.executescript("""
    CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, telegram_id INTEGER,
      telegram_username TEXT, display_name TEXT, balance_nano INTEGER, created_at TEXT);
    CREATE TABLE markets (id INTEGER PRIMARY KEY, question TEXT, description TEXT, creator_id INTEGER,
      category TEXT, mechanism TEXT, visibility TEXT, status TEXT, close_at TEXT, created_at TEXT,
      resolved_at TEXT, winning_outcome TEXT, p2p_journal_coverage TEXT);
    CREATE TABLE p2p_orders (id INTEGER PRIMARY KEY, market_id INTEGER, user_id INTEGER, outcome INTEGER,
      price INTEGER, amount INTEGER, remaining INTEGER, filled INTEGER, refunded INTEGER, kind TEXT,
      status TEXT, created_at TEXT);
    CREATE TABLE p2p_fills (id INTEGER PRIMARY KEY, market_id INTEGER, maker_order_id INTEGER,
      taker_order_id INTEGER, maker_user_id INTEGER, taker_user_id INTEGER, maker_outcome INTEGER,
      maker_stake INTEGER, taker_stake INTEGER, price INTEGER, created_at TEXT);
    CREATE TABLE p2p_money_entries (id INTEGER PRIMARY KEY, entry_key TEXT, op_type TEXT, market_id INTEGER,
      order_id INTEGER, fill_id INTEGER, from_kind TEXT, from_user_id INTEGER, from_order_id INTEGER,
      to_kind TEXT, to_user_id INTEGER, to_order_id INTEGER, amount INTEGER, reason TEXT, created_at TEXT);
    CREATE TABLE settlement_records (id INTEGER PRIMARY KEY, market_id INTEGER, user_id INTEGER,
      question TEXT, winning_outcome TEXT, stakes_total REAL, payout REAL, tip REAL, credited REAL, resolved_at TEXT);
    CREATE TABLE guarantor_cases (market_id INTEGER PRIMARY KEY, guarantor_id INTEGER, state TEXT,
      revision INTEGER, criteria TEXT, source TEXT, result_due_at TEXT, deadline TEXT,
      proposed_outcome INTEGER, decision_reason TEXT);
    INSERT INTO users VALUES (18, 'alice', 1001, 'alice_tg', 'Alice', 890000000000, '2026-10-23');
    INSERT INTO users VALUES (24, 'bob', 1002, 'bob_tg', 'Bob', 999000000000, '2026-10-23');
    INSERT INTO markets VALUES (42, 'Спартак — Зенит', 'матч', 18, 'sports','p2p','private',
      'open',NULL,'2026-10-23',NULL,NULL,'full');
    INSERT INTO markets VALUES (43, 'Другое событие', '', 18, 'sports','p2p','public',
      'closed',NULL,'2026-10-23',NULL,NULL,'incomplete');
    INSERT INTO p2p_orders VALUES (501,42,18,0,150,100000000000,40000000000,60000000000,0,
      'maker','open','2026-10-23');
    INSERT INTO p2p_orders VALUES (502,42,24,1,150,50000000000,50000000000,0,0,
      'maker','open','2026-10-23');
    INSERT INTO p2p_orders VALUES (503,43,18,0,150,80000000000,80000000000,0,0,
      'maker','open','2026-10-23');
    INSERT INTO p2p_fills VALUES (705,42,501,502,18,24,0,60000000000,30000000000,150,'2026-10-23');
    INSERT INTO p2p_money_entries VALUES (987,'reserve:501','reserve',42,501,NULL,'user_balance',18,NULL,
      'order_reserve',18,501,100000000000,NULL,'2026-10-23');
    INSERT INTO guarantor_cases VALUES (42,24,'invited',1,'критерий','источник',NULL,NULL,NULL,NULL);
    """)
    con.commit()
    con.close()
    return location


@pytest.fixture()
def admin(fixture_db):
    credential = make_password_hash("long-unique-secret-password")
    engine = read_only_engine("sqlite:///" + str(fixture_db))
    with TestClient(
        create_app(
            engine=engine,
            username="owner",
            password_hash=credential,
            allow_testclient=True,
        )
    ) as c:
        auth = base64.b64encode(b"owner:long-unique-secret-password").decode("ascii")
        yield c, {"Authorization": "Basic " + auth}, engine
    engine.dispose()


def test_authentication_is_required_everywhere(admin):
    c, auth, _ = admin
    for path in ("/", "/api/users", "/assets/app.js", "/api/overview", "/api/ledger"):
        assert c.get(path).status_code == 401
    assert (
        c.get("/api/overview", headers={"Authorization": "Bearer invalid"}).status_code
        == 401
    )
    assert c.get("/api/users", headers=auth).status_code == 200
    assert c.get("/", headers=auth).headers["X-Frame-Options"] == "DENY"


def test_denies_nonlocal_socket_peer(fixture_db):
    engine = read_only_engine("sqlite:///" + str(fixture_db))
    h = make_password_hash("long-unique-secret-password")
    with TestClient(create_app(engine=engine, username="owner", password_hash=h)) as c:
        assert c.get("/api/overview").status_code == 403
    engine.dispose()


def test_overview_uses_only_remaining_open_offers(admin):
    c, auth, _ = admin
    d = c.get("/api/overview", headers=auth).json()
    assert d["users"] == 2 and d["events"] == 2
    assert d["open_offers_ton"] == "90"
    assert d["open_offers_nano"] == "90000000000"


def test_user_event_ledger_traversal(admin):
    c, auth, _ = admin
    assert c.get("/api/users?q=alice", headers=auth).json()["items"][0]["id"] == 18
    user = c.get("/api/users/18", headers=auth).json()
    assert user["user"]["balance_nano"] == "890000000000"
    assert next(x for x in user["orders"] if x["id"] == 501)["amount"] == "100000000000"
    assert user["ledger"][0]["entry_key"] == "reserve:501"
    event = c.get("/api/events/42", headers=auth).json()
    assert event["event"]["question"] == "Спартак — Зенит"
    assert event["guarantor"]["guarantor_id"] == 24
    assert event["coverage"] == "full"
    assert event["fills"][0]["maker_stake"] == "60000000000"
    assert c.get("/api/events/999", headers=auth).status_code == 404
    assert c.get("/api/ledger?user_id=18", headers=auth).json()["items"][0]["id"] == 987


def test_no_post_put_delete_routes(admin):
    c, auth, engine = admin
    for method in ("post", "put", "patch", "delete"):
        assert getattr(c, method)("/api/users/18", headers=auth).status_code == 405
    with pytest.raises(RuntimeError, match="permits SELECT"):
        with engine.begin() as connection:
            connection.exec_driver_sql("UPDATE users SET balance_nano=0 WHERE id=18")
    # Bypass the SQLAlchemy guard to verify SQLite's native read-only protection too.
    connection = engine.raw_connection()
    try:
        with pytest.raises(sqlite3.OperationalError):
            connection.cursor().execute("UPDATE users SET balance_nano=0 WHERE id=18")
    finally:
        connection.close()


def test_bounded_pagination_and_refuses_invalid_config(admin):
    c, auth, _ = admin
    assert c.get("/api/users?limit=101", headers=auth).status_code == 422
    assert c.get("/api/ledger?offset=-1", headers=auth).status_code == 422
    assert c.get("/api/events?q=%25", headers=auth).status_code == 200
    assert verify_password(
        "long-unique-secret-password", make_password_hash("long-unique-secret-password")
    )
    assert not verify_password("bad", make_password_hash("long-unique-secret-password"))
    with pytest.raises(RuntimeError):
        read_only_engine("sqlite:///:memory:")


def test_search_all_identifiers_and_wildcards(admin):
    c, auth, _ = admin
    for query in ("18", "1001", "@alice_tg", "Alice"):
        assert (
            c.get("/api/users", params={"q": query}, headers=auth).json()["items"][0][
                "id"
            ]
            == 18
        )
    assert c.get("/api/events?q=42", headers=auth).json()["items"][0]["id"] == 42
    assert (
        c.get("/api/orders?order_id=501", headers=auth).json()["items"][0]["id"] == 501
    )
    for query in ("%", "' OR 1=1 --", "9" * 64):
        response = c.get("/api/users", params={"q": query}, headers=auth)
        assert response.status_code == 200 and response.json()["items"] == []
    # Literal underscore exists in the two Telegram names; it isn't a wildcard.
    assert len(c.get("/api/users?q=alice_", headers=auth).json()["items"]) == 1


def test_order_fill_and_ledger_crosslinks(admin):
    c, auth, _ = admin
    order = c.get("/api/orders/501", headers=auth).json()
    assert order["order"]["user_id"] == 18 and order["order"]["market_id"] == 42
    assert order["fills"][0]["id"] == 705 and order["ledger"][0]["id"] == 987
    fill = c.get("/api/fills/705", headers=auth).json()["fill"]
    assert fill["maker_order_id"] == 501 and fill["taker_user_id"] == 24
    assert (
        c.get("/api/fills?user_id=24&market_id=42&order_id=502", headers=auth).json()[
            "items"
        ][0]["id"]
        == 705
    )
    assert c.get("/api/ledger/987", headers=auth).json()["order_id"] == 501
    assert c.get("/api/ledger?order_id=502", headers=auth).json()["items"] == []
    assert (
        c.get("/api/ledger?order_id=501", headers=auth).json()["items"][0]["id"] == 987
    )
    assert c.get("/api/settlements?user_id=18", headers=auth).json()["items"] == []


def test_every_data_route_and_assets_require_auth(admin):
    c, auth, _ = admin
    for path in (
        "/api/users/18",
        "/api/events/42",
        "/api/orders/501",
        "/api/fills",
        "/api/fills/705",
        "/api/ledger/987",
        "/api/settlements",
        "/api/monitoring",
        "/assets/style.css",
        "/assets/dot.svg",
    ):
        assert c.get(path).status_code == 401
        assert c.get(path, headers=auth).status_code == 200


def test_host_proxy_and_cross_site_guards(admin):
    c, auth, _ = admin
    assert (
        c.get("/api/users", headers={**auth, "Host": "evil.example"}).status_code == 400
    )
    for extra in (
        {"X-Forwarded-For": "127.0.0.1"},
        {"Forwarded": "for=127.0.0.1"},
        {"Sec-Fetch-Site": "cross-site"},
    ):
        assert c.get("/api/users", headers={**auth, **extra}).status_code == 403


def test_rate_limit_and_malformed_auth(admin):
    c, auth, _ = admin
    for i in range(10):
        assert (
            c.get("/api/users", headers={"Authorization": "Basic !!!"}).status_code
            == 401
        )
    response = c.get("/api/users", headers=auth)
    assert response.status_code == 429 and response.headers["Retry-After"] == "600"


def test_no_financial_or_moderation_action_can_be_called(admin):
    c, auth, _ = admin
    for path in (
        "/api/users/18/balance",
        "/api/events/42/approve",
        "/api/orders/501/cancel",
        "/api/payout",
        "/markets/42/resolve",
        "/admin/users/18",
    ):
        assert c.post(path, headers=auth, json={"amount": "100"}).status_code == 405
        assert c.get(path, headers=auth).status_code == 404


def test_native_sqlite_rejects_all_writes_and_file_is_unchanged(admin, fixture_db):
    c, auth, engine = admin
    before = hashlib.sha256(fixture_db.read_bytes()).digest()
    for path in (
        "/api/overview",
        "/api/users/18",
        "/api/events/42",
        "/api/orders/501",
        "/api/fills/705",
        "/api/ledger/987",
    ):
        assert c.get(path, headers=auth).status_code == 200
    connection = engine.raw_connection()
    try:
        for sql in (
            "DELETE FROM users",
            "CREATE TABLE forbidden (id INTEGER)",
            "CREATE TEMP TABLE forbidden (id INTEGER)",
            "INSERT INTO users (id) VALUES (99)",
        ):
            with pytest.raises(sqlite3.OperationalError):
                connection.cursor().execute(sql)
    finally:
        connection.close()
    assert hashlib.sha256(fixture_db.read_bytes()).digest() == before


def test_missing_database_never_created_and_production_configuration_refused(tmp_path):
    missing = tmp_path / "missing-test.sqlite"
    with pytest.raises(FileNotFoundError):
        read_only_engine("sqlite:///" + str(missing))
    assert not missing.exists()
    for url in (
        "postgresql://user:pass@production.example/test",
        "postgresql://user:pass@localhost/betton",
        "postgresql://user:pass@localhost/betton_test?options=-cdefault_transaction_read_only=off",
        "mysql://localhost/test",
        "sqlite:///:memory:",
    ):
        with pytest.raises(RuntimeError):
            read_only_engine(url)


def test_startup_rejects_writable_engine_and_invalid_credentials(
    fixture_db, monkeypatch
):
    with pytest.raises(RuntimeError):
        create_app(
            engine=create_engine("sqlite://"),
            username="owner",
            password_hash=make_password_hash("long-unique-secret-password"),
        )
    with pytest.raises(RuntimeError):
        create_app(username="owner", password_hash="invalid$hash")
    monkeypatch.setenv("BETTON_ADMIN_DATABASE_URL", "sqlite:///" + str(fixture_db))
    monkeypatch.delenv("BETTON_ADMIN_ENVIRONMENT", raising=False)
    with pytest.raises(RuntimeError, match="ENVIRONMENT=test"):
        create_app(
            username="owner",
            password_hash=make_password_hash("long-unique-secret-password"),
        )


def test_import_does_not_load_business_app_or_database():
    result = subprocess.run(
        [
            sys.executable,
            "-c",
            "import admin_center.app, sys; assert 'app.database' not in sys.modules; assert 'app.main' not in sys.modules; assert 'app.models' not in sys.modules",
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stderr


def test_missing_schema_is_explicit_not_empty_or_healthy(tmp_path):
    location = tmp_path / "empty-test.sqlite"
    sqlite3.connect(location).close()
    engine = read_only_engine("sqlite:///" + str(location))
    with TestClient(
        create_app(
            engine=engine,
            username="owner",
            password_hash=make_password_hash("long-unique-secret-password"),
            allow_testclient=True,
        )
    ) as c:
        response = c.get("/api/users", auth=("owner", "long-unique-secret-password"))
        assert response.status_code == 503
    engine.dispose()


def test_precision_preserves_integer_nano_and_does_not_export_secrets(
    admin, fixture_db
):
    connection = sqlite3.connect(fixture_db)
    connection.execute(
        "UPDATE users SET balance_nano=? WHERE id=18", (9223372036854775807,)
    )
    connection.execute("ALTER TABLE markets ADD COLUMN share_token TEXT")
    connection.execute("UPDATE markets SET share_token='PRIVATE-SHARE-TOKEN'")
    connection.commit()
    connection.close()
    c, auth, _ = admin
    assert (
        c.get("/api/users/18", headers=auth).json()["user"]["balance_nano"]
        == "9223372036854775807"
    )
    assert "PRIVATE-SHARE-TOKEN" not in c.get("/api/events/42", headers=auth).text


def test_id_bounds_and_pagination(admin):
    c, auth, _ = admin
    for path in (
        "/api/users/0",
        "/api/events/-1",
        "/api/orders/" + ("9" * 64),
        "/api/ledger?user_id=" + ("9" * 64),
        "/api/fills?limit=101",
    ):
        assert c.get(path, headers=auth).status_code == 422
    assert len(c.get("/api/users?limit=1&offset=1", headers=auth).json()["items"]) == 1
    assert c.get("/api/users?offset=100", headers=auth).json()["items"] == []
