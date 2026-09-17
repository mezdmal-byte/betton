# BetTON

**BetTON** — Telegram Mini App с P2P-рынком прогнозов. Пользователи создают события и выставляют предложения друг другу; платформа не выступает букмекером и не обязана сама обеспечивать ликвидность.

## ⚠️ Где сейчас актуальная версия

Если вы открыли репозиторий впервые, это главное:

- `main` — консервативная основная ветка: backend, Telegram-бот, P2P-логика и legacy Mini App;
- `feature/react-full-preview` — **актуальная рабочая/демонстрационная версия интерфейса**, сейчас она живёт отдельно от `main` и открыта как Draft PR **#15**;
- новый React-интерфейс в preview-ветке обслуживается по `/v2/`, legacy UI остаётся по `/`;
- если задача — понять, как продукт выглядит и работает сейчас, начинайте с `feature/react-full-preview`, а не с `main`.

```bash
git fetch origin
git switch feature/react-full-preview
```

Проверить, что вы действительно на нужной ветке:

```bash
git branch --show-current
git rev-parse --short HEAD
```

> Не делайте вывод о текущем продукте только по `main`: React preview туда пока не слит.

Для передачи проекта программисту рекомендуемый порядок чтения:

```text
README.md
→ docs/HANDOFF.md
→ docs/p2p.md
→ frontend/README.md   # в feature/react-full-preview
```

## В двух словах — как работает BetTON

Пример события:

> «Пойдёт ли завтра дождь?»

Есть два исхода, например **Да / Нет**. Пользователь может:

1. принять уже существующее предложение — **Быстрая ставка**;
2. выставить свой коэффициент — **Своя цена**;
3. дождаться встречной заявки другого пользователя;
4. отменить неисполненный остаток своей заявки.

Сделка заключается **между пользователями**. Если встречной ликвидности нет, мгновенного исполнения нет. Частичное исполнение — нормальная часть P2P-модели.

### Сервисный сбор

**Сервисный сбор — 1% только с чистой прибыли победителя.**

Это не комиссия за создание события и не комиссия за размещение заявки. В существующей settlement-логике этот 1% распределяется между автором события и платформой в соотношении **75% / 25%** в предусмотренных кодом случаях. Это внутреннее распределение одного и того же сбора, а не дополнительная комиссия.

## Основная модель и legacy

Основное направление BetTON — **P2P order book / matching**.

В репозитории также остаётся старый механизм **LMSR** для совместимости со старыми рынками.

- **P2P**: цену и ликвидность создают заявки пользователей;
- **LMSR**: цену автоматически рассчитывает маркетмейкер.

LMSR не следует принимать за текущую основную продуктовую модель.

## Архитектура простыми словами

```text
Telegram
   │
   ├─ /start, WebApp, share links
   ▼
Telegram bot (bot/main.py)
   │
   ▼
FastAPI (app/main.py)
   │
   ├─ Telegram auth
   ├─ markets / profiles / account
   ├─ quote / orderbook / orders
   ├─ P2P matching
   ├─ settlement
   └─ history / statistics
   │
   ▼
Database
   ├─ users
   ├─ markets
   ├─ p2p_orders
   ├─ p2p_fills
   ├─ p2p_money_entries
   └─ settlement/history data
```

Frontend **не должен сам решать**, сколько денег списать, кого с кем сматчить или сколько выплатить. Источник истины для денег и исполнения — backend.

## Где что лежит

```text
betton/
├── app/
│   ├── main.py                 # FastAPI routes, /health, /webhook, Mini App hosting
│   ├── config.py               # env/settings
│   ├── database.py             # DB/session/schema checks
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # API DTO
│   ├── telegram_auth.py        # проверка Telegram initData
│   ├── lmsr.py                 # legacy LMSR
│   ├── services/
│   │   ├── p2p_service.py      # P2P quote, placement, matching
│   │   ├── p2p_ledger.py       # P2P money journal
│   │   ├── market_service.py   # общая/legacy market logic
│   │   ├── discovery.py        # feed/account/creator read models
│   │   └── history.py          # история операций
│   └── static/                 # legacy HTML/CSS/JS Mini App
│
├── bot/
│   └── main.py                 # Telegram bot, /start, WebApp links
│
├── docs/
│   ├── HANDOFF.md              # что сейчас происходит и куда смотреть
│   ├── p2p.md                  # P2P-механика и API
│   ├── money-migration.md      # integer-money notes
│   └── collateral.md           # заметки по обеспечению
│
├── tests/                      # backend tests
├── requirements.txt
├── .env.example
└── main.py                     # compatibility entry point
```

В `feature/react-full-preview` дополнительно есть:

```text
frontend/                       # React + TypeScript preview
scripts/                        # demo/dev scripts
start-betton-always-on.bat      # локальный demo launcher
```

## P2P: ключевые понятия

### Быстрая ставка

Простой UX поверх существующей ликвидности. Backend проверяет, сколько реально можно исполнить против других пользователей. Для авторизованного пользователя используется персональная ликвидность `available_to_me`, чтобы пользователь не исполнил собственную заявку сам об себя.

### Своя цена

