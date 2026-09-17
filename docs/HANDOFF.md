# BetTON handoff

Актуально для передачи проекта новому разработчику.

## Куда смотреть в первую очередь

Если цель — продолжать **актуальную версию BetTON**, работайте из ветки:

```bash
feature/react-full-preview
```

Она содержит текущий React preview и открыта отдельным Draft PR **#15**. Это ещё не `main`.

Ветки сейчас следует понимать так:

- `main` — консервативная основа: backend, Telegram bot, P2P, legacy Mini App;
- `feature/react-full-preview` — текущая рабочая/демонстрационная версия продукта и UI;
- `/` — legacy Mini App;
- `/v2/` — React preview в `feature/react-full-preview`.

Перед началом работы:

```bash
git fetch origin
git switch feature/react-full-preview
git branch --show-current
git log -5 --oneline
```

Не хранить в документации «вечный текущий HEAD»: SHA быстро устаревает. Источник истины — сама ветка и Draft PR #15.

## Что такое BetTON сейчас

BetTON — Telegram Mini App с **P2P prediction market**.

Платформа не должна изображаться как классический букмекер. Пользователи создают и принимают предложения друг друга.

Основной поток:

```text
Пользователь A выставляет заявку
→ пользователь B принимает её полностью или частично
→ backend выполняет matching
→ деньги и резерв фиксируются backend
→ при resolution settlement определяет выплаты
```

Если встречной ликвидности нет — мгновенной ставки нет.

### Quick Trade

Quick Trade — простой UX поверх доступной P2P-ликвидности. Это IOC-сценарий: backend preview показывает, сколько реально может исполниться сейчас.

Для авторизованного пользователя используется `available_to_me`, чтобы собственная заявка пользователя не считалась доступной ему же ликвидностью.

### Own Price

Own Price — limit order. Часть заявки может исполниться сразу; остаток может остаться в стакане и ждать встречного пользователя.

### Частичное исполнение

Partial fill — нормальная ситуация и должна честно отображаться UI.

Frontend не должен вычислять matching самостоятельно.

## Экономика

Каноническая пользовательская формулировка:

> **Сервисный сбор — 1% только с чистой прибыли победителя.**

Нет отдельной комиссии за создание события или размещение заявки.

В существующей settlement/ledger-логике этот 1% в предусмотренных кодом случаях распределяется:

- 75% — автору события;
- 25% — платформе.

Это split одного и того же 1%, не дополнительная комиссия.

Не менять эти правила без отдельной продуктовой задачи и полного тестирования.

## P2P — основной механизм

Основной актуальный механизм — P2P order book/matching.

Legacy LMSR остаётся в репозитории только для старых рынков и совместимости.

Не путать:

- P2P: цена определяется заявками пользователей;
- LMSR: цена рассчитывается AMM.

React preview не должен притворяться, что LMSR — это P2P стакан.

## Текущая архитектура

```text
Telegram
   │
   ├─ /start
   ├─ WebApp
   └─ share/start_param
   │
   ▼
bot/main.py
   │
   ▼
app/main.py (FastAPI)
   │
   ├─ auth
   ├─ markets
   ├─ users/account/profile
   ├─ order preview/place/cancel
   ├─ orderbook
   ├─ trade history
   ├─ moderation
   └─ webhook
   │
   ▼
services
   ├─ p2p_service.py
   ├─ p2p_ledger.py
   ├─ discovery.py
   ├─ history.py
   └─ market_service.py
   │
   ▼
Database
```

## Где что лежит

### Backend

```text
app/main.py
```

Главные API routes, `/health`, Telegram webhook, hosting `/` и `/v2/`.

```text
app/config.py
```

env/settings.

```text
app/database.py
```

DB setup, sessions, schema guards.

```text
app/models.py
```

SQLAlchemy models: users, markets, orders, fills, ledger, settlements.

```text
app/schemas.py
```

API request/response contracts.

```text
app/telegram_auth.py
```

Telegram initData HMAC/TTL verification.

### P2P

```text
app/services/p2p_service.py
```

Quote, matching, IOC/LIMIT placement, partial fills, self-match protection.

```text
app/services/p2p_ledger.py
```

Immutable P2P money journal / reconciliation.

### Read models

```text
app/services/discovery.py
app/services/history.py
```

Feed, creator/account statistics, transaction history.

### Telegram bot

```text
bot/main.py
```

`/start`, WebApp buttons, share/start_param flow.

### Legacy frontend

```text
app/static/
```

HTML/CSS/JS Mini App. Полезен как функциональный reference/fallback.

### React preview

```text
frontend/
```

Есть в `feature/react-full-preview`.

Стек:

- React + TypeScript
- Vite
- TanStack Query
- CSS Modules / design tokens
- Storybook
- Vitest
- Playwright visual tests

## Что есть в React preview

Текущий preview включает:

- feed;
- search;
- New / Popular / Closing;
- categories/status filters;
- TOP creators;
- Market Detail;
- Quick Trade;
- Own Price;
- orderbook;
- trade-history chart по реальным P2P fills;
- positions;
- open orders;
- transaction history;
- cancel order;
- create public market;
- create unlisted/by-link market;
- share link;
- personal profile;
- public creator profile;
- wallet shell;
- Help;
- RU / EN / 中文;
- Telegram light/dark theme;
- Telegram BackButton;
- admin moderation.

