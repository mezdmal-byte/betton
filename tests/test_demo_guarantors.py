from datetime import timedelta

import pytest

from app.config import settings
from app.database import SessionLocal
from app.models import (DemoEnvironment, DemoGuarantorActor, DemoGuarantorRun, EventConfigV3,
                        GuarantorCase, GuarantorMessage, User)
from app.services import demo_guarantors as demo, guarantors as gs
from tests.test_guarantors import call
from tests.test_markets_api import _admin, _login
from tests.test_ux_v3_events import create, payload


def enable(monkeypatch):
    monkeypatch.setattr(settings, 'betton_environment', 'test')
    monkeypatch.setattr(settings, 'betton_demo_automation', True)
    monkeypatch.setattr(demo, 'process_due', lambda: None)
    # Test harness owns the disposable database. Production CLI must bootstrap it
    # while empty, before the first Telegram login (tested separately below).
    with SessionLocal() as db:
        if not db.get(DemoEnvironment, 1):
            db.add(DemoEnvironment(id=1, version=1))
            db.commit()


def advance(monkeypatch, seconds=16):
    current = gs.now() + timedelta(seconds=seconds)
    monkeypatch.setattr(gs, 'now', lambda: current)
    with SessionLocal() as db:
        demo.tick(db)


def test_admin_and_environment_gates_no_auth_override(client, monkeypatch):
    admin, ah = _admin(client, monkeypatch)
    ordinary, headers = _login(client)
    assert client.post('/demo/guarantors/install', headers=ah).status_code == 403
    enable(monkeypatch)
    assert client.post('/demo/guarantors/install', headers=headers).status_code == 403
    assert client.post('/demo/guarantors/install').status_code == 401
    monkeypatch.setattr(settings, 'betton_environment', 'production')
    assert client.post('/demo/guarantors/install', headers=ah).status_code == 403
    monkeypatch.setattr(settings, 'betton_environment', 'test')
    original = settings.database_url
    monkeypatch.setattr(settings, 'database_url', 'sqlite:///betton.db')
    assert client.post('/demo/guarantors/install', headers=ah).status_code == 403
    monkeypatch.setattr(settings, 'database_url', original)
    actors = client.post('/demo/guarantors/install', headers=ah)
    assert actors.status_code == 200, actors.text
    assert len(actors.json()) == 6
    assert client.post('/demo/guarantors/install', headers=ah).json() == actors.json()
    with SessionLocal() as db:
        for entry in actors.json():
            user = db.get(User, entry['user_id'])
            assert user.telegram_id is None and user.balance_nano == 0
            assert user.display_name.startswith('ТЕСТ · ')


@pytest.mark.parametrize('strategy', list(demo.STRATEGIES))
def test_six_strategies_negotiate_real_revisions_and_open_only_on_creator_confirmation(
    client, monkeypatch, strategy
):
    admin, ah = _admin(client, monkeypatch)
    creator, ch = _login(client)
    enable(monkeypatch)
    actors = client.post('/demo/guarantors/install', headers=ah).json()
    actor = next(row for row in actors if row['strategy'] == strategy)
    mid = create(client, ch, payload('guarantor', actor['user_id']))['id']
    assert client.put(f'/demo/guarantors/events/{mid}', headers=ch, json={}).status_code == 403
    # No allowlist => no automatic action even with the environment enabled.
    advance(monkeypatch)
    with SessionLocal() as db:
        assert db.get(GuarantorCase, mid).state == 'invited'
    result = client.put(f'/demo/guarantors/events/{mid}', headers=ah, json={})
    assert result.status_code == 200, result.text
    with SessionLocal() as db:
        demo.tick(db)
        assert db.get(GuarantorCase, mid).state == 'invited'  # controlled delay
    advance(monkeypatch)
    advance(monkeypatch)
    if strategy == 'negotiator':
        with SessionLocal() as db:
            assert not db.get(EventConfigV3, mid).reward
        assert call(client, mid, ch, 'message', text='Источник — итоговый протокол, критерии по каждому исходу указаны в правилах.').status_code == 200
        advance(monkeypatch)
    with SessionLocal() as db:
        config, case = db.get(EventConfigV3, mid), db.get(GuarantorCase, mid)
        assert case.state == 'review'
        assert config.reward['mode'] == demo.STRATEGIES[strategy][1]
        assert config.reward['accepted_by'] == [actor['user_id']]
        revision = case.revision
        assert db.query(GuarantorMessage).filter_by(market_id=mid, kind='reward').count() == 1
    # The robot never confirms on behalf of the creator.
    assert call(client, mid, ch, 'confirm', revision=revision).status_code == 200
    advance(monkeypatch)
    with SessionLocal() as db:
        assert db.get(GuarantorCase, mid).state == 'collecting'
        assert db.get(EventConfigV3, mid).reward['agreed_revision'] == revision


