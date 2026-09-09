import os
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from tests.auth_helpers import TEST_BOT_TOKEN

_fd, _TEST_DB = tempfile.mkstemp(prefix="betton-test-", suffix=".db")
os.close(_fd)
os.environ["DATABASE_URL"] = "sqlite:///" + Path(_TEST_DB).as_posix()
os.environ["BOT_TOKEN"] = TEST_BOT_TOKEN
os.environ["ADMIN_TELEGRAM_ID"] = ""
os.environ["MINI_APP_URL"] = "http://127.0.0.1"
os.environ["PUBLIC_BASE_URL"] = "http://127.0.0.1"
os.environ["RENDER_EXTERNAL_URL"] = ""


@pytest.fixture
def client():
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client
