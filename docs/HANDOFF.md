# BetTON handoff

2026-09-12. Merge в `main`, деплой и рестарт Render **не разрешены**.

## Текущее состояние

Не хранить «текущий HEAD» здесь: любой SHA в этой ячейке устаревает следующим коммитом. Ниже — стабильные точки кода.

| Что | Значение |
| --- | --- |
| Репозиторий | https://github.com/mezdmal-byte/betton |
| Рабочая ветка | `feature/vasily-product` (строго от актуального `feature/beta-ui`) |
| База beta-ui | `a66a81f11dc84f0fdd9be06157bc7659050aa928` (не откатывалась) |
| Vasily Product A | `80cebd8` profile + public creators |
| Vasily Product B | `eb1de84` wallet/account/history shell |
| Vasily Product C | `524e0bb` feed sort/search/pagination + TOP creators |
| Vasily Product D | `5e836d0` public/unlisted + Telegram share |
| Vasily Product E | `abe80ad` i18n RU/EN/CN + onboarding + desktop |
| Vasily Product F | этот коммит: demo seed + tests + docs |
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

## Vasily Product Expansion

Продуктовый sprint вокруг уже принятой P2P beta. Matching, partial fill, IOC/limit, self-match, settlement, integer nanoTON, P2P ledger, auth/initData, webhook, расчёт 1%, refund/cancel и legacy LMSR **не переписывались**.

Ветка: `feature/vasily-product` → `feature/beta-ui`. Draft PR, **не merge**. `main`, PR №10, PR №11, Render, production env/DB **не трогались**.

### Экономика 1% не изменена. Новый creator reward не добавлялся.

Новый creator reward не добавлялся. Существующее распределение сервисного сбора сохранено: 75% creator / 25% platform в предусмотренных текущей settlement-логикой случаях. В repair pass это только отражено в UI.

Сервисный сбор по-прежнему **1% только с чистой прибыли победителя**. Внутренний split 75/25 (creator/platform) в ledger не менялся и в UI не выдаётся за «автор получает 1%». Новый creator payout не создавался.

Unlisted: публичные surfaces по-прежнему скрывают событие. Orderbook / quote / place и GET по numeric id закрыты централизованным access check: нужен `X-Market-Share-Token` этого market, либо creator/admin. Иначе 404, не 403. Mini App: `?share=` → существующий share resolve → token только для открытого event → заголовок, не query string. Отмена своей заявки через `/orders/{id}/cancel` без token.

Криптоинтеграции нет: нет TON Connect, Solana adapter, RPC, deposit address, seed phrase, on-chain tx. Wallet — visual-final shell, CTA disabled, баланс через эти формы не меняется.

### DB additions (additive, ensure_schema; persistent production migration DEFERRED)

- `users.telegram_username`, `users.display_name`, `users.photo_url` (nullable)
- `markets.visibility` default `public`
- `markets.share_token` unique nullable (unlisted only, `secrets.token_urlsafe(24)`)

SQLite и PostgreSQL покрыты tests. На Render ничего не применялось.

### Account / profile

Личный кабинет: аватар (Telegram `photo_url` текущего пользователя или initials), display name, @username, внутренний id, бейдж админа. Balance-card кликабельна → Wallet. Действия Пополнить/Вывести. Секции: Обзор, Мои события, Мои заявки, Мои позиции, История.

При Telegram auth нефинансовые поля обновляются из проверенного initData. Canonical identity не username.

Публичный профиль автора: `GET /creators/{id}` — только public events. Свой профиль дополнительно даёт wallet/account controls.

### Wallet shell only

TON | Solana, вкладки Пополнить / Вывести / История. Адрес не генерируется: «Адрес появится после подключения блокчейн-модуля». QR-слот пустой. «Получить адрес» и «Вывести» disabled. Нет API списания.

### История денег

Read-only DTO из существующего P2P journal + settlements (`GET /users/{id}/transactions`). Типы: заявка/резерв, исполнение, возврат остатка, отмена, выигрыш, проигрыш, сервисный сбор, возврат события. Пополнение/вывод предусмотрены в UI-фильтре, fake records не создаются.

### Лента

Sort отделён от категории: Новые | Популярные | Закрываются, затем категории и поиск.

- new: public, `created_at` DESC (tie-break id)
- closing: accepting, `close_at` ASC, только будущие
- popular: executed volume DESC, unique traders, fill count, newest

`GET /markets` backward-compatible: `q`, `category`, `status`, `sort`, `limit`, `offset`, заголовок `X-Total-Count`. Без `limit` по-прежнему полный список. Unlisted не в feed/search/popular. Mini App: 20 + «Показать ещё», debounce 280ms.

Best offers batch сохранён. Creator names/activity batch, без `/users/{id}` и `/orderbook` на карточку.

### TOP creators

`GET /creators/top`: volume / fills / unique participants по **public** рынкам автора. Кликабельные профили. Блок «Лучшие авторы →» в ленте, без новой bottom-tab.

### Private / unlisted

Публичное: pending → admin moderation → лента. По ссылке: сразу `open`, share token, не в ленте/поиске/popular/публичном профиле автора. `GET /markets/{id}` для unlisted → 404. Resolve: `GET /markets/share/{token}` (Telegram auth). Trading по id после resolve сохранён (ограничение beta). Settlement/cancel permissions не расширялись.

