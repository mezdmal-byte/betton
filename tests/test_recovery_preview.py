import os
from pathlib import Path
import subprocess
import sys
import tempfile

import pytest
from scripts.recovery_preview import ROOT, create_recovery_preview


@pytest.mark.parametrize('port', [0, 1023, 65536, True, '8887'])
def test_rejects_invalid_port_before_creating_state(tmp_path, port):
    state = tmp_path / 'must-not-be-created'
    with pytest.raises(ValueError, match='local test port'):
        create_recovery_preview(state, port)
    assert not state.exists()


def test_separate_process_updates_only_test_urls_and_preserves_origin_guard():
    allowed = ROOT / '.ux-preview'; allowed.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='recovery-port-', dir=allowed) as directory:
        code = '''import sys
from pathlib import Path
from scripts.recovery_preview import create_recovery_preview
app=create_recovery_preview(Path(sys.argv[1]),8887)
from app.config import settings
assert settings.public_base_url=='http://127.0.0.1:8887'
assert settings.mini_app_url=='http://127.0.0.1:8887'
assert not settings.betton_demo_automation
from fastapi.testclient import TestClient
with TestClient(app,base_url='http://127.0.0.1:8887',client=('127.0.0.1',12345)) as client:
 assert client.get('/sandbox/session',headers={'Origin':'https://evil.invalid'}).status_code==403
 assert client.get('/sandbox/session',headers={'Host':'evil.invalid'}).status_code==403
 assert client.post('/webhook',json={}).status_code==404
 assert client.get('/sandbox/session').status_code==200
print('isolated recovery ready')'''
        result = subprocess.run([sys.executable, '-X', 'utf8', '-c', code, directory], cwd=ROOT,
            env={**os.environ, 'DATABASE_URL':'postgresql://never-connect.invalid/production'},
            capture_output=True, text=True, encoding='utf-8', timeout=40)
        assert result.returncode == 0, result.stderr
