# BetTON

**BetTON** — Telegram Mini App с P2P-рынком прогнозов. Пользователи создают события и выставляют предложения друг другу; платформа не выступает букмекером и не обязана сама обеспечивать ликвидность.

> Если нужно быстро передать проект новому программисту: начните с этого README, затем откройте `docs/HANDOFF.md` и `docs/p2p.md`.

## В двух словах — как это работает

Пример события:

> «Пойдёт ли завтра дождь?»

Есть два исхода, например **Да / Нет**. Пользователь может:

1. принять уже существующее предложение по доступному коэффициенту — **Быстрая ставка**;
2. выставить свой коэффициент — **Своя цена**;
3. дождаться встречной заявки другого пользователя;
4. отменить неисполненный остаток своей заявки.

Сделка заключается **между пользователями**. Если встречной ликвидности нет, мгновенного исполнения нет. Частичное исполнение — нормальная часть P2P-модели.

### Сервисный сбор

**Сервисный сбор — 1% только с чистой прибыли победителя.**

Это не комиссия за создание события и не комиссия за размещение заявки. В существующей settlement-логике этот 1% распределяется между автором события и платформой в соотношении **75% / 25%** в предусмотренных кодом случаях. Это внутреннее распределение одного и того же сбора, а не дополнительная комиссия.

## Что сейчас является основной моделью

Основное направление BetTON — **P2P order book / matching**.

В репозитории также остаётся старый механизм **LMSR** для совместимости со старыми рынками. Его не следует принимать за текущую продуктовую модель и не нужно смешивать с P2P-котировками.

Главное отличие:

- **P2P**: цену и ликвидность создают заявки пользователей;
- **LMSR**: цену автоматически рассчитывает маркетмейкер.

## Ветки и текущее состояние

### `main`

Консервативная основная ветка. Здесь есть backend, Telegram-бот, P2P-логика и legacy Mini App.

Legacy интерфейс обслуживается с:

```text
/
```

### `feature/react-full-preview`

Текущая демонстрационная ветка нового интерфейса. Она открыта как Draft PR **#15** и не должна считаться слитой в `main`.

В ней:

```text
/      -> legacy Mini App
/v2/   -> новый React preview
```

Если программисту нужно посмотреть **самое актуальное состояние продукта и UI**, начинать лучше с:

```bash
git switch feature/react-full-preview
```

## Архитектура простыми словами

