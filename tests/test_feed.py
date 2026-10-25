from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from tests.test_markets_api import _admin
from tests.test_p2p import market, submit
from tests.test_profile_creators import _login


def _approve(client, admin_headers, mid):
    assert client.post(f"/markets/{mid}/approve", headers=admin_headers).status_code == 200


def test_feed_sort_search_pagination_and_excludes_nothing_public(client: TestClient, monkeypatch):
    admin, ah = _admin(client, monkeypatch)
    maker, hm = _login(client, username="feedmaker", first_name="Feed")
    a, ha = _login(client)
    b, hb = _login(client)
    rain = client.post(
        "/markets",
        headers=hm,
        json={
            "question": "Will it rain in Berlin tomorrow evening?",
            "category": "unique",
            "outcomes": ["Yes", "No"],
            "close_at": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
        },
    ).json()
    sport = client.post(
        "/markets",
        headers=hm,
        json={
            "question": "Who wins the football cup final this year?",
            "category": "sport",
            "outcomes": ["Home", "Away"],
            "close_at": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
        },
    ).json()
    politics = client.post(
        "/markets",
        headers=hm,
        json={
            "question": "Election result in the northern district?",
            "category": "politics",
            "outcomes": ["Yes", "No"],
            "close_at": (datetime.now(timezone.utc) + timedelta(hours=6)).isoformat(),
        },
    ).json()
    for mid in (rain["id"], sport["id"], politics["id"]):
        _approve(client, ah, mid)

    submit(client, rain["id"], ha, 0, 80, 2)
    submit(client, rain["id"], hb, 1, 80, 2)

    search = client.get("/markets", params={"q": "berlin"})
    assert search.status_code == 200
    found = [m["id"] for m in search.json()]
    assert rain["id"] in found
    assert sport["id"] not in found

    sport_only = client.get("/markets", params={"category": "sport", "q": "football"})
    assert [m["id"] for m in sport_only.json()] == [sport["id"]]

    by_category_name = client.get("/markets", params={"q": "спорт"})
    assert by_category_name.status_code == 200
    assert sport["id"] in [m["id"] for m in by_category_name.json()]
    assert politics["id"] not in [m["id"] for m in by_category_name.json()]

    by_author = client.get("/markets", params={"q": "@feedmaker"})
    assert by_author.status_code == 200
    author_ids = {m["id"] for m in by_author.json()}
    assert {rain["id"], sport["id"], politics["id"]}.issubset(author_ids)

    by_display_name = client.get("/markets", params={"q": "Feed"})
    assert by_display_name.status_code == 200
    assert {rain["id"], sport["id"], politics["id"]}.issubset(
        {m["id"] for m in by_display_name.json()}
    )

    closing = client.get("/markets", params={"sort": "closing"})
    assert closing.status_code == 200
    closing_ids = [m["id"] for m in closing.json() if m["id"] in {rain["id"], sport["id"], politics["id"]}]
    assert closing_ids[0] == rain["id"]
    assert sport["id"] in closing_ids

    popular = client.get("/markets", params={"sort": "popular"})
    assert popular.status_code == 200
    popular_ids = [m["id"] for m in popular.json()]
    assert popular_ids.index(rain["id"]) < popular_ids.index(sport["id"])
    rain_card = next(m for m in popular.json() if m["id"] == rain["id"])
    assert rain_card["activity"]["fills"] >= 1
    assert rain_card["activity"]["volume_nano"] > 0

    newest = client.get("/markets", params={"sort": "new", "limit": 2, "offset": 0})
    assert newest.status_code == 200
    assert len(newest.json()) == 2
    assert newest.headers.get("X-Total-Count")
    page2 = client.get("/markets", params={"sort": "new", "limit": 2, "offset": 2})
    assert page2.status_code == 200
    ids1 = {m["id"] for m in newest.json()}
    ids2 = {m["id"] for m in page2.json()}
    assert ids1.isdisjoint(ids2)

    default = client.get("/markets")
    assert default.status_code == 200
    assert any(m["id"] == rain["id"] for m in default.json())


def test_feed_ui_has_sort_pagination_and_creators():
    from pathlib import Path
    html = Path(__file__).resolve().parents[1] / "app" / "static" / "miniapp.html"
    text = html.read_text(encoding="utf-8")
    assert 'data-sort="new"' in text
    assert 'data-sort="popular"' in text
    assert 'data-sort="closing"' in text
    assert 'id="feed-more"' in text
    assert "Лучшие авторы" in text
    assert "async function openCreator" in text
    assert "async function loadTopCreators" in text
    assert "function showTopCreators" in text
    assert 'data-panel="top-creators"' in text
    assert "top-creators-preview" in text
    assert "top-creators-full" in text
    assert "slice(0, 3)" in text
    assert "debounce" not in text.lower() or "280" in text
    assert "setTimeout(() => loadMarkets()" in text
