"""Native local PG role boundary; SQLite has no equivalent LOGIN/GRANT semantics."""
import secrets
from uuid import uuid4

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

from admin_center.store import read_only_engine
from app.database import engine as fixture_engine
from tests.test_admin_center_integration import snapshot
from tests.test_p2p import ready, submit


@pytest.mark.skipif(fixture_engine.dialect.name != 'postgresql', reason='Requires native PostgreSQL LOGIN and table privileges')
def test_native_select_only_role_reads_and_denies_actual_writes(client, monkeypatch):
    url=fixture_engine.url
    # Additional task boundary, independent from conftest: never create roles on
    # a remote server or a database merely containing the word "test" somewhere.
    assert url.host in {'localhost','127.0.0.1','::1'}, 'Only the isolated localhost test server is allowed'
    assert url.database and url.database.startswith(('betton_test','betton_demo','test_')), 'Explicit test database name required'
    assert not url.query, 'Test must not inject PostgreSQL URL options'
    _,_,creator,creator_headers,other,other_headers,mid=ready(client,monkeypatch)
    assert submit(client,mid,creator_headers).status_code==200
    assert submit(client,mid,other_headers,1,50,1.83).status_code==200
    before=snapshot()

    owner_reader=read_only_engine(url.render_as_string(hide_password=False))
    try:
        with pytest.raises(RuntimeError,match='SELECT-only'):
            with owner_reader.connect():pass
    finally:owner_reader.dispose()

    # Separate control engine keeps its AUTOCOMMIT and hidden parameters away
    # from application sessions. All grants are made in this one test database.
    control_engine=create_engine(url,hide_parameters=True,poolclass=NullPool)
    role='betton_admin_read_test_'+uuid4().hex
    assert role.startswith('betton_admin_read_test_') and role.isascii()
    password=secrets.token_urlsafe(32)
    quote=control_engine.dialect.identifier_preparer.quote
    role_sql,db_sql=quote(role),quote(url.database)
    created=False
    reader=None
    try:
        with control_engine.connect().execution_options(isolation_level='AUTOCOMMIT') as control:
            assert control.execute(text('SELECT current_database()')).scalar()==url.database
            capable=control.execute(text('SELECT rolsuper OR rolcreaterole FROM pg_roles WHERE rolname=current_user')).scalar()
            assert capable, 'Local fixture owner needs CREATEROLE to exercise the native role boundary'
            control.execute(text(f'CREATE ROLE {role_sql} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD :password'),{'password':password})
            created=True
            control.exec_driver_sql(f'GRANT CONNECT ON DATABASE {db_sql} TO {role_sql}')
            control.exec_driver_sql(f'GRANT USAGE ON SCHEMA public TO {role_sql}')
            control.exec_driver_sql(f'GRANT SELECT ON ALL TABLES IN SCHEMA public TO {role_sql}')
        reader=read_only_engine(url.set(username=role,password=password).render_as_string(hide_password=False))
        with reader.connect() as conn:
            assert conn.execute(text('SELECT current_user')).scalar()==role
            assert conn.execute(text('SELECT current_database()')).scalar()==url.database
            assert conn.execute(text('SHOW transaction_read_only')).scalar()=='on'
            assert conn.execute(text('SELECT balance_nano FROM users WHERE id=:id'),{'id':creator['id']}).scalar() is not None
            assert conn.execute(text("SELECT has_table_privilege(current_user,'users','UPDATE')")).scalar() is False

        # Use the native DBAPI here so the SQLAlchemy SELECT guard cannot be
        # mistaken for the PostgreSQL protection being tested.
        raw=reader.raw_connection()
        try:
            driver=raw.driver_connection
            cursor=driver.cursor()
            try:
                with pytest.raises(Exception) as readonly:
                    cursor.execute('UPDATE users SET balance_nano=balance_nano WHERE id=%s',(creator['id'],))
                assert getattr(readonly.value,'pgcode',None)=='25006', 'Expected native read-only transaction rejection'
                driver.rollback()
                # Even after explicitly disabling the connection default in
                # this throwaway test connection, native table privileges win.
                cursor.execute('SET default_transaction_read_only=off')
                driver.commit()
                with pytest.raises(Exception) as privileges:
                    cursor.execute('UPDATE users SET balance_nano=balance_nano WHERE id=%s',(creator['id'],))
                assert getattr(privileges.value,'pgcode',None)=='42501', 'Expected native table permission rejection'
                driver.rollback()
            finally:cursor.close()
        finally:raw.close()
        assert snapshot()==before
    finally:
        if reader is not None:reader.dispose()
        if created:
            with control_engine.connect().execution_options(isolation_level='AUTOCOMMIT') as control:
                assert control.execute(text('SELECT current_database()')).scalar()==url.database
                # The role was created by this test and owns no objects. Revoke
                # only its explicit grants; no broad DROP OWNED/CASCADE needed.
                control.exec_driver_sql(f'REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM {role_sql}')
                control.exec_driver_sql(f'REVOKE USAGE ON SCHEMA public FROM {role_sql}')
                control.exec_driver_sql(f'REVOKE CONNECT ON DATABASE {db_sql} FROM {role_sql}')
                control.exec_driver_sql(f'DROP ROLE {role_sql}')
        control_engine.dispose()
