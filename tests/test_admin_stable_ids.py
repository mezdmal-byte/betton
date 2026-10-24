import pytest
from app.config import settings
from tests.auth_helpers import make_init_data


def test_admin_username_change_and_revocation(client, monkeypatch):
    monkeypatch.setattr(settings, 'admin_telegram_id', '')
    monkeypatch.setattr(settings, 'admin_telegram_ids', '90900001,90900002')
    def login(tg_id, username):
        headers = {'Authorization': 'tma ' + make_init_data(tg_id, username=username)}
        return client.post('/auth/telegram', headers=headers).json(), headers
    for name in ('before', 'after'):
        admin, headers = login(90900001, name)
        assert admin['is_admin'] is True
    stranger, _ = login(90900003, 'before')
    assert stranger['is_admin'] is False
    monkeypatch.setattr(settings, 'admin_telegram_ids', '90900002')
    assert client.get('/moderation/markets', headers=headers).status_code == 403
    assert login(90900001, 'after')[0]['is_admin'] is False


def test_deprecated_username_requires_explicit_migration(monkeypatch):
    monkeypatch.setattr(settings, 'admin_telegram_id', '')
    monkeypatch.setattr(settings, 'admin_telegram_ids', '')
    monkeypatch.setattr(settings, 'admin_telegram_usernames', 'untrusted_name')
    assert not settings.is_admin_telegram_identity(90900001, 'untrusted_name')
    with pytest.raises(RuntimeError):
        settings.validate_admin_configuration()


def test_malformed_ids_fail_closed(monkeypatch):
    monkeypatch.setattr(settings, 'admin_telegram_usernames', '')
    monkeypatch.setattr(settings, 'admin_telegram_ids', '90900001,not-an-id')
    assert not settings.is_admin_telegram(90900001)
    with pytest.raises(RuntimeError):
        settings.validate_admin_configuration()
