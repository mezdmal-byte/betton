"""Local/CI demo seeder. Never targets production or Render automatically."""
from __future__ import annotations

import argparse
import os
import shutil
import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_FLOOR
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

UNSAFE_HOST_MARKERS = (
    "onrender.com",
    "render.com",
    "amazonaws.com",
    "neon.tech",
    "supabase.co",
    "azure.com",
    "cloudsql",
)
ALLOWED_PG_HOSTS = {"localhost", "127.0.0.1", "postgres", "::1", "host.docker.internal"}
RENDER_ENV_KEYS = ("RENDER", "RENDER_SERVICE_ID", "RENDER_EXTERNAL_URL")

DEMO_ADMIN_TG = 9_000_001
DEMO_CREATOR_TG0 = 9_100_000
DEMO_TRADER_TG0 = 9_200_000
PROTECTED_TG_MIN = 1
PROTECTED_TG_MAX = 8_999_999

ODDS_LADDER = (
    1.20, 1.32, 1.45, 1.60, 1.75, 1.90, 2.00, 2.20, 2.50, 3.00, 3.50, 4.20,
)
STAKES = (5, 10, 25, 40, 75, 100, 250, 500, 1000, 1500)
SCENARIOS = (
    "empty",
    "yes_only",
    "no_only",
    "both_unmatched",
    "book_levels",
    "partial",
    "full_match",
    "high_volume",
    "low_volume",
    "closing_soon",
    "closed",
    "resolved_yes",
    "resolved_no",
    "cancelled",
    "pending",
    "unlisted",
)
CREATORS = [
    ("vasya", "Вася"),
    ("petya", "Петя"),
    ("masha", "Маша"),
    ("ira", "Ира"),
    ("nina", "Нина"),
    ("kenji", "Kenji"),
    ("lin", "Lin Wei"),
    ("omar", "Omar"),
]
CREATOR_WEIGHTS = (0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 7)


def _parse_url(url: str):
    raw = (url or "").strip()
    if not raw:
        raise ValueError("database url is empty")
    if raw.startswith("sqlite:"):
        rest = raw.split(":///", 1)[-1] if ":///" in raw else ""
        return "sqlite", None, rest
    parsed = urlparse(raw.replace("postgresql+psycopg2", "postgresql"))
    return parsed.scheme, (parsed.hostname or "").lower(), parsed.path


def looks_like_render_env() -> bool:
    for key in RENDER_ENV_KEYS:
        value = (os.environ.get(key) or "").strip()
        if value:
            return True
    return False


def assert_safe_database(url: str, *, allow_local_demo: bool = False) -> None:
    if looks_like_render_env():
        raise SystemExit("Refusing to seed: Render environment detected.")
    kind, host, path = _parse_url(url)
    blob = f"{url} {host or ''} {path or ''}".lower()
    if any(marker in blob for marker in UNSAFE_HOST_MARKERS):
        raise SystemExit("Refusing to seed: production-like database host.")
    if kind.startswith("sqlite"):
        name = Path(path or "").name.lower()
        if name in {"betton.db", "production.db"} and not allow_local_demo:
            raise SystemExit(
                "Refusing to seed the default local app database without --allow-local-demo."
            )
        return
    if kind.startswith("postgres"):
        if host in ALLOWED_PG_HOSTS:
            return
        if allow_local_demo and host and not any(marker in host for marker in UNSAFE_HOST_MARKERS):
            return
        raise SystemExit(
            "Refusing to seed this PostgreSQL host. Use localhost/CI or pass --allow-local-demo."
        )
    raise SystemExit("Only SQLite and PostgreSQL demo databases are supported.")


def sqlite_path(url: str) -> Path | None:
    kind, _host, path = _parse_url(url)
    if not kind.startswith("sqlite") or not path:
        return None
    raw = Path(path)
    return raw if raw.is_absolute() else (ROOT / raw)


def backup_sqlite(url: str, backup_dir: str) -> Path | None:
    src = sqlite_path(url)
    if src is None or not src.exists():
        return None
    dest_dir = Path(backup_dir)
    if not dest_dir.is_absolute():
        dest_dir = ROOT / dest_dir
    dest_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    dest = dest_dir / f"{src.stem}-{stamp}{src.suffix or '.db'}"
    shutil.copy2(src, dest)
    return dest


