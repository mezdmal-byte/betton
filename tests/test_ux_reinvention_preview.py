"""The new UI runtime must retain the existing sandbox security boundary."""
import os
from pathlib import Path
import subprocess
import sys
import tempfile

import pytest
from scripts.ux_reinvention_preview import ROOT, create_ux_preview


@pytest.mark.parametrize('port', [0, 1023, 65536, True, '8890'])
def test_invalid_port_does_not_create_state(tmp_path, port):
    state = tmp_path / 'unused'
    with pytest.raises(ValueError, match='local test port'):
        create_ux_preview(state, port)
    assert not state.exists()


def test_full_demo_is_local_marked_and_authenticates_synthetic_actors():
    allowed = ROOT / '.ux-preview'
    allowed.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='reinvention-boundary-', dir=allowed) as directory:
        code = '''import sys
from pathlib import Path
from scripts.ux_reinvention_preview import create_ux_preview
app = create_ux_preview(Path(sys.argv[1]), 8890)
from app.config import settings
assert settings.public_base_url == 'http://127.0.0.1:8890'
assert settings.betton_demo_automation
from fastapi.testclient import TestClient
with TestClient(app, base_url='http://127.0.0.1:8890', client=('127.0.0.1', 12345)) as client:
 assert client.get('/sandbox/session', headers={'Origin':'https://evil.invalid'}).status_code == 403
 assert client.get('/sandbox/session', headers={'Host':'evil.invalid'}).status_code == 403
 assert client.post('/webhook', json={}).status_code == 404
 session = client.get('/sandbox/session').json()
 assert session['sandbox']['seeded'] and session['sandbox']['full_demo']
 assert session['sandbox']['database'] == 'betton-test-simulation.sqlite'
 headers = {'Authorization': 'tma ' + session['init_data']}
 response = client.get('/guarantors', headers=headers)
 assert response.status_code == 200
 # The full sandbox retains its manual actor alongside six automated actors.
 assert len([row for row in response.json() if row['name'].startswith('ТЕСТ · ')]) == 6
 assert client.get('/health').status_code == 200
print('full-demo boundary verified')'''
        result = subprocess.run(
            [sys.executable, '-X', 'utf8', '-c', code, directory], cwd=ROOT,
            env={**os.environ, 'DATABASE_URL': 'postgresql://never-connect.invalid/production'},
            capture_output=True, text=True, encoding='utf-8', timeout=90,
        )
        assert result.returncode == 0, result.stderr
