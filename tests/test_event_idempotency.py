from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
import uuid
import pytest
from sqlalchemy import text
from app.database import SessionLocal, engine
from app.models import Market, EventConfigV3, EventRevisionV3, GuarantorCase, GuarantorMessage, AppNotification
from app.services import guarantors as gs, market_service as ms
from tests.test_guarantors import setup_case
from tests.test_markets_api import _login
from tests.test_ux_v3_events import payload


@pytest.mark.parametrize('kind', ['public', 'private', 'guarantor'])
def test_atomic_replay_conflict_and_single_invitation(client, monkeypatch, kind):
    _, _, author, headers, guarantor, _, _, _, _ = setup_case(client, monkeypatch)
    body = payload(kind, guarantor['id'] if kind == 'guarantor' else None)
    first = client.post('/ux-v3/events', headers=headers, json=body)
    assert first.status_code == 200, first.text
    mid = first.json()['id']
    # New DB connection / disposed pool simulates server process memory loss.
    engine.dispose()
    replay = client.post('/ux-v3/events', headers=headers, json=body)
    assert replay.json() == first.json()
    changed = {**body, 'question': 'Совсем другое проверяемое событие'}
    assert client.post('/ux-v3/events', headers=headers, json=changed).status_code == 409
    monkeypatch.setattr(ms, 'utcnow', lambda: ms.as_utc(ms.datetime.fromisoformat(body['ends_at'])) + timedelta(days=1))
    assert client.post('/ux-v3/events', headers=headers, json=body).json() == first.json()
    with SessionLocal() as db:
        assert db.query(EventConfigV3).filter_by(market_id=mid).count() == 1
        assert db.query(EventRevisionV3).filter_by(market_id=mid).count() == 1
        assert db.query(GuarantorCase).filter_by(market_id=mid).count() == (kind == 'guarantor')
        if kind == 'guarantor':
            assert db.query(GuarantorMessage).filter_by(market_id=mid, kind='terms').count() == 1
            assert db.query(AppNotification).filter_by(market_id=mid, user_id=guarantor['id']).count() == 1


def test_concurrent_duplicate_and_user_scoping(client):
    _, headers = _login(client)
    body = payload('private')
    with ThreadPoolExecutor(2) as pool:
        results = list(pool.map(lambda _: client.post('/ux-v3/events', headers=headers, json=body), range(2)))
    assert all(r.status_code == 200 for r in results), [r.text for r in results]
    assert results[0].json() == results[1].json()
    _, other = _login(client)
    assert client.post('/ux-v3/events', headers=other, json=body).json()['id'] != results[0].json()['id']


def test_failure_after_invitation_rolls_back_receipt_and_all_related_rows(client, monkeypatch):
    _, _, _, headers, guarantor, _, _, _, _ = setup_case(client, monkeypatch)
    body = payload('guarantor', guarantor['id'])
    # Use ORM table names so the assertion follows actual model declarations.
    tables = [m.__tablename__ for m in [Market, EventConfigV3, EventRevisionV3, GuarantorCase, GuarantorMessage, AppNotification]] + ['event_creation_intents']
    with SessionLocal() as db:
        before = {t: db.execute(text(f'SELECT count(*) FROM {t}')).scalar_one() for t in tables}
    original = gs.create_case
    def fail(*args):
        original(*args)
        args[0].flush()
        raise RuntimeError('injected failure before commit')
    monkeypatch.setattr(gs, 'create_case', fail)
    with pytest.raises(RuntimeError, match='injected failure'):
        client.post('/ux-v3/events', headers=headers, json=body)
    with SessionLocal() as db:
        assert {t: db.execute(text(f'SELECT count(*) FROM {t}')).scalar_one() for t in tables} == before
    monkeypatch.setattr(gs, 'create_case', original)
    first = client.post('/ux-v3/events', headers=headers, json=body)
    assert first.status_code == 200
    assert client.post('/ux-v3/events', headers=headers, json=body).json() == first.json()


def test_request_id_required_and_canonical_timezone(client):
    _, h = _login(client)
    body = payload('private')
    assert client.post('/ux-v3/events', headers=h, json={k:v for k,v in body.items() if k != 'request_id'}).status_code == 400
    first = client.post('/ux-v3/events', headers=h, json=body)
    assert first.status_code == 200
    from datetime import datetime, timezone
    equivalent = {**body, 'close_at': datetime.fromisoformat(body['close_at']).astimezone(timezone(timedelta(hours=3))).isoformat()}
    assert client.post('/ux-v3/events', headers=h, json=equivalent).json() == first.json()


def test_lost_response_replayed_after_real_server_process_restart(client):
    import json
    import subprocess
    import sys
    _, headers = _login(client)
    body = payload('private')
    original = client.post('/ux-v3/events', headers=headers, json=body)
    assert original.status_code == 200
    code = '''
import json,sys
from fastapi.testclient import TestClient
from app.main import app
request=json.load(sys.stdin)
with TestClient(app) as client:
    result=client.post('/ux-v3/events',headers=request['headers'],json=request['body'])
    print(json.dumps({'status':result.status_code,'body':result.json()}))
'''
    process = subprocess.run([sys.executable, '-c', code], input=json.dumps({'headers': headers, 'body': body}), text=True, capture_output=True, timeout=30)
    assert process.returncode == 0, process.stderr
    restarted = json.loads(process.stdout)
    assert restarted == {'status': 200, 'body': original.json()}
