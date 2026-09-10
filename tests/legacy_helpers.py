"""Explicitly provision approved LMSR markets for legacy regression scenarios."""
from unittest.mock import patch
from app.config import settings
from tests.auth_helpers import tma_headers


def post_legacy_market(client, path, **kwargs):
    kwargs['json'] = dict(kwargs.get('json', {}), mechanism='lmsr')
    response = client.post(path, **kwargs)
    if response.status_code == 200:
        mid = response.json()['id']
        admin_id = settings.admin_tg_id() or 990000001
        with patch.object(settings, 'admin_telegram_id', admin_id):
            headers = tma_headers(admin_id)
            assert client.post('/auth/telegram', headers=headers).status_code == 200
            approved = client.post(f'/markets/{mid}/approve', headers=headers)
            assert approved.status_code == 200, approved.text
        return approved
    return response
