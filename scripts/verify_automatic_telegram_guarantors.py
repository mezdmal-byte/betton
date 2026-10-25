"""Create six synthetic negotiations in the verified local Telegram simulator.

Uses the normal HMAC HTTP contract; never calls Telegram messaging/webhook APIs.
Requires the marked simulator on loopback:8882. Credentials remain local.
"""
import asyncio
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import json
import os
from pathlib import Path
import sqlite3
import time
from urllib.parse import urlencode
from uuid import uuid4

import httpx
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parents[1]


async def main():
    runtime = ROOT / '.ux-preview/telegram-simulation-runtime'
    record = json.loads((runtime / 'verification.json').read_text())
    assert record['test_bot'].lower() == 'sobakapesbot'
    database = Path(record['database'])
    assert database.resolve().is_relative_to((ROOT / '.ux-preview').resolve())
    assert database.name.startswith('betton-test-')
    with sqlite3.connect(database.as_uri() + '?mode=ro', uri=True) as db:
        assert db.execute('select version from demo_environment where id=1').fetchone() == (1,)
        actors = db.execute('select a.user_id,a.strategy from demo_guarantor_actors a join users u on u.id=a.user_id where u.telegram_id is null').fetchall()
        assert len(actors) == 6
    config = Path(os.environ.get('BETTON_TELEGRAM_TEST_CONFIG',
        str(Path.home() / 'betton/.local-preserve/pr22-d83d355/.telegram-test/credentials.env')))
    cfg = dotenv_values(config)
    identity = json.loads(config.with_name('verified-identities.json').read_text())
    assert cfg['BOT_TOKEN'].split(':')[0] not in identity['protected_production_bot_ids']

    def headers():
        fields = {'auth_date':str(int(time.time())), 'query_id':'auto-demo-check',
                  'user':json.dumps({'id':int(cfg['ADMIN_TELEGRAM_IDS']), 'first_name':'Test'}, separators=(',', ':'))}
        secret = hmac.new(b'WebAppData', cfg['BOT_TOKEN'].encode(), hashlib.sha256).digest()
        check = '\n'.join(f'{key}={value}' for key,value in sorted(fields.items()))
        fields['hash'] = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
        return {'Authorization':'tma ' + urlencode(fields)}

    async with httpx.AsyncClient(base_url='http://127.0.0.1:8882', timeout=15) as client:
        async def api(path, body=None):
            response = await client.request('POST' if body is not None else 'GET', path, headers=headers(), json=body)
            assert response.status_code == 200, f'Unexpected HTTP {response.status_code}: {path}'
            return response.json()
        assert (await api('/ready'))['schema_revision'] == 4
        before = await api('/auth/telegram', {})
        expected = {'fixed':('fixed','5','0'), 'percent':('percent','0','3'),
                    'combined':('combined','2','3'), 'percent_minimum':('percent_minimum','20','3'),
                    'negotiator':('percent','0','4'), 'flexible':('percent','0','1.5')}

        async def check_actor(actor_id, strategy):
            ends = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
            body = {'request_id':str(uuid4()), 'event_type':'guarantor', 'guarantor_id':actor_id,
                    'question':'ТЕСТ: автоматические переговоры ' + strategy + ' ' + uuid4().hex[:6] + '?',
                    'outcomes':['Да','Нет'], 'rules':'Итоговый протокол подтверждает каждый исход.',
                    'resolution_method':'Проверить указанный тестовый протокол.', 'close_at':ends, 'ends_at':ends}
            event = await api('/ux-v3/events', body)
            mid = event['id']
            assert (await api('/ux-v3/events', body)) == event
            acknowledged = None
            clarified = False
            started = time.monotonic()
            while time.monotonic() - started < 65:
                case = await api(f'/markets/{mid}/guarantor')
                if case['state'] == 'review' and acknowledged is None:
                    acknowledged = time.monotonic() - started
                    assert acknowledged < 60
                if strategy == 'negotiator' and not clarified and 'уточните' in json.dumps(case, ensure_ascii=False):
                    assert not case['reward'].get('accepted_by')
                    await api(f'/markets/{mid}/guarantor', {'action':'message', 'text':'Тестовый итоговый протокол подтверждает оба критерия из правил.'})
                    clarified = True
                if case.get('reward', {}).get('accepted_by'):
                    reward = case['reward']
                    assert (reward['mode'], reward['fixed_ton'], reward['percent']) == expected[strategy]
                    assert before['id'] not in reward['accepted_by']
                    assert case['state'] == 'review'
                    # Re-login/re-fetch represents Mini App reload, without a worker restart.
                    await api('/auth/telegram', {})
                    reloaded = await api(f'/markets/{mid}/guarantor')
                    assert reloaded['revision'] == case['revision']
                    audit = await api(f'/markets/{mid}/p2p-reconciliation')
                    assert audit['fully_verified']
                    return {'strategy':strategy, 'market_id':mid, 'first_reply_seconds':round(acknowledged, 1),
                            'reward_mode':reward['mode'], 'creator_not_accepted':True, 'ledger_verified':True}
                await asyncio.sleep(1)
            raise AssertionError('No automatic tariff: ' + strategy)

        results = await asyncio.gather(*(check_actor(*actor) for actor in actors))
        after = await api('/auth/telegram', {})
        assert before['balance'] == after['balance']
        with sqlite3.connect(database.as_uri() + '?mode=ro', uri=True) as db:
            for result in results:
                mid = result['market_id']
                assert db.execute('select count(*) from demo_guarantor_runs where market_id=?', (mid,)).fetchone()[0] == 1
                assert db.execute("select count(*) from guarantor_messages where market_id=? and kind='reward'", (mid,)).fetchone()[0] == 1
        output = {'six_strategies':results, 'balance_unchanged':True, 'native_telegram_webview_verified':False}
        (runtime / 'automatic-guarantors-verification.json').write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')
        print(json.dumps(output, ensure_ascii=False))


if __name__ == '__main__':
    asyncio.run(main())
