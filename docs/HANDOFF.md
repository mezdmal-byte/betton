# BetTON handoff

2026-09-11. Merge в `main`, деплой и рестарт Render **не разрешены**.

## Текущее состояние

| Что | Значение |
| --- | --- |
| Репозиторий | https://github.com/mezdmal-byte/betton |
| Рабочая ветка | `feature/beta-ui` (от `feature/integer-money`) |
| UI sprint 1 | `05c9b44734040b7cde6486ae6c539b6fe174454d` |
| Точка ветки до UI | `88da7c7ed3be210d2bb2e204b876f51449096b56` (HANDOFF) |
| Основа integer-money | `6b0bc658ee20c1293eeeb74469f5adbb935fb80b` |
| PR №10 | [draft / open](https://github.com/mezdmal-byte/betton/pull/10) `feature/integer-money`, **не слит** |
| `origin/main` | `23fa84d417e21cbb954cb6ebcb7087ac1910cb36` (PR №9). **Не менять.** |
| Production Render | `srv-daffnoon74is739r4csg`, Free, auto-deploy с `main`. **Не деплоить и не перезапускать.** |

integer-money уже внутри ветки. Production storage migration — **DEFERRED**.

## Что сделано в Beta UI / UX sprint 1

Светлая Mini App-тема (fintech / prediction market, без золота и казино-эстетики). Нижняя навигация: **Лента / Создать / Мои** (+ Модерация у админа). Шапка: BetTON + доступный баланс в TON, без nanoTON и без имени пользователя.

Лента — компактные карточки: вопрос, два исхода, срок приёма, статус (активно / нет встречных заявок / приём завершён / завершено / отменено). Клик открывает **страницу события** с формой заявки, YES/NO, стаканом предложений и preview исполнения.

Форма заявки показывает, что исполнится сразу, что останется заявкой, встречный объём и что будет при отмене события. Частичное исполнение — не ошибка. Legacy LMSR и админ-действия сохранены.

## Страницы

- Лента (`#markets`)
- Событие (`#event-root`, новый экран)
- Создать
- Мои (заявки, позиции, созданные, история)
- Модерация (админ)

## API, которые использует UI

Без новых сущностей.

Публичные: `GET /markets`, `GET /markets/{id}`, `GET /markets/{id}/orderbook`.

Auth: `POST /auth/telegram`, `GET /users/{id}`.

P2P: `POST /markets/{id}/orders/quote`, `POST /markets/{id}/orders`, `GET /users/{id}/orders`, `POST /orders/{id}/cancel`.

LMSR: `POST /markets/{id}/quote`, `POST /markets/{id}/buy`, `POST /markets/{id}/claim`.

Прочее: `POST /markets`, `GET /users/{id}/markets|positions|settlements`, админ `GET /moderation/markets`, `POST /markets/{id}/approve|reject|close|resolve|cancel|collect-residual`.

Лента **не** вызывает orderbook на каждую карточку: «есть сделки» берётся из `pot`, «нет встречных заявок» — из `pot == 0` при открытом рынке. Живой стакан только на странице события.

## Тесты (локально)

`pytest tests --ignore=tests/test_p2p_journal_postgres.py`: **152 passed, 4 skipped**.

4 skipped: `test_load_mine_refreshes_balance_and_keeps_legacy_results` — нет Node.js, а этот сценарий исполняется только через Node. Остальной JS harness (`test_settlement_ui_js_*`, preview/feed states) прошёл через headless Edge.

Новые проверки: `tests/test_miniapp_beta_ui.py` (палитра, навигация, event page, отсутствие nanoTON в UX-тексте).

## Известные UX / API ограничения

- `GET /markets` не отдаёт стакан; карточка ленты не показывает лучшую цену P2P (её нет в модели списка). Не выдумываем «текущий коэффициент».
- `GET /markets/{id}` → 404 для pending/rejected; автор открывает такие события из кэша «Мои».
- Quote P2P требует Telegram-сессию; в обычном браузере форма видна, расчёт — после входа.
- Список не содержит queued volume; на ленте нельзя честно написать «X TON в заявках», только банк сделок (`pot`) или «ждёт встречные заявки».
- Дата в форме создания зависит от локали браузера (`datetime-local`).
- На узком экране чипы фильтров переносятся на несколько строк — читаемо, но занимает место.

## Следующий UI-спринт (не начинать без задачи)

- Preview заявки в живой Telegram-сессии (частичное исполнение, IOC).
- Упростить фильтры ленты / поиск.
- Полировка «Мои»: группировка заявок по событию, понятнее история.
- Если понадобится лучшая цена на карточке ленты — сначала расширить `GET /markets`, не фейковать коэффициент.
- JS `loadMine` в CI: сейчас Node нет локально; workflow Python-only, Node не ставит.

## Запрещено до отдельного разрешения

- merge PR №10 в `main`;
- merge `feature/beta-ui` в `main`;
- push/изменение `main`;
- deploy / restart / смена тарифа текущего Render;
- закрытие PR №10.