def demo_marker(tag: str) -> str:
    clean = "".join(ch for ch in (tag or "vasily") if ch.isalnum() or ch in "-_")[:32] or "vasily"
    return f"DEMO[{clean}]"


def complement_odds(odds: float) -> float:
    from app.services.p2p_service import PRICE

    tick = int((Decimal(PRICE) / Decimal(str(odds))).to_integral_value(rounding=ROUND_FLOOR))
    other = PRICE - tick
    if other <= 0:
        return 10000.0
    return float(Decimal(PRICE) / Decimal(other))


def demo_questions(count: int) -> list[dict]:
    sport = [
        "Спартак обыграет Зенит в ближайшем туре РПЛ?",
        "ЦСКА забьёт первой в домашнем матче?",
        "Локомотив возьмёт три очка против Динамо?",
        "Краснодар сохранит первое место после тура?",
        "Россия выйдет в плей-офф чемпионата мира?",
        "Сборная обыграет соперника с разницей в два мяча?",
        "СКА выиграет ближайший матч КХЛ?",
        "ЦСКА в хоккее забросит больше двух шайб?",
        "Металлург Магнитогорск возьмёт регулярку КХЛ?",
        "Медведев выйдет в финал турнира ATP?",
        "Мирра Андреева выиграет четвертьфинал?",
        "Рублёв возьмёт сет у топ-10 соперника?",
        "«Реал» выиграет El Clásico?",
        "Манчестер Сити станет чемпионом АПЛ?",
        "Бавария забьёт в первом тайме?",
        "ПСЖ пройдёт дальше в Лиге чемпионов?",
        "Интер выиграет Серию А?",
        "Барселона не пропустит в следующем матче?",
        "Ливерпуль возьмёт три очка на выезде?",
        "Арсенал обыграет Тоттенхэм в дерби?",
        "Овечкин забросит в ближайшем матче НХЛ?",
        "Конор Макгрегор вернётся на поединок в этом году?",
        "Российский боец выиграет следующий UFC?",
        "«Зенит» забьёт с пенальти в этом туре?",
        "Сборная Казахстана возьмёт очко в отборе?",
        "Формула-1: победит пилот Ferrari?",
        "Верстаппен возьмёт поул на следующем этапе?",
        "ЦСКА пройдёт в еврокубках дальше?",
        "Динамо Москва выиграет дома?",
        "Рубин Казань не проиграет в следующем туре?",
        "Who wins Spartak vs Zenit this weekend?",
        "Will CSKA score first against Lokomotiv?",
        "Does Real Madrid win El Clasico?",
        "Will Medvedev reach the ATP final?",
        "Can City win the Premier League title?",
    ]
    politics = [
        "Госдума примет жилищный законопроект до конца сессии?",
        "Явка на выборах превысит прошлый цикл?",
        "Сенат США сохранит текущее большинство?",
        "В Москве пройдёт референдум по транспорту в этом году?",
        "Кабмин утвердит новый энерготариф до декабря?",
        "ЦИК зарегистрирует всех заявленных кандидатов?",
        "Санкт-Петербург сохранит действующего губернатора?",
        "ЕС продлит санкционный пакет на следующий срок?",
        "Британский парламент одобрит бюджет без правок?",
        "Во Франции пройдёт досрочный вотум доверия?",
        "В Казахстане примут цифровой кодекс в этом году?",
        "Совфед одобрит налоговые поправки с первого чтения?",
        "Минфин сохранит текущую ставку НДС?",
        "Мосгордума примет закон об аренде жилья?",
        "ООН примет резолюцию по климату на этой сессии?",
        "Выборы в регионе завершатся в один тур?",
        "Партия власти наберёт больше 40% на выборах?",
        "Закон об образовании примут до каникул?",
        "Мэр подпишет программу благоустройства до осени?",
        "ЦБ сохранит ключевую ставку на ближайшем заседании?",
        "Казахстан ратифицирует новый торговый договор?",
        "Бундестаг утвердит миграционный пакет?",
        "Сеул продлит текущие меры субсидий?",
        "Киев примет бюджет до конца года?",
        "Рига сохранит правящую коалицию после голосования?",
        "Will the housing bill pass this session?",
        "Does Berlin keep the current majority after the vote?",
        "Will turnout in Lisbon exceed last cycle?",
        "Will the energy bill pass before December?",
        "Does Oslo keep the current majority?",
    ]
    unique = [
        "В Москве завтра вечером пойдёт дождь?",
        "Снег в Санкт-Петербурге выпадет раньше декабря?",
        "Температура в Казани опустится ниже −20 этой зимой?",
        "Река в Тбилиси выйдет из берегов до конца месяца?",
        "Запуск спутника состоится до конца месяца?",
        "Новый релиз open-source выйдет на этой неделе?",
        "Кинофестиваль в Сочи соберёт больше прошлого года?",
        "Марафон в Москве финиширует при ясной погоде?",
        "Музейная ночь пройдёт без переноса?",
        "Затмение будет видно в европейской части России?",
        "Курс доллара закроет неделю выше текущего?",
        "Bitcoin закроет сутки в плюсе?",
        "Новый сезон сериала выйдет до конца квартала?",
        "Чемпионат по шахматам завершится в ничью?",
        "Выставка в Эрмитаже продлится дольше анонса?",
        "Первый снег в Новосибирске выпадет в октябре?",
        "Ветер в Сочи превысит 20 м/с на этих выходных?",
        "Сахара Station зафиксирует дождь до конца месяца?",
        "Релиз игры студии выйдет без переноса?",
        "Полярное сияние будет видно в Мурманске на этой неделе?",
        "Цена нефти Brent закроет неделю выше $80?",
        "Яндекс представит обновление сервиса до конца месяца?",
        "Новый мост откроют раньше объявленной даты?",
        "Фестиваль на Неве пройдёт в заявленные даты?",
        "Температура в Дубае превысит 40°C завтра?",
        "Команда выиграет международную олимпиаду по программированию?",
        "Новый iPhone поступят в продажу в РФ в месяц релиза?",
        "Will it rain in Berlin tomorrow evening?",
        "Does the mars probe launch before month end?",
        "Will Tokyo see snow before December?",
        "Will the city marathon finish under clear skies?",
        "Does the chess championship end in a draw?",
        "Will Cape Town record rain this weekend?",
        "Does the open-source release ship this week?",
        "Will Montreal see snow before November?",
    ]
    rows: list[dict] = []
    buckets = (
        [("sport", sport, ["Да", "Нет"])] * 35
        + [("politics", politics, ["Да", "Нет"])] * 30
        + [("unique", unique, ["Да", "Нет"])] * 35
    )
    for index in range(count):
        category, _pool, outcomes = buckets[index % 100 if index < 100 else index % len(buckets)]
        if category == "sport":
            question = sport[index % len(sport)]
            if question.startswith("Who wins") or "vs" in question and "Will" not in question and "Will " not in question:
                if "Spartak" in question or "Спартак" in question:
                    outcomes = ["Спартак", "Зенит"]
                elif "CSKA" in question:
                    outcomes = ["CSKA", "Lokomotiv"]
                else:
                    outcomes = ["Home", "Away"]
            else:
                outcomes = ["Да", "Нет"] if not question[:1].isascii() else ["Yes", "No"]
        elif category == "politics":
            question = politics[index % len(politics)]
            outcomes = ["Да", "Нет"] if not question.startswith("Will") and not question.startswith("Does") else ["Yes", "No"]
        else:
            question = unique[index % len(unique)]
            outcomes = ["Да", "Нет"] if not question[:1].isascii() else ["Yes", "No"]
        if index >= 100:
            question = f"{question} [{index}]"
        rows.append({"question": question, "category": category, "outcomes": outcomes})
    return rows[:count]