def test_percent_robot_counteroffers_then_accepts_new_revision(client, monkeypatch):
    admin, ah = _admin(client, monkeypatch)
    creator, ch = _login(client)
    enable(monkeypatch)
    actors = client.post('/demo/guarantors/install', headers=ah).json()
    actor = next(row for row in actors if row['strategy'] == 'percent')
    mid = create(client, ch, payload('guarantor', actor['user_id']))['id']
    client.put(f'/demo/guarantors/events/{mid}', headers=ah, json={})
    advance(monkeypatch)
    advance(monkeypatch)
    counter = client.post(f'/ux-v3/events/{mid}/reward', headers=ch,
        json={'expected_revision': 2, 'mode': 'percent', 'percent': '1'})
    assert counter.status_code == 200, counter.text
    advance(monkeypatch)
    with SessionLocal() as db:
        assert db.get(EventConfigV3, mid).reward['percent'] == '2'
        assert db.get(GuarantorCase, mid).revision == 4
    assert client.post(f'/ux-v3/events/{mid}/reward', headers=ch,
        json={'expected_revision': 4, 'mode': 'percent', 'percent': '1.5'}).status_code == 200
    advance(monkeypatch)
    assert call(client, mid, ch, 'confirm', revision=5).status_code == 200
    advance(monkeypatch)
    with SessionLocal() as db:
        assert db.get(GuarantorCase, mid).state == 'collecting'
        assert db.get(EventConfigV3, mid).reward['percent'] == '1.5'


@pytest.mark.parametrize('scenario,expected', [('decline', 'needs_guarantor'),
    ('invite_expiry', 'needs_guarantor'), ('no_response', 'needs_guarantor'),
    ('agreement_error', 'review')])
def test_negative_scenarios_and_disable(client, monkeypatch, scenario, expected):
    admin, ah = _admin(client, monkeypatch)
    creator, ch = _login(client)
    enable(monkeypatch)
    actor = client.post('/demo/guarantors/install', headers=ah).json()[0]
    mid = create(client, ch, payload('guarantor', actor['user_id']))['id']
    assert client.put(f'/demo/guarantors/events/{mid}', headers=ah,
        json={'scenario': scenario}).status_code == 200
    advance(monkeypatch)
    advance(monkeypatch, 65 if scenario in ('invite_expiry', 'no_response') else 16)
    with SessionLocal() as db:
        assert db.get(GuarantorCase, mid).state == expected
        if scenario == 'agreement_error':
            run = db.get(DemoGuarantorRun, mid)
            assert not run.enabled and 'ТЕСТ' in run.last_error
    result = client.put(f'/demo/guarantors/events/{mid}', headers=ah,
        json={'scenario': scenario, 'enabled': False})
    assert result.status_code == 200
    assert not result.json()['enabled']


def test_live_actor_and_legacy_events_cannot_be_adopted(client, monkeypatch):
    from tests.test_guarantors import setup_case
    admin, ah, creator, ch, g, gh, b, bh, legacy = setup_case(client, monkeypatch)
    enable(monkeypatch)
    for mid in [legacy['id'], create(client, ch, payload('guarantor', g['id']))['id']]:
        response = client.put(f'/demo/guarantors/events/{mid}', headers=ah, json={})
        assert response.status_code == 409, response.text


def test_bootstrap_refuses_populated_database(client, monkeypatch):
    _login(client)
    enable(monkeypatch)
    with SessionLocal() as db:
        # Existing populated databases cannot acquire a marker through the CLI.
        marker = db.get(DemoEnvironment, 1)
        db.delete(marker)
        db.commit()
        with pytest.raises(Exception) as error:
            demo.initialize_empty_database(db)
        assert error.value.status_code == 409
        assert db.get(DemoEnvironment, 1) is None
        with pytest.raises(Exception) as error:
            demo.require_demo(db)
        assert error.value.status_code == 403