Пользователь создаёт **limit**-заявку. Часть может исполниться сразу, остаток может остаться в стакане и ждать контрагента.

### IOC

Для Quick Trade используется IOC-поведение: исполняется доступная часть, а неисполненный остаток не превращается в новую resting-заявку.

### Стакан

`orderbook` показывает уровни предложений и доступный объём. Реальное исполнение всё равно подтверждается backend preview/place, а не расчётом frontend.

### История сделок

График P2P должен строиться только по **реально исполненным fills**. Нельзя использовать случайные или fixture-данные в connected runtime.

## Деньги — зона повышенного риска

Денежная логика использует integer/nano-представление.

Особенно осторожно менять:

```text
app/services/p2p_service.py
app/services/p2p_ledger.py
settlement logic
auth / Telegram initData verification
money helpers
```

Перед изменениями в этих частях сначала прочитайте тесты, `docs/p2p.md` и `docs/money-migration.md`.

## Доступ к событиям

Сейчас реально используются два режима:

- `public` — публичное событие;
- `unlisted` — событие по ссылке/share token, скрытое из общей ленты.

`unlisted` — **не** полноценный allowlist-private для выбранных аккаунтов.

Share-ссылка может иметь вид:

```text
https://t.me/<bot>?start=market_<TOKEN>
```

В React preview также используется fallback:

```text
/v2/?share=<TOKEN>
```

## Telegram auth

Защищённые действия используют проверенный Telegram `initData`:

```text
Authorization: tma <initData>
```

Frontend не должен обходить эту проверку или подставлять фиктивного пользователя для денежных операций.

## Frontend

### Legacy UI

```text
app/static/
```

Обычный HTML/CSS/JavaScript. Он остаётся функциональным reference/fallback.

### React preview

На ветке `feature/react-full-preview`:

```text
frontend/
```

Стек:

- React
- TypeScript
- Vite
- TanStack Query
- CSS Modules / CSS variables
- Storybook
- Vitest
- Playwright visual tests

React не является обязательным требованием для финального продукта: frontend можно позже реализовать на vanilla JS по тем же API и дизайн-макетам.

## Что есть в актуальном preview

В рабочей preview-ветке реализованы/подключены:

- feed, search, sort, filters;
- Quick Trade;
- Own Price / limit orders;
- orderbook;
- график по реальным P2P fills;
- positions / orders / history;
- cancel order;
- создание `public` / `unlisted` рынка;
- share links;
- personal/public creator profile;
- TOP creators;
- admin/moderation;
- RU / EN / 中文;
- Telegram light/dark theme;
- Telegram BackButton;
- wallet shell.

## Что пока не является настоящей blockchain-функцией

Wallet сейчас — **UI shell**, а не on-chain кошелёк.

Нет полноценного:

- TON Connect;
- Solana adapter;
- RPC integration;
- реального deposit address;
- on-chain deposit;
- on-chain withdraw.

Не имитировать успешные blockchain-транзакции и не показывать выдуманные адреса.

## Локальный запуск backend

Windows:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Проверка:

```text
http://127.0.0.1:8000/health
http://127.0.0.1:8000/
```

### React preview

```bash
git switch feature/react-full-preview
cd frontend
npm install
npm run build
cd ..
```

После сборки FastAPI обслуживает:

```text
/      legacy UI
/v2/   React preview
```

Для текущего локального demo workflow:

```text
start-betton-always-on.bat
```

Cloudflare Quick Tunnel временный; его URL может измениться после перезапуска туннеля.

## Основные env-переменные

```text
DATABASE_URL
BOT_TOKEN
MINI_APP_URL
PUBLIC_BASE_URL
ADMIN_TELEGRAM_ID
TIP_CAP
```

Не коммитить реальные токены и секреты.

## Тесты

Backend:

```bash
python -m pytest tests --ignore=tests/test_p2p_journal_postgres.py
```

React preview:

```bash
cd frontend
npm test
npm run build
npm run build-storybook
npm run test:visual
```

## Если нужно разобраться за 15 минут

1. `README.md` — карта проекта и правильная ветка.
2. `docs/HANDOFF.md` — текущее состояние и ограничения.
3. `docs/p2p.md` — matching, quote, orderbook, partial fills.
4. `app/schemas.py` — API contracts.
5. `app/main.py` — endpoints.
6. `app/services/p2p_service.py` — исполнение заявок.
7. `app/services/p2p_ledger.py` — движение денег.
8. `bot/main.py` — Telegram entry points.
9. `app/static/` — legacy UI.
10. `frontend/` — актуальный preview UI на `feature/react-full-preview`.

## Что не менять «по пути»

Без отдельной задачи и тестов не менять:

- сервисный сбор 1%;
- split 75/25;
- matching;
- self-match protection;
- integer money;
- settlement;
- Telegram auth HMAC/TTL;
- unlisted access;
- схему БД.

## Для передачи разработчику

Если нужно продолжить **актуальную версию продукта**:

```bash
git fetch origin
git switch feature/react-full-preview
```

Дальше читать:

```text
README.md
→ docs/HANDOFF.md
→ docs/p2p.md
→ frontend/README.md
```

Если задача — изучить только стабильную основную ветку без React preview, оставайтесь на `main`.
