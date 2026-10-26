import hashlib
import json
import os
import sqlite3
from pathlib import Path
import subprocess
import sys
from uuid import uuid4

import pytest
from sqlalchemy import create_engine
from app.database import enforce_sqlite_foreign_keys
from app.migrations import upgrade
from scripts.rehearse_release import ALLOWED, rehearse
from scripts import rehearse_release


def fixture_database(path, version=3):
    engine = create_engine('sqlite:///' + str(path))
    enforce_sqlite_foreign_keys(engine); upgrade(engine)
    with engine.begin() as conn:
        conn.exec_driver_sql("INSERT INTO users(id,telegram_id,username,balance,balance_nano) VALUES(1,123456,'private-local-name',100,100000000000)")
        if version == 3:
            conn.exec_driver_sql('DROP TABLE legacy_purchase_intents')
        conn.exec_driver_sql('UPDATE betton_schema_version SET revision=' + str(version))
    engine.dispose()


@pytest.mark.parametrize('version', [3, 4])
def test_copy_rehearsal_preserves_source_repeats_and_restores(tmp_path, version, monkeypatch):
    source = tmp_path / 'original.sqlite'
    fixture_database(source, version)
    before = hashlib.sha256(source.read_bytes()).hexdigest()
    destination = ALLOWED / ('release-test-' + uuid4().hex)
    monkeypatch.setenv('DATABASE_URL', 'postgresql://never-connect.invalid/production')
    monkeypatch.setenv('BOT_TOKEN', 'production-secret-not-to-be-used')
    report = rehearse(source, destination)
    assert report['status'] == 'passed', report
    assert report['revision_before'] == version
    assert report['existing_rows_preserved'] and report['rollback_restored']
    assert before == hashlib.sha256(source.read_bytes()).hexdigest()
    exported = (destination / 'report.json').read_text()
    assert 'private-local-name' not in exported and '123456' not in exported
    assert 'production-secret' not in exported
    with pytest.raises(FileExistsError):
        rehearse(source, destination)


def test_rehearsal_refuses_external_destination_without_creating_it(tmp_path):
    source = tmp_path / 'source.sqlite'; source.write_bytes(b'original')
    destination = tmp_path / 'outside'
    with pytest.raises(ValueError): rehearse(source, destination)
    assert not destination.exists()
    assert source.read_bytes() == b'original'


def test_rehearsal_blocks_unknown_schema_without_upgrading_source(tmp_path):
    source = tmp_path / 'newer.sqlite'
    fixture_database(source, 999)
    before = source.read_bytes()
    report = rehearse(source, ALLOWED / ('release-newer-' + uuid4().hex))
    assert report['status'] == 'blocked'
    assert source.read_bytes() == before


@pytest.mark.parametrize('unsafe', ['dotenv', 'foreign_url'])
def test_internal_worker_cannot_adopt_foreign_configuration(unsafe):
    directory = ALLOWED / ('release-config-' + uuid4().hex)
    directory.mkdir(parents=True)
    (directory / 'rehearsal-marker.json').write_text(json.dumps({'kind':'betton-release-rehearsal','version':1}))
    database = directory / 'betton-test-release.sqlite'
    fixture_database(database)
    before = database.read_bytes()
    environment = {**os.environ, 'DATABASE_URL':'sqlite:///' + database.as_posix()}
    if unsafe == 'dotenv':
        (directory / '.env').write_text('BOT_TOKEN=secret-not-to-be-loaded')
    else:
        environment['DATABASE_URL'] = 'postgresql://never-connect.invalid/production'
    process = subprocess.run([sys.executable, str(Path(rehearse_release.__file__)), '--worker', str(directory)],
                             cwd=directory, env=environment, capture_output=True, text=True, timeout=15)
    assert process.returncode == 2
    assert json.loads(process.stdout)['status'] == 'blocked'
    assert database.read_bytes() == before


def test_rehearsal_blocks_proven_money_corruption_without_fixing_source(tmp_path):
    source = tmp_path / 'corrupt.sqlite'
    fixture_database(source)
    with sqlite3.connect(source) as db:
        db.execute('PRAGMA ignore_check_constraints=ON')
        db.execute('UPDATE users SET balance_nano=-1')
        db.commit()
    before = source.read_bytes()
    destination = ALLOWED / ('release-corrupt-' + uuid4().hex)
    assert rehearse(source, destination)['status'] == 'blocked'
    assert source.read_bytes() == before
    with sqlite3.connect(destination / 'betton-test-release.sqlite') as db:
        assert db.execute('SELECT revision FROM betton_schema_version').fetchone()[0] == 3