def _now():
    return datetime.now(timezone.utc)


def _is_demo_telegram(telegram_id: int | None) -> bool:
    if telegram_id is None:
        return False
    return telegram_id in {DEMO_ADMIN_TG} or DEMO_CREATOR_TG0 <= telegram_id < DEMO_TRADER_TG0 + 20


def _place(db, market_id, user_id, outcome, amount, odds, request_id):
    from app.services import p2p_service

    try:
        return p2p_service.place(
            db, market_id, user_id, outcome, amount, odds, "limit", request_id[:64]
        )
    except Exception:
        db.rollback()
        return None


def _apply_book(db, market, traders, index, tag, scenario):
    if market.status.value != "open":
        return
    odds = ODDS_LADDER[index % len(ODDS_LADDER)]
    other = complement_odds(odds)
    unmatched = ODDS_LADDER[(index + 7) % len(ODDS_LADDER)]
    if unmatched == other or abs(unmatched - other) < 0.05:
        unmatched = 4.20
    stake = STAKES[index % len(STAKES)]
    a = traders[index % len(traders)]
    b = traders[(index + 1) % len(traders)]
    c = traders[(index + 2) % len(traders)]
    d = traders[(index + 3) % len(traders)]
    key = f"d{tag}{index}"

    if scenario == "empty":
        return
    if scenario == "yes_only":
        _place(db, market.id, a.id, 0, stake, odds, f"{key}-y")
        return
    if scenario == "no_only":
        _place(db, market.id, b.id, 1, stake, odds, f"{key}-n")
        return
    if scenario == "both_unmatched":
        _place(db, market.id, a.id, 0, stake, odds, f"{key}-y")
        _place(db, market.id, b.id, 1, stake, unmatched, f"{key}-n")
        return
    if scenario == "book_levels":
        for level, user in enumerate((a, c, d)):
            k = ODDS_LADDER[(index + level) % len(ODDS_LADDER)]
            _place(db, market.id, user.id, 0, STAKES[level], k, f"{key}-yl{level}")
        for level, user in enumerate((b, traders[(index + 4) % len(traders)], traders[(index + 5) % len(traders)])):
            k = ODDS_LADDER[(index + level + 6) % len(ODDS_LADDER)]
            _place(db, market.id, user.id, 1, STAKES[level + 1], k, f"{key}-nl{level}")
        return
    if scenario == "partial":
        _place(db, market.id, a.id, 0, max(40, stake), odds, f"{key}-y")
        _place(db, market.id, b.id, 1, 10, other, f"{key}-n")
        return
    if scenario in {"full_match", "closed", "resolved_yes", "resolved_no", "cancelled", "closing_soon"}:
        _place(db, market.id, a.id, 0, stake, odds, f"{key}-y")
        _place(db, market.id, b.id, 1, stake, other, f"{key}-n")
        return
    if scenario == "low_volume":
        _place(db, market.id, a.id, 0, 5, 2.00, f"{key}-y")
        _place(db, market.id, b.id, 1, 5, 2.00, f"{key}-n")
        return
    if scenario == "high_volume":
        whale = 1000 + (index % 3) * 500
        _place(db, market.id, a.id, 0, whale, 2.00, f"{key}-y1")
        _place(db, market.id, b.id, 1, whale, 2.00, f"{key}-n1")
        extra = 250 + (index % 2) * 250
        _place(db, market.id, c.id, 0, extra, 1.75, f"{key}-y2")
        _place(db, market.id, d.id, 1, extra, complement_odds(1.75), f"{key}-n2")
        rest = 100
        _place(db, market.id, traders[(index + 6) % len(traders)].id, 0, rest, 1.45, f"{key}-y3")
        return


