from pathlib import Path

HTML = Path(__file__).resolve().parents[1] / "app" / "static" / "miniapp.html"
ACCOUNT = HTML.with_name("account.js")


def test_wallet_shell_is_production_looking_and_disabled():
    html = HTML.read_text(encoding="utf-8")
    js = ACCOUNT.read_text(encoding="utf-8")
    assert 'data-panel="wallet"' in html
    assert 'id="deposit-cta" disabled' in html
    assert 'id="withdraw-cta" disabled' in html
    assert "Адрес появится после подключения блокчейн-модуля" in html
    assert "Блокчейн-пополнения пока не подключены" in html
    assert "Вывод будет доступен после подключения блокчейн-модуля" in html
    assert "data-net=\"ton\"" in html
    assert "data-net=\"solana\"" in html
    assert "Получить адрес" in html
    assert "function openWallet" in js
    assert "seed" not in html.lower()
    assert "mnemonic" not in html.lower()
    assert "private key" not in html.lower()
    assert "EQ" not in html
    assert "ton://" not in html.lower()
    assert "/wallet/deposit" not in html
    assert "/wallet/withdraw" not in html
    assert "id=\"balance-open\"" in html
    assert "Пополнить" in html
    assert "Вывести" in html


def test_account_screen_has_profile_sections():
    html = HTML.read_text(encoding="utf-8")
    assert 'data-account="overview"' in html
    assert 'data-account="events"' in html
    assert 'data-account="orders"' in html
    assert 'data-account="positions"' in html
    assert 'data-account="history"' in html
    assert 'id="mine-orders"' in html
    assert 'id="tx-list"' in html
    assert "Сервисный сбор — 1% только с чистой прибыли победителя" in html
    assert "без комиссии" not in html.lower()
    assert 'data-tab="feed">Лента</button>' in html
    assert 'data-tab="create">Создать</button>' in html
    assert 'data-tab="mine">Мои</button>' in html
    assert html.count('data-tab="') == 4