Стабильная share-ссылка: `https://t.me/<bot>?start=market_<TOKEN>`. Бот по `/start` отдаёт кнопку «Открыть событие» на **текущий** `settings.webapp_base()/?share=<TOKEN>`. Mini App читает `?share=` (и start_param). `TELEGRAM_BOT_USERNAME` в health.

### i18n / onboarding / responsive

Словарь `app/static/i18n.js`: RU / EN / 简体中文. Default: Telegram `language_code` ru→RU, zh*→CN, иначе EN. Выбор в профиле, localStorage `betton-lang`. UGC (вопрос, исходы) не переводится. Бот `/start` `/help` по language_code, unknown → EN.

Onboarding dismissible (`betton-onboard-v1`): честный 1%, без «без комиссии». Help «Как это работает». Форма создания компактная, сборы в collapsed `<details>`.

Mobile-first; desktop `--app-max` 720/1080/1200, лента 2 колонки с 768px, account/wallet две колонки с 1024px. Bottom nav по-прежнему Лента / Создать / Мои (+ Проверка у админа).

### Demo seeder

```
python scripts/seed_demo_markets.py --count 100 --database-url sqlite:///./betton-demo.db
```

Hard guard: отказывает Render env, production-like host, и `betton.db` без `--allow-local-demo`. Localhost/CI PostgreSQL или явный demo sqlite — можно. Не запускать на Render.

### Tests / CI

Новые: `test_profile_creators.py`, `test_history.py`, `test_wallet_ui.py`, `test_feed.py`, `test_private_markets.py`, `test_i18n.py`, `test_demo_seed.py`. SQLite full suite. PostgreSQL job: journal + integer money + migration + E2E + profile/private/feed/seed. sqlite job: `actions/setup-node`.

### Известные ограничения этого sprint

- Unlisted market можно торговать по numeric id, если id уже известен; публичный GET по id закрыт.
- Wallet не меняет баланс и не выдаёт адреса.
- Creator 1% reward не реализован.
- Persistent production storage still deferred.
- Второй реальный Telegram-аккаунт для live matching всё ещё pending.
- Нет TON/Solana интеграции.

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

Публичные: `GET /markets` (`q`/`sort`/`limit`/`offset`, `best_offers`, `creator`, `activity`; unlisted исключены), `GET /markets/{id}` (unlisted → 404), `GET /markets/share/{token}` (auth), `GET /markets/{id}/orderbook`.

Discovery: `GET /creators/top`, `GET /creators/{id}`.

Auth: `POST /auth/telegram` (обновляет display name / telegram username / photo_url, не деньги), `GET /users/{id}`, `GET /users/{id}/account`, `GET /users/{id}/transactions`.

P2P: `POST /markets/{id}/orders/quote`, `POST /markets/{id}/orders`, `GET /users/{id}/orders`, `POST /orders/{id}/cancel`.

LMSR: `POST /markets/{id}/quote`, `POST /markets/{id}/buy`, `POST /markets/{id}/claim`.

Прочее: `POST /markets`, `GET /users/{id}/markets|positions|settlements`, админ `GET /moderation/markets`, `POST /markets/{id}/approve|reject|close|resolve|cancel|collect-residual`.

Лента **не** вызывает orderbook на каждую карточку: `best_offers` считаются одним запросом на сервере из той же агрегации стакана. `pot` — объём уже исполненных сделок. Полный стакан — на странице события.

После внешнего ревью Sprint 1: лента больше не выводит «Нет встречных заявок» из `pot == 0`; после P2P-заявки сначала `GET /users/{id}`, затем перерисовка события и новый quote; Render service ID возвращён к `srv-daffpoon74is739r4csg`; PR №11 переведён в Draft.

## Известные UX / API ограничения

- `GET /markets/{id}` → 404 для pending/rejected; автор открывает такие события из кэша «Мои».
- Quote P2P требует Telegram-сессию; в обычном браузере форма видна, расчёт — после входа.
- Дата в форме создания зависит от локали браузера (`datetime-local`).
- Поиск ленты серверный (`q=`), с debounce и пагинацией; unlisted не попадают.
- Workflow SQLite пинит Node через `actions/setup-node`.
- Sprint 3 E2E — TestClient + JS-рендер payload, не живая Telegram Mini App-сессия.
- Живой E2E со вторым реальным Telegram-аккаунтом всё ещё pending.
- Wallet UI — shell без блокчейна.
- Unlisted: GET по id 404; торговля по известному id возможна после share-resolve.

## Следующий этап (не начинать без задачи)

- Не начинать TON/Solana integration.
- Не merge, не deploy.
- Второй реальный Telegram-аккаунт: partial/full matching в живом WebView.
- Persistent production storage — DEFERRED.

## Запрещено до отдельного разрешения

- merge PR №10 в `main`;
- merge PR №11 в `feature/integer-money` или `main`;
- merge `feature/beta-ui` или `feature/vasily-product` в `main`;
- push/изменение `main`;
- deploy / restart / смена тарифа текущего Render;
- закрытие PR №10.
