from fastapi.testclient import TestClient


def test_legacy_root_still_serves_miniapp(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert "/static/i18n.js" in response.text


def test_health_and_static_untouched(client: TestClient):
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"
    static_js = client.get("/static/p2p.js")
    assert static_js.status_code == 200


def test_v2_preview_does_not_replace_legacy_root(client: TestClient, tmp_path):
    from app import main as app_main
    from fastapi import FastAPI

    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "index.html").write_text('<!doctype html><div id="root">react-v2</div>', encoding="utf-8")
    preview = FastAPI()
    app_main.mount_react_preview(preview, dist)
    nested = TestClient(preview)
    page = nested.get("/v2/")
    assert page.status_code == 200
    assert "react-v2" in page.text
    spa = nested.get("/v2/made-up-client-path")
    assert spa.status_code == 200
    assert "react-v2" in spa.text

    root = client.get("/")
    assert "/static/i18n.js" in root.text
