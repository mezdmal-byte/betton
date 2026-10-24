import pytest
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from app.database import enforce_sqlite_foreign_keys, assert_sqlite_foreign_keys


def test_each_connection_enforces_foreign_keys_and_retains_valid_data(tmp_path):
    engine = create_engine('sqlite:///' + str(tmp_path / 'relations.db'))
    enforce_sqlite_foreign_keys(engine)
    with engine.begin() as conn:
        conn.exec_driver_sql('CREATE TABLE parent(id INTEGER PRIMARY KEY)')
        conn.exec_driver_sql('CREATE TABLE child(id INTEGER PRIMARY KEY, parent_id INTEGER REFERENCES parent(id))')
        conn.exec_driver_sql('INSERT INTO parent VALUES(1)')
        conn.exec_driver_sql('INSERT INTO child VALUES(1,1)')
    engine.dispose()  # A fresh pooled connection must enforce FK too.
    with engine.begin() as conn:
        assert conn.exec_driver_sql('PRAGMA foreign_keys').scalar_one() == 1
        with pytest.raises(IntegrityError):
            conn.exec_driver_sql('INSERT INTO child VALUES(2,999)')
        with pytest.raises(IntegrityError):
            conn.exec_driver_sql('DELETE FROM parent WHERE id=1')
        assert conn.exec_driver_sql('SELECT COUNT(*) FROM child').scalar_one() == 1
    assert_sqlite_foreign_keys(engine)
    engine.dispose()


def test_preflight_refuses_old_orphans_without_deleting_them(tmp_path):
    url = 'sqlite:///' + str(tmp_path / 'old.db')
    old = create_engine(url)
    with old.begin() as conn:
        conn.exec_driver_sql('CREATE TABLE parent(id INTEGER PRIMARY KEY)')
        conn.exec_driver_sql('CREATE TABLE child(id INTEGER PRIMARY KEY, parent_id INTEGER REFERENCES parent(id))')
        conn.exec_driver_sql('INSERT INTO child VALUES(1,999)')
    old.dispose()
    engine = create_engine(url)
    enforce_sqlite_foreign_keys(engine)
    with pytest.raises(RuntimeError, match='foreign key violations'):
        assert_sqlite_foreign_keys(engine)
    with engine.connect() as conn:
        assert conn.exec_driver_sql('SELECT parent_id FROM child').scalar_one() == 999
    engine.dispose()