```text
Telegram
   │
   ├─ /start, WebApp, share links
   │
   ▼
Telegram bot (bot/main.py)
   │
   ▼
FastAPI (app/main.py)
   │
   ├─ авторизация Telegram initData
   ├─ рынки / пользователи / профиль
   ├─ заявки / quote / orderbook
   ├─ matching P2P
   ├─ settlement
   └─ read-only история / статистика
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

Интерфейс **не должен сам решать**, сколько денег списать, кого с кем сматчить или сколько выплатить. Источник истины для денег и исполнения — backend.

## Где что лежит

```text
betton/
├── app/
│   ├── main.py                 # FastAPI routes, /health, /webhook, Mini App hosting
│   ├── config.py               # env/settings
│   ├── database.py             # DB setup/session/schema checks
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # API DTO / request-response schemas
│   ├── telegram_auth.py        # проверка Telegram initData
│   ├── lmsr.py                 # legacy LMSR, не основная P2P-модель
│   ├── services/
│   │   ├── p2p_service.py      # P2P quote, order placement, matching
│   │   ├── p2p_ledger.py       # журнал движения денег P2P
│   │   ├── market_service.py   # общая/legacy market logic
│   │   ├── discovery.py        # feed/account/creator read models
│   │   └── history.py          # история операций
│   └── static/                 # legacy HTML/CSS/JS Mini App
│
├── bot/
│   └── main.py                 # Telegram bot, /start, WebApp links
│
├── docs/
│   ├── HANDOFF.md              # подробная история и handoff проекта
│   ├── p2p.md                  # P2P-механика и API
│   ├── money-migration.md      # integer-money / migration notes
│   ├── collateral.md           # заметки по обеспечению
│   └── DEMO_QA.md              # demo/QA сценарии
│
├── tests/                      # backend tests
├── scripts/                    # dev/demo scripts
├── frontend/                   # React + TS preview
├── requirements.txt
├── .env.example
├── start-betton-always-on.bat  # локальный preview launcher
└── main.py                     # маленькая точка входа/совместимость
```

## P2P: важные понятия

### Быстрая ставка

Простой UX поверх существующей ликвидности. Backend проверяет, сколько реально можно исполнить против других пользователей. Для авторизованного пользователя используется персональная доступная ликвидность (`available_to_me`), чтобы его собственная заявка не исполнилась сама об себя.

### Своя цена

Пользователь создаёт **limit**-заявку. Часть может исполниться сразу, остаток может остаться в стакане и ждать контрагента.

### IOC

Для быстрой ставки используется поведение **IOC**: исполняется доступная часть, неисполненный остаток не остаётся висеть как новая заявка и обрабатывается backend согласно текущей логике.

### Стакан

`orderbook` показывает уровни предложений и доступный объём. Он информационный; реальное исполнение всё равно подтверждается backend preview/place, а не вычислениями frontend.

### История сделок

Для P2P история цены строится только по **реально исполненным fills**. В connected runtime нельзя рисовать случайный или fixture-график.

## Деньги — зона повышенного риска

Денежная логика использует integer/nano-представление. При изменениях нельзя заменять её вычислениями на JS `float` или обычные Python float там, где уже используется integer money.

Особенно осторожно менять:

```text
app/services/p2p_service.py
app/services/p2p_ledger.py
settlement logic
auth / telegram initData verification
money conversion helpers
```

Перед изменениями в этих частях нужно сначала прочитать тесты и `docs/p2p.md` / `docs/money-migration.md`.

## Доступ к событиям

Сейчас используются два реальных режима:

- `public` — публичное событие;
- `unlisted` — событие по ссылке/share token, не показывается в общей ленте.

`unlisted` — это **не полноценный allowlist-private** для выбранных аккаунтов.

Share-механика использует `share_token`. Telegram-ссылка может иметь вид:

```text
https://t.me/<bot>?start=market_<TOKEN>
```

или direct WebApp fallback:

```text
<public-base>/v2/?share=<TOKEN>
```

## Telegram auth

Защищённые действия используют проверенный Telegram `initData`:

```text
Authorization: tma <initData>
```

Backend проверяет подпись и срок действия. Frontend не должен обходить эту проверку и не должен подставлять фиктивного пользователя для денежных операций.

## Frontend

### Legacy

```text
app/static/
```

Обычный HTML/CSS/JavaScript. Это всё ещё полезный функциональный референс.

### React preview

```text
frontend/
```

Стек:

- React
- TypeScript
- Vite
- TanStack Query
- CSS Modules + CSS variables
- Storybook
- Vitest
- Playwright visual tests

React не является обязательным требованием для финального продукта: UI можно позже реализовать на vanilla JS по тем же API и дизайн-макетам. Backend от этого меняться не должен.

## Что уже есть в React preview

- лента, поиск, сортировка и фильтры;
- Quick Trade;
- Own Price / limit orders;
- стакан;
- история реальных P2P fills для графика;
- позиции, заявки, история операций;
- отмена заявки;
- создание public/unlisted события;
- share links;
- профиль и публичный профиль автора;
- TOP creators;
- admin/moderation;
- RU / EN / 中文;
- Telegram light/dark theme;
- Telegram BackButton;
- wallet shell.

## Что пока намеренно не работает как реальная blockchain-функция

Wallet сейчас — **оболочка**, а не on-chain кошелёк.

Нет полноценного:

- TON Connect;
- Solana adapter;
- RPC integration;
- реального deposit address;
- on-chain deposit;
- on-chain withdraw.

UI не должен имитировать успешные blockchain-транзакции или показывать выдуманный адрес.

## Локальный запуск

### Самый простой вариант для текущего preview

На Windows из корня проекта:

```text
start-betton-always-on.bat
```

Launcher:

1. проверяет рабочую ветку;
2. при необходимости собирает `frontend/dist`;
3. запускает FastAPI/uvicorn;
4. запускает/держит Cloudflare Quick Tunnel;
5. печатает текущий Git HEAD, `/`, `/v2/` и `/health`.

Quick Tunnel URL временный.

### Ручной backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### React build

```bash
cd frontend
npm install
npm run build
cd ..
```

FastAPI обслуживает:

```text
/      legacy
/v2/   React build
```

## Основные env-переменные

Смотрите `.env.example`.

Ключевые:

```text
DATABASE_URL
BOT_TOKEN
MINI_APP_URL
PUBLIC_BASE_URL
ADMIN_TELEGRAM_ID
TIP_CAP
```

Не коммитить реальные токены и секреты.

## Полезные API для понимания проекта

Основные группы:

```text
POST /auth/telegram
GET  /markets
GET  /markets/{id}
GET  /markets/{id}/orderbook
GET  /markets/{id}/trades
POST /markets/{id}/orders/quote
POST /markets/{id}/orders
POST /orders/{id}/cancel
POST /markets
GET  /users/{id}/account
GET  /users/{id}/positions
GET  /users/{id}/orders
GET  /users/{id}/transactions
GET  /creators/{id}
GET  /creators/top
```

Admin/moderation endpoints находятся в `app/main.py`.

## Тесты

Backend:

```bash
python -m pytest tests --ignore=tests/test_p2p_journal_postgres.py
```

PostgreSQL journal tests запускаются отдельно в подходящем окружении.

Frontend:

```bash
cd frontend
npm test
npm run build
npm run build-storybook
npm run test:visual
```

## Если нужно разобраться в проекте за 15 минут

Читать в таком порядке:

1. `README.md` — общая карта.
2. `docs/p2p.md` — заявки, odds, partial fill, matching.
3. `app/schemas.py` — формы API.
4. `app/main.py` — endpoints.
5. `app/services/p2p_service.py` — P2P исполнение.
6. `app/services/p2p_ledger.py` — денежный журнал.
7. `bot/main.py` — Telegram `/start` и WebApp.
8. `frontend/README.md` — новый frontend.
9. `frontend/src/app/ConnectedApp.tsx` — навигация/склейка экранов.
10. `docs/HANDOFF.md` — подробная история решений и ограничения.

## Что не следует менять «по пути»

Без отдельной причины и тестов не менять одновременно:

- формулу сервисного сбора;
- split 75/25;
- matching;
- self-match protection;
- integer money;
- settlement;
- auth HMAC / TTL;
- правила доступа unlisted;
- схему БД.

Frontend должен запрашивать preview/quote у backend и считать ответ backend источником истины.

## Текущие известные ограничения

- нет настоящего blockchain deposit/withdraw;
- нет account-allowlist private markets;
- legacy LMSR остаётся для старых рынков;
- React UI пока находится в отдельной preview-ветке и Draft PR;
- Quick Tunnel предназначен только для локальной демонстрации;
- перед реальными денежными интеграциями нужен отдельный security/audit pass.

## Для передачи разработчику

Самое актуальное состояние продукта сейчас:

```bash
git fetch origin
git switch feature/react-full-preview
```

Затем читать:

```text
README.md
→ docs/p2p.md
→ frontend/README.md
→ docs/HANDOFF.md
```

Если разработчику нужен только консервативный backend/legacy snapshot, можно отдельно посмотреть `main`, но для продолжения текущей версии ориентир — `feature/react-full-preview`.
