from concurrent.futures import ThreadPoolExecutor
import uuid
import pytest
from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.exc import IntegrityError, DataError
from app.database import engine, enforce_sqlite_foreign_keys
from app.migrations import upgrade, assert_schema_ready, CURRENT_REVISION
from tests.auth_helpers import make_init_data


def test_startup_check_never_creates_schema_and_upgrade_is_serialized(tmp_path):
    db = create_engine('sqlite:///' + str(tmp_path / 'schema.db'))
    enforce_sqlite_foreign_keys(db)
    with pytest.raises(RuntimeError, match='Schema upgrade required'):
        assert_schema_ready(db)
    assert inspect(db).get_table_names() == []
    with ThreadPoolExecutor(2) as pool:
        list(pool.map(lambda _: upgrade(db), range(2)))
    statements = []
    def record(conn, cursor, statement, parameters, context, executemany):
        statements.append(statement)
    event.listen(db, 'before_cursor_execute', record)
    assert_schema_ready(db)
    assert not any(s.lstrip().upper().startswith(('CREATE', 'ALTER', 'UPDATE', 'INSERT', 'DELETE')) for s in statements)
    with db.begin() as conn:
        conn.exec_driver_sql('UPDATE betton_schema_version SET revision=999')
    with pytest.raises(RuntimeError, match='newer'):
        upgrade(db)
    db.dispose()


def test_large_telegram_id_authorization_and_profile_update(client):
    uid = 2**40 + 123456
    headers = {'Authorization': 'tma ' + make_init_data(uid, username='large_id_test')}
    first = client.post('/auth/telegram', headers=headers)
    assert first.status_code == 200
    changed = {'Authorization': 'tma ' + make_init_data(uid, username='large_id_renamed')}
    second = client.post('/auth/telegram', headers=changed)
    assert second.status_code == 200
    assert second.json()['id'] == first.json()['id']
    assert second.json()['telegram_id'] == uid
    assert second.json()['telegram_username'] == 'large_id_renamed'


@pytest.mark.skipif(engine.dialect.name != 'postgresql', reason='actual PostgreSQL required')
def test_pg_populated_baseline_bigint_preserves_fk_unique_and_transaction_rollback():
    from app.migrations.baseline import upgrade as baseline
    schema = 'migration_test_' + uuid.uuid4().hex
    with engine.begin() as conn:
        conn.exec_driver_sql(f'CREATE SCHEMA {schema}')
    isolated = create_engine(engine.url, connect_args={'options': '-c search_path=' + schema})
    try:
        with isolated.begin() as conn:
            baseline(conn)
            conn.exec_driver_sql("INSERT INTO users(id,telegram_id,username,balance_nano) VALUES (1,123456,'original',1000000000)")
            conn.exec_driver_sql('CREATE TABLE migration_child (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id))')
            conn.exec_driver_sql('INSERT INTO migration_child VALUES(1,1)')
        with ThreadPoolExecutor(2) as pool:
            list(pool.map(lambda _: upgrade(isolated), range(2)))
        upgrade(isolated)
        assert_schema_ready(isolated)
        with isolated.begin() as conn:
            assert str(inspect(conn).get_columns('users')[1]['type']) == 'BIGINT'
            conn.exec_driver_sql("INSERT INTO users(id,telegram_id,username,balance_nano) VALUES (2,4294967303,'large',1000000000)")
            conn.exec_driver_sql('INSERT INTO migration_child VALUES(2,2)')
        with pytest.raises(IntegrityError):
            with isolated.begin() as conn:
                conn.exec_driver_sql("INSERT INTO users(id,telegram_id,username,balance_nano) VALUES (3,123456,'duplicate',1000000000)")
        # An error after a narrowing attempt rolls back DDL as well as data.
        with pytest.raises(DataError):
            with isolated.begin() as conn:
                conn.exec_driver_sql('ALTER TABLE users ALTER COLUMN telegram_id TYPE INTEGER USING telegram_id::integer')
        with isolated.connect() as conn:
            assert conn.exec_driver_sql('SELECT count(*) FROM migration_child c JOIN users u ON u.id=c.user_id').scalar_one() == 2
            assert conn.exec_driver_sql('SELECT telegram_id FROM users WHERE id=1').scalar_one() == 123456
            assert conn.exec_driver_sql('SELECT revision FROM betton_schema_version').scalar_one() == CURRENT_REVISION
    finally:
        isolated.dispose()
        with engine.begin() as conn:
            conn.exec_driver_sql(f'DROP SCHEMA {schema} CASCADE')
