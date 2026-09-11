# BetTON handoff

2026-09-11. Merge в `main`, деплой и рестарт Render **не разрешены**.

## Текущее состояние

| Что | Значение |
| --- | --- |
| Репозиторий | https://github.com/mezdmal-byte/betton |
| Рабочая ветка | `feature/beta-ui` (от `feature/integer-money`) |
| Current HEAD | `PENDING_SHA` |
| UI sprint 2 | `PENDING_SHA` |
| UI sprint 1 | `05c9b44734040b7cde6486ae6c539b6fe174454d` |
| Точка ветки до UI | `88da7c7ed3be210d2bb2e204b876f51449096b56` (HANDOFF) |
| Основа integer-money | `6b0bc658ee20c1293eeeb74469f5adbb935fb80b` |
| PR №11 | [draft / open](https://github.com/mezdmal-byte/betton/pull/11) `feature/beta-ui` → `feature/integer-money`, **не слит** |
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

История: вопрос, выбранный исход, победивший исход, сумма ставок, выплата, комиссия/чаевые при наличии, итог `+X TON` / `-X TON` / `Возврат X TON`. Отмена визуально отделена от проигрыша: «Событие отменено · средства возвращены».

Страница события: статус → вопрос → срок → исходы → компактные предложения → форма заявки → preview → действия. Подробный стакан в `<details>`. Preview выделяет сумму, исполнение сейчас, остаток заявки, коэффициент и выплату только по исполненной части. Если встречного объёма нет — это не ошибка.

Лента: клиентский поиск по вопросу без нового API; категории компактными chips; состояние — один `<select>`. Empty states у разделов «Мои». Mobile: без горизонтального скролла на 320/360/390/430 и desktop preview; клавиатура сдвигает нижнюю навигацию через `visualViewport`.

Экономика, matching, integer nanoTON, auth, migrations, API contracts не менялись.

## Страницы

- Лента (`#markets`) — поиск и компактные фильтры
- Событие (`#event-root`)
- Создать
- Мои (заявки по событиям, позиции, созданные, история)
- Модерация (админ)

## API, которые использует UI

Без новых сущностей.

Публичные: `GET /markets`, `GET /markets/{id}`, `GET /markets/{id}/orderbook`.

Auth: `POST /auth/telegram`, `GET /users/{id}`.

P2P: `POST /markets/{id}/orders/quote`, `POST /markets/{id}/orders`, `GET /users/{id}/orders`, `POST /orders/{id}/cancel`.

LMSR: `POST /markets/{id}/quote`, `POST /markets/{id}/buy`, `POST /markets/{id}/claim`.

Прочее: `POST /markets`, `GET /users/{id}/markets|positions|settlements`, админ `GET /moderation/markets`, `POST /markets/{id}/approve|reject|close|resolve|cancel|collect-residual`.

Лента **не** вызывает orderbook на каждую карточку. `pot` — объём уже исполненных сделок, не текущая ликвидность стакана. Живой стакан только на странице события.

После внешнего ревью Sprint 1: лента больше не выводит «Нет встречных заявок» из `pot == 0`; после P2P-заявки сначала `GET /users/{id}`, затем перерисовка события и новый quote; Render service ID возвращён к `srv-daffpoon74is739r4csg`; PR №11 переведён в Draft.

## Тесты (локально)

`pytest tests --ignore=tests/test_p2p_journal_postgres.py`: **157 passed, 4 skipped**.

Новые / обновлённые UI tests: `tests/test_miniapp_sprint2_ui.py`, `tests/test_miniapp_settlement_ui.py`, `tests/test_miniapp_beta_ui.py`.

4 skipped без Node.js: `test_load_mine_refreshes_balance_and_keeps_legacy_results`. JS harness (статусы «Мои», история win/loss/void, P2P-позиции, поиск, preview) исполняется через headless Edge.

PostgreSQL CI локально не запускался: нет Docker/psql. После push — job `postgres` на GitHub Actions.

## Известные UX / API ограничения

- `GET /markets` не отдаёт стакан; карточка ленты не показывает лучшую цену P2P (её нет в модели списка). Не выдумываем «текущий коэффициент».
- `GET /markets/{id}` → 404 для pending/rejected; автор открывает такие события из кэша «Мои».
- Quote P2P требует Telegram-сессию; в обычном браузере форма видна, расчёт — после входа.
- Список не содержит queued volume; на ленте нельзя честно писать «нет встречных заявок» при `pot == 0`.
- Дата в форме создания зависит от локали браузера (`datetime-local`).
- Поиск ленты только клиентский по уже загруженному списку (категория/статус по-прежнему с API).
- Заявки в «Мои» группируются визуально, сущности не сливаются: исполненная ставка остаётся в позициях, итог — в истории.
- JS `loadMine` в CI: Node на runner не ставится; workflow Python-only.

## Следующий этап (не начинать без задачи)

- Preview заявки в живой Telegram-сессии (частичное исполнение, IOC) на реальных котировках.
- Если понадобится лучшая цена на карточке ленты — сначала расширить `GET /markets`, не фейковать коэффициент.
- JS `loadMine` в CI: поставить Node в workflow, если понадобится гонять async-регрессии на runner.
- Не merge PR №10 / №11, не деплой Render.

## Запрещено до отдельного разрешения

- merge PR №10 в `main`;
- merge PR №11 в `feature/integer-money` или `main`;
- merge `feature/beta-ui` в `main`;
- push/изменение `main`;
- deploy / restart / смена тарифа текущего Render;
- закрытие PR №10.
