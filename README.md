# BetTON

**BetTON** — Telegram Mini App с P2P-рынком прогнозов. Пользователи создают события и выставляют предложения друг другу; платформа не выступает букмекером и не обязана сама обеспечивать ликвидность.

> Если нужно быстро передать проект новому программисту: начните с этого README, затем откройте `docs/HANDOFF.md` и `docs/p2p.md` в рабочей ветке.

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
│   └── DEMO_QA.md              # demo/QA сценарии в dev-ветке
│
├── tests/                      # backend tests
├── scripts/                    # dev/demo scripts в новых ветках
├── frontend/                   # React + TS preview, есть в feature/react-full-preview
├── requirements.txt
├── .env.example
└── main.py                     # маленькая точка входа/совместимость
```

`frontend/` отсутствует в старых состояниях `main` и появляется в React preview-ветке.

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

Для P2P история цены должна строиться только по **реально исполненным fills**. Нельзя рисовать случайный или fixture-график в connected runtime.

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

`unlisted` — это **не полноценный allowlist-private** для выбранных аккаунтов. Не следует описывать его как такую функцию.

Share-механика использует `share_token`; Telegram-ссылка может иметь вид:

```text
https://t.me/<bot>?start=market_<TOKEN>
```

или прямую WebApp-ссылку `/v2/?share=<TOKEN>` в preview-ветке.

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

Обычный HTML/CSS/JavaScript. Это всё ещё полезный функциональный референс: часть UX и старых сценариев проще проверить здесь.

### React preview

В `feature/react-full-preview`:

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

В актуальной preview-ветке подключены или предусмотрены:

- лента, поиск, сортировка и фильтры;
- Quick Trade;
- Own Price / limit orders;
- стакан;
- история реальных P2P fills для графика;
- позиции, заявки, история;
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

Для Telegram Mini App нужен публичный HTTPS URL.

### Preview-ветка

В `feature/react-full-preview` можно собрать React:

```bash
cd frontend
npm install
npm run build
cd ..
```

После этого FastAPI обслуживает:

```text
/      legacy
/v2/   React build
```

Для текущего локального demo workflow в preview-ветке есть:

```text
start-betton-always-on.bat
```

Он предназначен для локального запуска backend + built frontend + Cloudflare Quick Tunnel. Перед использованием нужно понимать, что Quick Tunnel URL временный.

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

## Тесты

Backend:

```bash
python -m pytest tests --ignore=tests/test_p2p_journal_postgres.py
```

PostgreSQL journal tests запускаются отдельно в подходящем окружении.

В React preview:

```bash
cd frontend
npm test
npm run build
npm run build-storybook
npm run test:visual
```

## Если нужно разобраться в проекте за 15 минут

Рекомендуемый порядок чтения:

1. `README.md` — общая карта проекта.
2. `docs/p2p.md` — как работают заявки, коэффициенты и matching.
3. `app/schemas.py` — какие данные принимает/возвращает API.
4. `app/main.py` — доступные endpoints.
5. `app/services/p2p_service.py` — исполнение заявок.
6. `app/services/p2p_ledger.py` — движение денег.
7. `bot/main.py` — Telegram entry points.
8. `app/static/` — legacy UI.
9. `frontend/` — новый preview UI, если открыта `feature/react-full-preview`.
10. `docs/HANDOFF.md` — подробная история решений и текущие ограничения.

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
- legacy LMSR всё ещё существует для старых рынков;
- preview UI развивается в отдельной ветке и Draft PR;
- Quick Tunnel предназначен только для локальной демонстрации;
- перед реальными денежными интеграциями нужен отдельный security/audit pass.

## Для передачи разработчику

Если задача — продолжить **актуальную демонстрационную версию**, передайте разработчику репозиторий и скажите начать с:

```bash
git fetch origin
git switch feature/react-full-preview
```

Затем:

```text
README.md
→ docs/p2p.md
→ docs/HANDOFF.md
→ frontend/README.md
```

Если задача — изучить только текущую основную ветку без preview UI, оставайтесь на `main`.
