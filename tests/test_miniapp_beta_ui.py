from pathlib import Path

HTML = Path(__file__).resolve().parents[1] / "app" / "static" / "miniapp.html"
P2P = HTML.with_name("p2p.js")


def test_beta_visual_language_and_shell():
    html = HTML.read_text(encoding="utf-8")
    css = html[html.index("<style>") : html.index("</style>")]
    assert "--bg: #FFFFFF" in css
    assert "--surface: #F4F5F7" in css
    assert "--text: #2F2F2F" in css
    assert "--yes: #20A39E" in css
    assert "--no: #EF5B5B" in css
    assert "--brand: #23001E" in css
    assert "#d4af37" not in css.lower()
    assert "linear-gradient" not in css
    assert 'data-tab="feed">Лента</button>' in html
    assert 'data-tab="create">Создать</button>' in html
    assert 'data-tab="mine">Мои</button>' in html
    assert 'data-panel="event"' in html
    assert 'id="event-root"' in html
    assert "Доступно" in html
    assert html.index("<main>") < html.index('class="tabs"')
    assert "position: fixed" in css
    assert "Сумма слишком маленькая." in html
    assert "Минимальная сумма — 1 nanoTON" not in html
    p2p = P2P.read_text(encoding="utf-8")
    assert "nanoTON" not in p2p
    assert "function p2pPreviewLines" in p2p
    assert "ждать встречного предложения" in p2p
    assert "function p2pPlaceToast" in p2p
    assert "function feedCard" in html


def test_feed_and_event_keep_existing_actions():
    html = HTML.read_text(encoding="utf-8")
    p2p = P2P.read_text(encoding="utf-8")
    assert "Оставить заявку" in p2p
    assert "Принять доступное" in p2p
    assert "data-act=\"p2p-limit\"" in p2p
    assert "data-act=\"claim\"" in html
    assert "async function openEvent" in html
    assert "function friendlyError" in html
    assert "me ? fmtTon(me.balance) : \"—\"" in html
