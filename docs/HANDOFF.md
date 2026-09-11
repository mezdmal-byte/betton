# BetTON handoff

2026-09-11. Merge в `main`, деплой и рестарт Render **не разрешены**.

## Текущее состояние

| Что | Значение |
| --- | --- |
| Репозиторий | https://github.com/mezdmal-byte/betton |
| Рабочая ветка | `feature/beta-ui` (локальная; от `feature/integer-money`) |
| Основа ветки | `6b0bc658ee20c1293eeeb74469f5adbb935fb80b` |
| PR №10 | [draft / open](https://github.com/mezdmal-byte/betton/pull/10) `feature/integer-money`, **не слит**, не закрыт |
| Проверенный SHA №10 | `6b0bc658ee20c1293eeeb74469f5adbb935fb80b` (не изменился) |
| `origin/main` | `23fa84d417e21cbb954cb6ebcb7087ac1910cb36` (PR №9). **Не менять.** |
| Production Render | `srv-daffpoon74is739r4csg`, Free, auto-deploy с `main`. **Не деплоить и не перезапускать.** |

`feature/beta-ui` создана не от `main`, а от актуального `feature/integer-money`, чтобы beta включала integer nanoTON из PR №10. Интерфейс в этом проходе не менялся.

## DEFERRED

1. **production data preservation — DEFERRED.** Текущая Render SQLite содержит только демонстрационные данные. Для этого этапа разработки её сохранение не блокер. Потеря этих demo-данных допустима при будущем **осознанном** переходе на новую beta. Это не разрешение удалять, заменять, деплоить или рестартовать текущий Render сейчас. Чистая демо-база в будущем для запуска новой beta **допущена явно**; сейчас её не создавать и на прод не выкатывать.
2. **production migration / persistent storage — DEFERRED.** Вернёмся после появления нормального постоянного хранилища или отдельного сервера: backup/restore, офлайн-миграция integer money, при необходимости SQLite→PostgreSQL, cutover без потери записей.

На Free по-прежнему нет Shell/SSH и постоянного диска; бесплатный Render Postgres (30 дней) не считать бессрочным хранилищем. Платные ресурсы не создавать без отдельного согласования стоимости.

## Следующий этап

**Beta UI / UX.** Сейчас только подготовлено рабочее дерево. Не начинать правки интерфейса, пока не будет отдельной задачи.

Не менять без явной задачи: денежную механику, P2P matching/settlement, LMSR, Telegram auth, API, миграции, текущий production.

## Проверки PR №10 (на SHA `6b0bc65`, до ветки beta)

CI: sqlite **154 passed**, postgres **34 passed** (run `34597856382`). Локально: **150 passed, 4 skipped** (нет Node.js). Прод-копию не мигрировали и не восстанавливали — это теперь DEFERRED.

## Запрещено до отдельного разрешения

- merge PR №10 в `main`;
- push/изменение `main`;
- deploy / restart / смена тарифа текущего Render;
- закрытие PR №10.
