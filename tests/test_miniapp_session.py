from pathlib import Path

HTML = Path(__file__).resolve().parents[1] / "app" / "static" / "miniapp.html"
AUTH_REOPEN = "Сессия недействительна. Закройте Mini App и откройте его заново"


def _section(html: str, start: str, end: str) -> str:
    return html[html.index(start) : html.index(end)]


def test_load_positions_map_rethrows_auth_reopen():
    html = HTML.read_text(encoding="utf-8")
    body = _section(html, "async function loadPositionsMap", "function renderOutcomesEditor")
    assert "isAuthReopenError(e)" in body
    assert "throw e" in body
    assert "catch (e) {\n        myPositions = {};\n      }" not in body
    assert "function applyUnauthorized()" in html
    assert "applyUnauthorized();" in html
    assert "auth()" not in body


def test_expired_session_on_positions_clears_ui():
    html = HTML.read_text(encoding="utf-8")
    apply_fn = _section(html, "function applyUnauthorized()", "async function api(")
    api_fn = _section(html, "async function api(", "function paintUser(")
    paint_fn = _section(html, "function paintUser()", "function requireLogin")
    positions_fn = _section(html, "async function loadPositionsMap", "function renderOutcomesEditor")

    assert "authBlocked = true" in apply_fn
    assert "me = null" in apply_fn
    assert "myPositions = {}" in apply_fn
    assert "paintUser()" in apply_fn
    assert "showError(AUTH_REOPEN)" in apply_fn
    assert "auth()" not in apply_fn
    assert "auth()" not in api_fn
    assert "applyUnauthorized();" in api_fn
    assert "throw new Error(AUTH_REOPEN)" in api_fn
    assert "if (isAuthReopenError(e)) throw e" in positions_fn
    assert "me ? fmtTon(me.balance) : \"—\"" in paint_fn
    assert "createBtn.disabled = !me" in paint_fn
    assert "me && me.is_admin" in paint_fn

    me = {"id": 7, "is_admin": True, "balance": 1000.0}
    my_positions = {9: {"market_id": 9}}
    auth_blocked = False
    error = ""
    who = "Ada<span class=\"admin-mark\">админ</span>"
    balance = "1000.00 TON"
    create_disabled = False

    def paint_user():
        nonlocal who, balance, create_disabled
        admin = me and me.get("is_admin")
        who = "Ada" + ('<span class="admin-mark">админ</span>' if admin else "")
        balance = f"{me['balance']:.2f} TON" if me else "—"
        create_disabled = not me

    def apply_unauthorized():
        nonlocal auth_blocked, me, my_positions, error
        auth_blocked = True
        me = None
        my_positions = {}
        paint_user()
        error = AUTH_REOPEN

    def load_positions_map():
        nonlocal my_positions
        try:
            apply_unauthorized()
            raise RuntimeError(AUTH_REOPEN)
        except Exception as exc:
            my_positions = {}
            if str(exc) == AUTH_REOPEN:
                raise

    raised = False
    try:
        load_positions_map()
    except RuntimeError as exc:
        raised = str(exc) == AUTH_REOPEN

    assert raised
    assert auth_blocked is True
    assert me is None
    assert my_positions == {}
    assert error == AUTH_REOPEN
    assert balance == "—"
    assert create_disabled is True
    assert "админ" not in who
