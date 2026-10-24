import json
from decimal import Decimal

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.exc import DBAPIError

from app.money_preflight import MAX_INT64, convert_candidate, inspect_money, main, readonly_connection


@pytest.fixture
def money_db(tmp_path):
    url = 'sqlite:///' + str(tmp_path / 'money.db')
    engine = create_engine(url)
    with engine.begin() as conn:
        conn.exec_driver_sql('PRAGMA journal_mode=WAL')
        conn.exec_driver_sql('CREATE TABLE users (id INTEGER PRIMARY KEY, balance FLOAT)')
        conn.exec_driver_sql('CREATE TABLE markets (id INTEGER PRIMARY KEY, mechanism TEXT, status TEXT, pot FLOAT, lock_ton FLOAT)')
        conn.exec_driver_sql('CREATE TABLE p2p_orders (id INTEGER PRIMARY KEY, market_id INTEGER, amount BIGINT, filled BIGINT, remaining BIGINT, refunded BIGINT)')
        conn.exec_driver_sql('CREATE TABLE p2p_fills (id INTEGER PRIMARY KEY, market_id INTEGER, maker_order_id INTEGER, taker_order_id INTEGER, maker_stake BIGINT, taker_stake BIGINT)')
        conn.exec_driver_sql('INSERT INTO users VALUES (1, 900), (2, 950)')
        conn.exec_driver_sql("INSERT INTO markets VALUES (1, 'p2p', 'open', 100, 0), (2, 'lmsr', 'open', 50, 50)")
        conn.exec_driver_sql('INSERT INTO p2p_orders VALUES (1, 1, 100000000000, 50000000000, 50000000000, 0), (2, 1, 50000000000, 50000000000, 0, 0)')
        conn.exec_driver_sql('INSERT INTO p2p_fills VALUES (1, 1, 1, 2, 50000000000, 50000000000)')
    yield url, engine
    engine.dispose()


@pytest.mark.parametrize('value,kind', [
    (None, 'null_amount'), (-1, 'negative_amount'),
    (float('nan'), 'non_finite_amount'), (float('inf'), 'non_finite_amount'),
    ('bad', 'invalid_amount'), ('9223372036.854775808', 'int64_overflow')])
def test_bad_amount(value, kind):
    with pytest.raises(ValueError, match=kind):
        convert_candidate(value)


def test_exact_boundary_and_rounding():
    assert convert_candidate('9223372036.854775807') == (MAX_INT64, Decimal(0))
    assert convert_candidate('0.0000000015') == (2, Decimal('0.0000000005'))
    nano, delta = convert_candidate(0.1 + 0.2)
    assert nano == 300000000 and delta == Decimal('-0.00000000000000004')


def test_partial_fill_inventory_and_readonly_snapshot(money_db):
    url, engine = money_db
    with readonly_connection(url) as conn:
        report = inspect_money(conn)
        assert report['amounts_convertible_without_rounding'] is True
        assert report['totals']['users.balance']['proposed_nano'] == '1850000000000'
        assert report['totals']['p2p_order_reserve']['nano'] == '50000000000'
        assert report['totals']['markets.pot']['proposed_nano'] == '150000000000'
        with engine.begin() as writer:
            writer.execute(text('UPDATE users SET balance=901 WHERE id=1'))
        assert inspect_money(conn)['totals'] == report['totals']
        with pytest.raises(DBAPIError):
            conn.execute(text('UPDATE users SET balance=0'))
    with readonly_connection(url) as conn:
        assert inspect_money(conn)['totals']['users.balance']['proposed_nano'] == '1851000000000'


def test_rounding_is_reported_and_not_applied(money_db, monkeypatch, capsys):
    url, engine = money_db
    with engine.begin() as conn:
        conn.execute(text('UPDATE users SET balance=:v WHERE id=1'), {'v': 0.1 + 0.2})
    monkeypatch.setenv('DATABASE_URL', url)
    assert main() == 1
    report = json.loads(capsys.readouterr().out)
    assert report['rounding'][0]['proposed_nano'] == '300000000'
    with engine.connect() as conn:
        assert conn.execute(text('SELECT balance FROM users WHERE id=1')).scalar_one() == 0.1 + 0.2


@pytest.mark.parametrize('sql,kind', [
    ('UPDATE users SET balance=NULL WHERE id=1', 'null_amount'),
    ('UPDATE markets SET pot=99 WHERE id=1', 'p2p_pot_mismatch'),
    ('UPDATE p2p_orders SET amount=1 WHERE id=1', 'order_amount_identity'),
    ('UPDATE p2p_fills SET maker_order_id=999', 'fill_order_mismatch'),
    ("UPDATE markets SET status='closed' WHERE id=1", 'reserve_after_close'),
])
def test_inconsistency_blocks_inventory(money_db, sql, kind):
    url, engine = money_db
    with engine.begin() as conn:
        conn.execute(text(sql))
    with readonly_connection(url) as conn:
        report = inspect_money(conn)
    assert not report['amounts_convertible_without_rounding']
    assert kind in {i['kind'] for i in report['issues']}


def test_old_schema_is_reported_not_migrated(tmp_path):
    url = 'sqlite:///' + str(tmp_path / 'old.db')
    engine = create_engine(url)
    with engine.begin() as conn:
        conn.exec_driver_sql('CREATE TABLE users (id INTEGER PRIMARY KEY, balance FLOAT)')
    with readonly_connection(url) as conn:
        report = inspect_money(conn)
        assert report['issues'][0]['kind'] == 'missing_schema'
        assert conn.exec_driver_sql('SELECT name FROM sqlite_master WHERE type="table"').all() == [('users',)]
    engine.dispose()


def test_missing_file_is_not_created(tmp_path):
    path = tmp_path / 'absent.db'
    with pytest.raises(FileNotFoundError):
        with readonly_connection('sqlite:///' + str(path)):
            pass
    assert not path.exists()


def test_cli_requires_explicit_url_and_redacts_errors(monkeypatch, capsys):
    monkeypatch.delenv('DATABASE_URL', raising=False)
    assert main() == 2
    capsys.readouterr()
    monkeypatch.setenv('DATABASE_URL', 'unsupported://secret:password@example/db')
    assert main() == 2
    captured = capsys.readouterr()
    assert not captured.out and 'password' not in captured.err and 'secret' not in captured.err