## Public / unlisted

Backend реально поддерживает:

```text
public
unlisted
```

`unlisted` — событие по ссылке/share token и не показывается в общей публичной ленте.

Это не account-allowlist private market.

Нельзя описывать `unlisted` так, будто доступ ограничен списком выбранных аккаунтов.

Share flow:

```text
https://t.me/<bot>?start=market_<TOKEN>
```

React preview имеет fallback:

```text
<public-base>/v2/?share=<TOKEN>
```

## Trade history / chart

График в connected runtime должен строиться только по реальным `p2p_fills`.

Текущий read-only endpoint:

```text
GET /markets/{id}/trades
```

Для последних N fills backend выбирает последние записи и возвращает их в хронологическом порядке для графика.

Не добавлять случайные/fixture точки в live connected UI.

## Orderbook

Endpoint:

```text
GET /markets/{id}/orderbook
```

Public book используется для отображения стакана.

Quick Trade для пользователя должен использовать `available_to_me`, а не просто суммировать public sides на клиенте.

Frontend не является источником истины для того, что реально исполнится.

## Auth

Защищённые вызовы используют:

```text
Authorization: tma <initData>
```

Не ослаблять проверку подписи/TTL.

`AUTH_MAX_AGE_SECONDS` сейчас должен оставаться 3600, если нет отдельной согласованной задачи.

## Money safety

Денежная логика — зона повышенного риска.

Не менять без отдельного review:

- integer/nano money;
- matching;
- self-match protection;
- service fee;
- 75/25 split;
- settlement;
- ledger;
- auth semantics;
- idempotency `request_id`.

Frontend после write должен refetch/invalidates, а не оптимистично придумывать новый баланс.

## Wallet

Wallet сейчас — UI shell.

Реального on-chain модуля пока нет.

Не реализовано:

- TON Connect;
- Solana adapter;
- реальный deposit address;
- RPC;
- on-chain deposit;
- on-chain withdraw.

UI должен честно показывать unavailable state и не имитировать успешные blockchain операции.

## React navigation

Top-level:

```text
Markets
Create
Portfolio
```

Secondary routes:

```text
Market Detail
Own Price
Profile
Public Profile
Wallet
Help
My Markets
History
Moderation
Create Result
```

Secondary screen должен иметь рабочий Back и Telegram BackButton.

Не превращать каждое переключение внутренней вкладки в новую запись history stack.

## Telegram theme

React preview поддерживает Telegram light/dark theme.

Design должен использовать CSS tokens и не превращать dark mode в neon/crypto/casino style.

## Локальный запуск React preview

```bash
git switch feature/react-full-preview
cd frontend
npm install
npm run build
cd ..
```

Далее backend:

```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

или текущий локальный demo launcher:

```text
start-betton-always-on.bat
```

В preview-ветке:

```text
/      -> legacy Mini App
/v2/   -> React preview
/health
```

Для Telegram нужен публичный HTTPS URL. Quick Tunnel URL может меняться.

## Тесты

Backend:

```bash
python -m pytest tests --ignore=tests/test_p2p_journal_postgres.py
```

Frontend:

```bash
cd frontend
npm test
npm run build
npm run build-storybook
npm run test:visual
```

PostgreSQL journal tests требуют отдельного подходящего окружения.

## Demo / QA

Если нужен demo seed/QA, сначала читать:

```text
docs/DEMO_QA.md
```

Не запускать seeder на live/user DB автоматически.

Перед любыми экспериментами с локальной SQLite DB сделать backup.

## Что сейчас намеренно не завершено

- blockchain deposit/withdraw;
- настоящий allowlist-private;
- полная замена legacy LMSR;
- production merge/deploy React preview;
- отдельный security/audit pass перед реальными средствами.

## Что разработчику не нужно делать первым делом

Не надо начинать с:

- переписывания backend;
- изменения fee math;
- новой БД;
- новой matching-модели;
- удаления legacy UI;
- миграции на другой frontend framework.

Сначала нужно поднять текущую ветку и пройти existing flows.

## Рекомендуемый порядок изучения

```text
1. README.md
2. docs/HANDOFF.md
3. docs/p2p.md
4. frontend/README.md
5. app/schemas.py
6. app/main.py
7. app/services/p2p_service.py
8. app/services/p2p_ledger.py
9. bot/main.py
10. tests/
```

## Исторический контекст

До текущего React preview проект прошёл несколько этапов: integer-money, P2P matching, ledger, beta UI, `feature/vasily-product`, static Mini App polish и затем React preview.

Старые ветки/PR полезны как история решений, но **не являются текущей точкой продолжения разработки**.

Если нужна именно история прошлых этапов, смотрите git log / старые PR, а не используйте старый HANDOFF как текущую инструкцию.

## Передача проекта

Короткое сообщение новому программисту можно дать такое:

> Актуальная рабочая версия находится в `feature/react-full-preview`, Draft PR #15. `main` — более старый стабильный baseline. Сначала прочитай README, затем `docs/HANDOFF.md`, `docs/p2p.md` и `frontend/README.md`. Backend является источником истины для денег, matching и settlement; React — текущая оболочка preview.
