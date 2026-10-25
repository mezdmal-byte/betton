"""Private launcher checks using the normal Telegram HMAC HTTP contract."""
import hashlib
import hmac
import json
import time
from urllib.parse import urlencode


def signed_owner_headers(token, owner):
    fields = {'auth_date': str(int(time.time())), 'user': json.dumps(
        {'id': owner, 'first_name': 'Test'}, separators=(',', ':'))}
    secret = hmac.new(b'WebAppData', token.encode(), hashlib.sha256).digest()
    check = '\n'.join(f'{key}={value}' for key, value in sorted(fields.items()))
    fields['hash'] = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    return {'Authorization': 'tma ' + urlencode(fields)}


async def verify_runtime(client, base, headers, identity, frontend_sha256):
    ready = await client.get(base + '/ready')
    if ready.status_code != 200 or ready.json().get('schema_revision') != 4:
        raise RuntimeError('Test API schema is not ready')
    status = await client.get(base + '/simulation/status', headers=headers)
    if status.status_code != 200:
        raise RuntimeError('Simulation identity check failed')
    info = status.json()
    if (info.get('identity') != identity or info.get('actors') != 6
            or info.get('approved_profiles') != 6 or info.get('available_actors') != 6
            or info.get('frontend_sha256') != frontend_sha256):
        raise RuntimeError('Wrong simulation database, build or inactive demo worker')
    response = await client.get(base + '/guarantors', headers=headers)
    if response.status_code != 200:
        raise RuntimeError('Authenticated guarantor directory failed')
    rows = {row['user_id']: row for row in response.json()}
    if len(info.get('actor_ids', [])) != 6 or any(
            actor not in rows or not rows[actor].get('available')
            or rows[actor].get('status') != 'approved' for actor in info['actor_ids']):
        raise RuntimeError('Six selectable demo guarantors are missing from GET /guarantors')
    frontend = await client.get(base + '/v2/')
    if (frontend.status_code != 200
            or hashlib.sha256(frontend.content).hexdigest() != frontend_sha256):
        raise RuntimeError('Public frontend does not match the running simulation build')
    return info