@pytest.mark.parametrize('scenario', ['winner_0', 'winner_1', 'cancel', 'timeout'])
def test_automated_final_actions_use_real_funds_and_reconciled_journal(client, monkeypatch, scenario):
    from tests.test_p2p import submit
    from app.services import p2p_ledger as ledger
    from app.models import Market
    admin, ah = _admin(client, monkeypatch)
    creator, ch = _login(client)
    bettor, bh = _login(client)
    enable(monkeypatch)
    actor = client.post('/demo/guarantors/install', headers=ah).json()[0]
    event = create(client, ch, payload('guarantor', actor['user_id']))
    mid = event['id']
    bh = {**bh, 'X-Market-Share-Token': event['share_token']}
    assert client.put(f'/demo/guarantors/events/{mid}', headers=ah,
        json={'scenario': scenario}).status_code == 200
    advance(monkeypatch)
    advance(monkeypatch)
    assert call(client, mid, ch, 'confirm', revision=2).status_code == 200
    advance(monkeypatch)
    for headers in (ch, bh):
        assert call(client, mid, headers, 'consent', revision=2).status_code == 200
    assert submit(client, mid, ch, 0, 10, 2).status_code == 200
    assert submit(client, mid, bh, 1, 10, 2).status_code == 200
    with SessionLocal() as db:
        ends = db.get(EventConfigV3, mid).ends_at
        before = db.get(User, actor['user_id']).balance_nano
        assert db.get(GuarantorCase, mid).state == 'active'
    current = ends + timedelta(hours=25 if scenario == 'timeout' else 1)
    monkeypatch.setattr(gs, 'now', lambda: current)
    from app.services import market_service as ms
    monkeypatch.setattr(ms, 'utcnow', lambda: ms.as_utc(current))
    with SessionLocal() as db:
        demo.tick(db)
    with SessionLocal() as db:
        case, market = db.get(GuarantorCase, mid), db.get(Market, mid)
        won = scenario.startswith('winner')
        assert case.state == ('settled' if won else 'cancelled')
        assert market.pot_nano == 0
        assert db.get(User, actor['user_id']).balance_nano == before + (5 * 10**9 if won else 0)
        reconciliation = ledger.reconcile(db, mid)
        assert reconciliation['fully_verified'], reconciliation['discrepancies']
        assert not db.get(DemoGuarantorRun, mid).enabled


def test_worker_failure_rolls_back_action_and_cursor_together(client, monkeypatch):
    admin, ah = _admin(client, monkeypatch)
    creator, ch = _login(client)
    enable(monkeypatch)
    actor = client.post('/demo/guarantors/install', headers=ah).json()[0]
    mid = create(client, ch, payload('guarantor', actor['user_id']))['id']
    client.put(f'/demo/guarantors/events/{mid}', headers=ah, json={})
    original = demo._step

    def fail_after_action(*args):
        original(*args)
        raise RuntimeError('Injected failure after service flush')

    monkeypatch.setattr(demo, '_step', fail_after_action)
    advance(monkeypatch)
    with SessionLocal() as db:
        assert db.get(GuarantorCase, mid).state == 'invited'
        assert db.query(GuarantorMessage).filter_by(market_id=mid, kind='acknowledge').count() == 0
        run = db.get(DemoGuarantorRun, mid)
        assert not run.enabled and run.progress == {'_generation': 1}


def test_two_workers_only_one_negotiation_step(client, monkeypatch):
    from concurrent.futures import ThreadPoolExecutor
    admin, ah = _admin(client, monkeypatch)
    creator, ch = _login(client)
    enable(monkeypatch)
    actor = next(a for a in client.post('/demo/guarantors/install', headers=ah).json() if a['strategy'] == 'negotiator')
    mid = create(client, ch, payload('guarantor', actor['user_id']))['id']
    client.put(f'/demo/guarantors/events/{mid}', headers=ah, json={})
    advance(monkeypatch)
    current = gs.now() + timedelta(seconds=16)
    monkeypatch.setattr(gs, 'now', lambda: current)

    def tick():
        with SessionLocal() as db:
            demo.tick(db)

    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(lambda _: tick(), range(2)))
    with SessionLocal() as db:
        assert db.query(GuarantorMessage).filter_by(market_id=mid, kind='message', user_id=actor['user_id']).count() == 1
        assert db.get(DemoGuarantorRun, mid).progress['asked']