def seed_markets(db, *, count: int = 100, rng_seed: int = 42, demo_tag: str = "vasily") -> dict:
    from app.models import Market, MarketStatus, User
    from app.schemas import MarketCreate
    from app.services import market_service, p2p_service

    _ = rng_seed
    count = max(1, min(int(count), 300))
    tag = "".join(ch for ch in (demo_tag or "vasily") if ch.isalnum() or ch in "-_")[:32] or "vasily"
    marker = demo_marker(tag)
    existing = db.query(Market).filter(Market.description.like(f"%{marker}%")).all()
    existing_questions = {m.question for m in existing}
    questions = demo_questions(count)

    admin = market_service.get_or_create_telegram_user(
        db, telegram_id=DEMO_ADMIN_TG, username="demo_admin", first_name="Demo", last_name="Admin"
    )
    makers = []
    for index, (username, name) in enumerate(CREATORS):
        user = market_service.get_or_create_telegram_user(
            db,
            telegram_id=DEMO_CREATOR_TG0 + index,
            username=username,
            first_name=name.split()[0],
            last_name=" ".join(name.split()[1:]) or None,
        )
        if _is_demo_telegram(user.telegram_id):
            user.balance = 2_000_000
        makers.append(user)
    traders = []
    for index in range(8):
        user = market_service.get_or_create_telegram_user(
            db, telegram_id=DEMO_TRADER_TG0 + index, username=f"trader{index}", first_name=f"Trader{index}"
        )
        if _is_demo_telegram(user.telegram_id):
            user.balance = 2_000_000
        traders.append(user)
    db.commit()

    created = []
    skipped = 0
    now = _now()
    for index, spec in enumerate(questions):
        if spec["question"] in existing_questions:
            skipped += 1
            continue
        maker = makers[CREATOR_WEIGHTS[index % len(CREATOR_WEIGHTS)]]
        scenario = SCENARIOS[index % len(SCENARIOS)]
        unlisted = scenario == "unlisted"
        hours = 2 if scenario == "closing_soon" else (24 + (index % 20) * 12)
        close_at = now + timedelta(hours=hours)
        req = MarketCreate(
            question=spec["question"],
            description=f"{marker} seed — презентационный набор, не production.",
            category=spec["category"],
            outcomes=spec["outcomes"],
            close_at=close_at,
            visibility="unlisted" if unlisted else "public",
        )
        market = p2p_service.create_market(db, maker.id, req)
        market.created_at = (now - timedelta(days=(count - index), hours=index % 11)).replace(tzinfo=None)
        db.commit()
        if not unlisted and scenario != "pending":
            market = market_service.moderate_market(db, market.id, admin.id)
        db.refresh(market)
        _apply_book(db, market, traders, index, tag, scenario)
        db.refresh(market)
        if scenario == "closed" and market.status == MarketStatus.open:
            market_service.close_market(db, market.id, admin.id)
        if scenario == "resolved_yes" and market.status == MarketStatus.open:
            market_service.close_market(db, market.id, admin.id)
            market_service.resolve_market(db, market.id, 0, admin.id)
        if scenario == "resolved_no" and market.status == MarketStatus.open:
            market_service.close_market(db, market.id, admin.id)
            market_service.resolve_market(db, market.id, 1, admin.id)
        if scenario == "cancelled" and market.status == MarketStatus.open:
            p2p_service.void_market(db, market.id, admin.id, "DEMO cancellation for variety")
        db.refresh(market)
        created.append(market)

    all_demo = db.query(Market).filter(Market.description.like(f"%{marker}%")).all()
    return {
        "count": len(all_demo),
        "created": len(created),
        "skipped": skipped,
        "tag": tag,
        "public_open": sum(
            1
            for m in all_demo
            if (getattr(m, "visibility", "public") or "public") == "public" and m.status == MarketStatus.open
        ),
        "unlisted": sum(1 for m in all_demo if (getattr(m, "visibility", "public") or "public") == "unlisted"),
        "pending": sum(1 for m in all_demo if m.status == MarketStatus.pending),
        "protected_users": db.query(User).filter(
            User.telegram_id.isnot(None),
            User.telegram_id >= PROTECTED_TG_MIN,
            User.telegram_id <= PROTECTED_TG_MAX,
        ).count(),
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed a local/CI demo database with P2P markets.")
    parser.add_argument("--count", type=int, default=100)
    parser.add_argument("--database-url", default="")
    parser.add_argument("--allow-local-demo", action="store_true")
    parser.add_argument("--demo-tag", default="vasily")
    parser.add_argument("--backup-dir", default="backups")
    parser.add_argument("--no-backup", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    url = (args.database_url or os.environ.get("DATABASE_URL") or "").strip()
    if not url:
        print(
            "Pass --database-url explicitly, for example:\n"
            "  python scripts/seed_demo_markets.py --count 100 --database-url sqlite:///./betton.db --allow-local-demo --demo-tag vasily",
            file=sys.stderr,
        )
        return 2
    try:
        assert_safe_database(url, allow_local_demo=args.allow_local_demo)
    except SystemExit as exc:
        print(exc, file=sys.stderr)
        return 2
    if not args.no_backup:
        backup = backup_sqlite(url, args.backup_dir)
        if backup is not None:
            print(f"Backup: {backup}")
    os.environ["DATABASE_URL"] = url
    if not os.environ.get("ADMIN_TELEGRAM_ID"):
        os.environ["ADMIN_TELEGRAM_ID"] = str(DEMO_ADMIN_TG)
    from app.config import settings
    from app.database import SessionLocal, ensure_schema

    settings.database_url = url
    settings.admin_telegram_id = os.environ["ADMIN_TELEGRAM_ID"]
    ensure_schema()
    with SessionLocal() as db:
        summary = seed_markets(db, count=args.count, demo_tag=args.demo_tag)
    print(
        f"Seeded DEMO[{summary['tag']}] markets: total={summary['count']} "
        f"created={summary['created']} skipped={summary['skipped']} "
        f"(open public={summary['public_open']}, unlisted={summary['unlisted']}, pending={summary['pending']})."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
