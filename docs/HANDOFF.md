# BetTON handoff

2026-09-12. Merge в `main`, деплой и рестарт Render **не разрешены**.

## Текущее состояние

Не хранить «текущий HEAD» здесь: любой SHA в этой ячейке устаревает следующим коммитом. Ниже — стабильные точки кода.

| Что | Значение |
| --- | --- |
| Репозиторий | https://github.com/mezdmal-byte/betton |
| Рабочая ветка | `feature/beta-ui` (от `feature/integer-money`) |
| Sprint 2 Mini App code | `b5d0fdb994b26595d6dfc7296119ca4e5f1fc0a1` |
| Sprint 1 Mini App code | `05c9b44734040b7cde6486ae6c539b6fe174454d` |
| Точка ветки до UI | `88da7c7ed3be210d2bb2e204b876f51449096b56` (HANDOFF) |
| Основа integer-money | `6b0bc658ee20c1293eeeb74469f5adbb935fb80b` |
| PR №11 | [draft / open](https://github.com/mezdmal-byte/betton/pull/11) `feature/beta-ui` → `feature/integer-money`, **не слит**. Title: Beta UI Sprint 1–2 |
| Final Live UI Polish code | `9acdb716482773926a072e3a47b38ad5ebad60db` |
| PR №10 | [draft / open](https://github.com/mezdmal-byte/betton/pull/10) `feature/integer-money`, **не слит** |
| `origin/main` | `23fa84d417e21cbb954cb6ebcb7087ac1910cb36` (PR №9). **Не менять.** |
| Production Render | `srv-daffpoon74is739r4csg`, Free, auto-deploy с `main`. **Не деплоить и не перезапускать.** |

integer-money уже внутри ветки. Production storage migration — **DEFERRED**.

## Что сделано в Beta UI / UX sprint 1

Светлая Mini App-тема (fintech / prediction market, без золота и казино-эстетики). Нижняя навигация: **Лента / Создать / Мои** (+ Модерация у админа). Шапка: BetTON + доступный баланс в TON, без nanoTON и без имени пользователя.

Лента — компактные карточки: вопрос, два исхода, срок приёма, статус (активно / приём завершён / завершено / отменено). При `pot == 0` не утверждаем отсутствие заявок в стакане: «Сделок пока нет · откройте событие…». Клик открывает **страницу события** с формой заявки, YES/NO, стаканом предложений и preview исполнения.

Форма заявки показывает, что исполнится сразу, что останется заявкой, встречный объём и что будет при отмене события. Частичное исполнение — не ошибка. Legacy LMSR и админ-действия сохранены.

## Что сделано в Beta UI / UX sprint 2

«Мои» объясняет, где деньги: доступный баланс в шапке; заявки с событием, исходом, коэффициентом, исходной суммой, исполнено / в резерве / возвращено; статусы человеческим языком (**Ожидает контрагента / Частично исполнена / Исполнена / Отменена / Приём завершён**). У открытой заявки кнопка **Отменить остаток** и подсказка, что остаток вернётся на доступный баланс. Несколько заявок на одно событие группируются под названием события; бейджи отличают заявку, исполненную ставку и итог события.

P2P-позиция: исход, поставлено, средний коэффициент, возможная выплата, статус события — без внутренних shares. Legacy LMSR по-прежнему показывает доли.

История: вопрос, выбранный исход, победивший исход, сумма ставок, выплата, **Сервисный сбор** при наличии, итог `+X TON` / `-X TON` / `Возврат X TON`. Отмена визуально отделена от проигрыша: «Событие отменено · средства возвращены».

Страница события: статус → вопрос → срок → исходы → компактные предложения → форма заявки → preview → действия. Подробный стакан в `<details>`. Preview выделяет сумму, исполнение сейчас, остаток заявки, коэффициент и выплату только по исполненной части. Если встречного объёма нет — это не ошибка.

Лента: клиентский поиск по вопросу без нового API; категории компактными chips; состояние — один `<select>`. Empty states у разделов «Мои». Mobile: без горизонтального скролла на 320/360/390/430 и desktop preview; клавиатура сдвигает нижнюю навигацию через `visualViewport`.

Экономика, matching, integer nanoTON, auth, migrations, API contracts не менялись.

## Sprint 3 — E2E verification (продукт, не новый функционал)

Проверка beta как целого пользовательского пути на изолированной тестовой БД (`tests/conftest.py`: tempfile SQLite, никогда не production `DATABASE_URL`). Реальные FastAPI endpoints, matching и settlement. Три отдельных аккаунта: User A, User B, Admin. Живые JSON ответов прогоняются через реальные функции Mini App (`orderCard`, `settlementCard`, `p2pCard`, `positionCard`, `feedCard`, `p2pPreviewLines`).

Файл: `tests/test_beta_e2e.py`.

### Сценарий resolve (partial → cancel remainder → full → close → resolve)

1. User A создаёт P2P-событие с исходами Да/Нет. Pending: нет в `GET /markets`, `GET /markets/{id}` = 404, заявка 400, залог 0.
2. Admin approve. Событие появляется в ленте.
3. User A: limit 100 TON @ 2.0 на «Да». Баланс −100 nano-точно; «Мои» → **Ожидает контрагента**; стакан показывает встречное 100 @ 2.0; повтор того же `request_id` не снимает деньги второй раз.
4. User B: 40 TON @ 2.0 на «Нет» → PARTIAL FILL. A: filled 40 / remaining 60; B: filled 40 / remaining 0; pot = 80; позиции A/B 40 stake / 80 payout; 1 fill; journal `reserve×2` + `fill_escrow×2`; reconciliation `fully_verified`.
5. User A отменяет остаток: +60 один раз; filled 40 сохраняется; повторная отмена не меняет баланс и не пишет второй `refund`.
6. Отдельные заявки FULL FILL: A 30 «Да» + B 30 «Нет». Оба filled 30 remaining 0; pot = 140; 2 fills.
7. Admin close. Новая заявка 400. После close remaining не появляется.
8. Admin resolve «Да». pot = 0, `settlement_kind=auto`. A: payout 140, tip 0.70 (создатель-победитель → чаевые целиком платформе), credited 139.30, result +69.30, баланс 1069.30. B: payout 0, tip 0, result −70, баланс 930. Повторный resolve 400, журнал и балансы не меняются. `POST /claim` 400.

UI с живых payload: «Ожидает контрагента» / «Частично исполнена» / «Отменена» / «Исполнена»; история `+69.30 TON` и `-70.00 TON`; нет «Забрать выигрыш» на auto P2P; нет формы заявки после resolve.

### Сценарий void

Второе событие: partial 80/20 и full 25/25, затем admin cancel. Исполненные ставки и незакрытый резерв возвращены; tip = 0; pot = 0; `settlement_kind=void`; A credited 105, B 45; балансы = стартовым. UI: «Событие отменено · средства возвращены». Повторная отмена 200, причина не перезаписывается, второй возврат не создаётся.

### Legacy LMSR

Отдельный рынок: quote + buy, close, auto-resolve, победителю зачисление без claim, проигравшему баланс без лишнего, повторный resolve 400. Conservation nano сохраняется.

### Денежные инварианты

На каждом критичном шаге `sum(balance_nano) + sum(pot_nano) + sum(order.remaining)` константен. `order.amount == filled + remaining + refunded`. Journal reconciliation `fully_verified` после fill/cancel/resolve/void. Чаевые 1% прибыли, существующее правило 75/25, не менялись.

### Найденные ошибки

Продуктовых багов не найдено. Расхождения в черновике E2E (читать maker после taker на full fill; toast частичного fill брать у заявки с remaining > 0) — ошибки теста, не сервиса.

### Результаты тестов

Локально, Windows, SQLite tempfile:

`pytest tests --ignore=tests/test_p2p_journal_postgres.py` → **160 passed, 4 skipped**.

3 новых E2E: `test_beta_e2e_partial_cancel_full_resolve`, `test_beta_e2e_void_partial_and_full`, `test_beta_e2e_legacy_lmsr_regression`.

4 skipped без Node.js на этой машине: `test_load_mine_refreshes_balance_and_keeps_legacy_results` (4 параметра). Остальной JS harness (Sprint 1–2 UI, E2E render) исполняется через Node, если он есть, иначе headless Edge.

GitHub CI до Sprint 3 (job sqlite на `f933e1d`): **161 passed**. Runner image `ubuntu-latest` уже содержит Node, поэтому JS-тесты в SQLite job исполняются, хотя workflow не вызывает `actions/setup-node`. Не утверждать, что «Node отсутствует в GitHub CI».

GitHub CI после Sprint 3 (job sqlite): **164 passed**. Job `postgres` (журнал + integer money + migration + E2E): **37 passed**.

## Final Live UI Polish

Закрытие UX-дефектов живого Telegram WebView. Экономика, matching, integer nanoTON, 1% settlement, auth, migrations, production infra **не менялись**.

### Live issues addressed

- Палитра graphite + teal: фон `#FFFFFF`, surface `#F7F8FA`, текст `#171717`, YES `#20A39E`, NO `#EF5B5B`. Фиолетовый `#23001E` убран. Логотип: **Bet** graphite, **TON** teal. Без градиентов, золота и казино-эстетики.
- Меньше вложенных рамок: внутренние блоки отделяются surface/padding.
- **Лента показывает best odds** из `GET /markets` (`best_offers`), без N+1 `/orderbook` на карточку. Нет предложения → «Нет предложений», коэффициент не выдумывается. Closed/resolved/cancelled → `best_offers: null`.
- Публичный стакан сохранён. Authenticated `GET /markets/{id}/orderbook` дополнительно отдаёт `available_to_me` без заявок текущего пользователя. UI различает «лучшее предложение рынка» и «доступно вам сейчас». «Принять доступное» не включается, если ликвидность только своя. Self-match по-прежнему запрещён.
- Top-of-book на странице события кликабелен: выбирает исход, подставляет коэффициент, делает preview, заявку не отправляет.
- Компактный мини-маркет предложений; полный стакан в `<details>` с tabular numbers.
- CTA «Оставить заявку» — graphite. YES/NO — tinted surface + accent border/text.
- Нижняя навигация: **Проверка** вместо «Модерация», одна строка (`nowrap`) на 320–430 px.
- Telegram `BackButton`: `show` на событии, `hide` при возврате в ленту/раздел, `onClick` = тот же `closeEvent`, что «← К ленте». Handler регистрируется один раз.
- Даты в UI — локальный timezone браузера/WebView, locale `ru-RU`. Backend timestamps без изменений.
- Пользовательские тексты: обязательный **сервисный сбор 1% с чистой прибыли победителя**, не «чаевые». Пример 100 → 180, прибыль 80, сбор 0.80. Ledger `op_type` не переименовывался.
- `bot/main.py` `/start` и `/help`: P2P рынок, нет LMSR как текущей механики, нет гарантированной ликвидности.
- «Мои»: иерархия Доступно / В резерве / Исполнено / Возвращено, tabular numbers.

### Tests

- `tests/test_best_offers.py` — empty / one-side / two-side / closed+resolved; list не вызывает `book()`; own order не executable для того же пользователя.
- `tests/test_live_polish_ui.py` — feed best odds, prefill, local dates, BackButton lifecycle, «Проверка», fee copy без «чаевые».
- `tests/test_bot_texts.py` — START/HELP не обещают LMSR-ликвидность.
- Существующие Sprint 1–3 UI и E2E обновлены под новые тексты.

Локально, Windows, SQLite tempfile: `pytest tests --ignore=tests/test_p2p_journal_postgres.py` → **168 passed, 4 skipped** (те же 4 `loadMine` без Node.js).

GitHub CI после push: sqlite + postgres jobs на PR №11.

### Remaining live limitation

- Второй реальный Telegram-аккаунт для живого E2E matching всё ещё pending.
- Persistent production storage всё ещё **DEFERRED**.
- Merge PR №10 / №11, push `main`, deploy/restart Render — запрещены.

## Страницы

- Лента (`#markets`) — поиск и компактные фильтры
- Событие (`#event-root`)
- Создать
- Мои (заявки по событиям, позиции, созданные, история)
- Модерация (админ)

## API, которые использует UI

Без новых сущностей.

Публичные: `GET /markets` (P2P: `best_offers` top-of-book, без N+1), `GET /markets/{id}`, `GET /markets/{id}/orderbook` (публичный агрегат; при Telegram-сессии ещё `available_to_me`).

Auth: `POST /auth/telegram`, `GET /users/{id}`.

P2P: `POST /markets/{id}/orders/quote`, `POST /markets/{id}/orders`, `GET /users/{id}/orders`, `POST /orders/{id}/cancel`.

LMSR: `POST /markets/{id}/quote`, `POST /markets/{id}/buy`, `POST /markets/{id}/claim`.

Прочее: `POST /markets`, `GET /users/{id}/markets|positions|settlements`, админ `GET /moderation/markets`, `POST /markets/{id}/approve|reject|close|resolve|cancel|collect-residual`.

Лента **не** вызывает orderbook на каждую карточку: `best_offers` считаются одним запросом на сервере из той же агрегации стакана. `pot` — объём уже исполненных сделок. Полный стакан — на странице события.

После внешнего ревью Sprint 1: лента больше не выводит «Нет встречных заявок» из `pot == 0`; после P2P-заявки сначала `GET /users/{id}`, затем перерисовка события и новый quote; Render service ID возвращён к `srv-daffpoon74is739r4csg`; PR №11 переведён в Draft.

## Известные UX / API ограничения

- `GET /markets/{id}` → 404 для pending/rejected; автор открывает такие события из кэша «Мои».
- Quote P2P требует Telegram-сессию; в обычном браузере форма видна, расчёт — после входа.
- Дата в форме создания зависит от локали браузера (`datetime-local`).
- Поиск ленты только клиентский по уже загруженному списку (категория/статус по-прежнему с API).
- Заявки в «Мои» группируются визуально, сущности не сливаются: исполненная ставка остаётся в позициях, итог — в истории.
- Workflow SQLite не пинит Node: JS-тесты идут, пока `ubuntu-latest` отдаёт `node`. Для гарантии нужен `actions/setup-node`.
- Sprint 3 E2E — TestClient + JS-рендер payload, не живая Telegram Mini App-сессия.
- Живой E2E со вторым реальным Telegram-аккаунтом всё ещё pending.

## Следующий этап (не начинать без задачи)

- Второй реальный Telegram-аккаунт: partial/full matching в живом WebView.
- По желанию: `actions/setup-node` в sqlite job, чтобы JS не зависел от image.
- Persistent production storage — DEFERRED.
- Не merge PR №10 / №11, не деплой Render.

## Запрещено до отдельного разрешения

- merge PR №10 в `main`;
- merge PR №11 в `feature/integer-money` или `main`;
- merge `feature/beta-ui` в `main`;
- push/изменение `main`;
- deploy / restart / смена тарифа текущего Render;
- закрытие PR №10.
