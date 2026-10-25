import asyncio
import hashlib

import httpx
import pytest

from app.telegram_auth import validate_init_data
from scripts.telegram_simulation_checks import signed_owner_headers, verify_runtime
from tests.auth_helpers import TEST_BOT_TOKEN


def test_launcher_signs_normal_telegram_hmac():
    headers = signed_owner_headers(TEST_BOT_TOKEN, 1001)
    assert validate_init_data(headers['Authorization'][4:], TEST_BOT_TOKEN)['id'] == 1001


@pytest.mark.parametrize('failure', [None, 'foreign_database', 'unapproved', 'worker_stopped',
    'missing_actor', 'directory_empty', 'directory_unavailable', 'unauthorized', 'old_frontend'])
def test_ready_requires_actual_catalog_database_worker_and_build(failure):
    html = b'<html>test frontend</html>'
    digest = hashlib.sha256(html).hexdigest()
    info = {'identity':'test-generation', 'actors':6, 'approved_profiles':6,
            'available_actors':6, 'frontend_sha256':digest, 'actor_ids':list(range(1,7))}
    directory = [{'user_id':uid, 'status':'approved', 'available':True} for uid in range(1,7)]
    if failure == 'foreign_database': info['identity'] = 'other-generation'
    if failure == 'unapproved': info['approved_profiles'] = 5
    if failure == 'worker_stopped': info['available_actors'] = 0
    if failure == 'missing_actor': info['actor_ids'] = [1,2,3,4,5]
    if failure == 'directory_empty': directory = []
    if failure == 'directory_unavailable': directory[0]['available'] = False

    def serve(request):
        if request.url.path == '/ready': return httpx.Response(200,json={'schema_revision':4})
        if request.url.path == '/simulation/status': return httpx.Response(200,json=info)
        if request.url.path == '/guarantors':
            return httpx.Response(401 if failure == 'unauthorized' else 200,json=directory)
        return httpx.Response(200,content=b'old build' if failure == 'old_frontend' else html)

    async def check():
        async with httpx.AsyncClient(transport=httpx.MockTransport(serve)) as client:
            return await verify_runtime(client,'https://sim.invalid',{'Authorization':'tma test'},'test-generation',digest)
    if failure:
        with pytest.raises(RuntimeError): asyncio.run(check())
    else:
        assert asyncio.run(check()) == info
