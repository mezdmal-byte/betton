# BetTON handoff

Этот файл нужен для быстрой передачи проекта новому разработчику.

## Главное: где актуальная версия

`main` сейчас не содержит весь актуальный preview-интерфейс.

Если задача — продолжать **текущую рабочую версию BetTON**, используйте:

```bash
feature/react-full-preview
```

Там находится React preview и Draft PR **#15**.

```bash
git fetch origin
git switch feature/react-full-preview
```

В этой ветке:

```text
/      -> legacy Mini App
/v2/   -> React preview
```

`main` следует считать более консервативным baseline, а не текущим UI продукта.

## Что такое BetTON

BetTON — Telegram Mini App с P2P prediction market.

Пользователи выставляют заявки друг другу. Платформа не должна вести себя как букмекер с гарантированной собственной ликвидностью.

Основные сценарии:

- Quick Trade — принять доступную встречную ликвидность;
- Own Price — выставить limit-заявку со своим коэффициентом;
- partial fill — нормальное состояние;
- остаток limit-заявки может ждать встречного пользователя;
- пользователь может отменить свой неисполненный остаток.

Backend является источником истины для matching, денег и settlement.

## Экономика

Каноническая пользовательская формулировка:

> **Сервисный сбор — 1% только с чистой прибыли победителя.**

В существующей settlement/ledger-логике этот 1% в предусмотренных кодом случаях делится:

- 75% — автору события;
- 25% — платформе.

Это один сбор, а не две комиссии.

## Основная архитектура

```text
Telegram
  -> bot/main.py
  -> app/main.py (FastAPI)
  -> services
  -> database
```

Ключевые файлы:

```text
app/main.py                  FastAPI endpoints, webhook, hosting
app/schemas.py               API contracts
app/models.py                DB models
app/telegram_auth.py         Telegram initData verification
app/services/p2p_service.py  quote / IOC / LIMIT / matching
app/services/p2p_ledger.py   P2P money journal
app/services/discovery.py    feed / account / creators
app/services/history.py      transaction history
bot/main.py                  Telegram /start and WebApp links
app/static/                  legacy frontend
```

В `feature/react-full-preview` дополнительно:

```text
frontend/                    React + TypeScript preview
start-betton-always-on.bat   local demo launcher
```

## P2P и legacy LMSR

Основная текущая модель — P2P order book/matching.

LMSR остаётся в репозитории для старых рынков/совместимости и не должен восприниматься как основная текущая продуктовая модель.

## Public / unlisted

Реальные режимы доступа:

```text
public
unlisted
```

`unlisted` — событие по share-token/ссылке и скрытое из общей ленты.

Это не настоящий allowlist-private для выбранных аккаунтов.

## Money / auth safety

Без отдельной задачи и тестов не менять:

- integer/nano money;
- matching;
- self-match protection;
- service fee;
- 75/25 split;
- settlement;
- request_id idempotency;
- Telegram auth HMAC/TTL;
- unlisted access rules.

## Текущий React preview

В актуальной рабочей ветке реализованы/подключены:

- feed/search/sort/filters;
- Quick Trade;
- Own Price;
- orderbook;
- chart по реальным P2P fills;
- positions/orders/history;
- cancel order;
- public/unlisted create;
- share links;
- personal/public creator profiles;
- TOP creators;
- moderation;
- RU/EN/中文;
- Telegram light/dark theme;
- Telegram BackButton;
- wallet shell.

Wallet пока не является настоящим on-chain кошельком: реальных deposit/withdraw, TON Connect и Solana integration нет.

## Что читать дальше

Для актуальной разработки после переключения на `feature/react-full-preview`:

```text
README.md
→ docs/HANDOFF.md
→ docs/p2p.md
→ frontend/README.md
```

После этого:

```text
app/schemas.py
app/main.py
app/services/p2p_service.py
app/services/p2p_ledger.py
bot/main.py
tests/
```

## Короткая инструкция программисту

> `main` — baseline. Актуальная рабочая версия находится в `feature/react-full-preview`, Draft PR #15. Сначала переключись на неё и прочитай README/HANDOFF/p2p/frontend README. Backend — источник истины для денег, matching и settlement; React сейчас является preview-оболочкой.
