# BetTON: интеграционный кандидат и контролируемый выпуск

Дата: 25 октября 2026. Ветка: `integration/post-audit-20261025`, PR #22 → `main`.

Это инструкция для отдельно согласованного выпуска. Production, реальные базы, Render, webhook, токены и Admin Center этой работой не изменялись. Все восемь исправлений сохранены; экономическая модель, matching и settlement не перерабатывались.

## 1. Состав кандидата

| Источник | Проверенная редакция | Действие |
|---|---|---|
| main | `d4ed4e7d5978300244d0bcde09a2ce10b6ee6b0a` | Первый родитель интеграционного merge |
| PR #20, post-audit fixes | `671d3d5d9f86df1b4977ad24cd42aeee1bb01db0` | Второй родитель; все S1/S2/S3/F1/F2/F3/A1/A4 |
| PR #21, main webhook security | `54ebdb7d94c34370a6cb12de3950c82db98ccc3f` | Проверена совместимость; `app/webhook_security.py` идентичен версии PR #20 |
| UX v3 | `1c0f7cb0fa802e3d6a2a77f7873489208a775327` | Уже предок PR #20 |
| Render demo | `82c0e9f2d43ca54952f28c33f9fcf092cfd54261` | Не сливать demo-конфигурацию и данные в production |

Merge `97ef68077f758db60a1ceeed90e54379784eabbb` сохраняет историю обоих родителей. Разрешены четыре конфликта: `app/main.py` сохраняет новые auth/API/schema-check/lifecycle; `bot/main.py` сохраняет локализацию и безопасный lifecycle вместе с явным `MINI_APP_URL`, share/deep links и опциональной demo-кнопкой из main; README и HANDOFF сохраняют документацию исправлений. Логи не печатают полный URL с demo-ключом. Прочие изменения main вошли обычным merge. Не нужно последовательно сливать все PR #20/#21/#22: #22 уже содержит результат их совместимости; #21 остаётся самостоятельным аварийным исправлением старого main.

Если main изменится после указанного SHA, сначала обновить кандидата и повторить CI. Не использовать зелёные результаты прежней редакции для нового merge.

## 2. Дополнительная защита интеграции

- В keyed `/buy` исправлен выявленный PostgreSQL тестом deadlock: теперь порядок market → user → receipt. Ранее два разных ключа одного пользователя могли удерживать FK KEY SHARE и ждать FOR UPDATE; одна транзакция откатывалась с 500. Двойное списание этим отказом не доказано. Matching/суммы не менялись; добавлены конкурентные покупки с разными ключами в одном и разных событиях, replay и сверка balance/pot/trades/receipts. Исходный падающий тест сохранён.
- Старый `/markets/{id}/buy` остаётся доступен с прежним URL и keyed-контрактом/receipt. По умолчанию запрос без `request_id` получает **428 до денежной операции**. Это исключает незащищённые повторы старых клиентов. `ALLOW_UNKEYED_LEGACY_BUY=true` — только явное временное исключение с прежним риском дубля; для выпуска оставить `false`. Серверные расчёты не менялись.
- Актуальные legacy/React формы сохраняют request ID до отправки; неизвестный результат проверяется через owned lookup. Не очищать unresolved intent или receipts при выпуске. Старую форму без ключей следует обновить; сообщение 428 просит обновить приложение.
- Chromium обнаружил перекрытие F2-кнопок верхним notification popup. На экранах quick-trade/own-price при unresolved intent popup теперь временно скрыт; heartbeat/query продолжаются, notification не помечается прочитанной и возвращается после подтверждения восстановления. Recovery использует существующие Button/design tokens и собственную прокрутку. E2E проверяет обычный click без force и сохранение непрочитанного уведомления.
- `/ready` проверяет доступность БД, **точную** версию схемы и наличие корректной webhook-конфигурации при настроенном боте; ошибку выдаёт без секретов. `/health` оставлен совместимым. HTTP startup дополнительно проверяет денежную готовность. На финальной версии Render health path должен быть `/ready`.
- `python -m app.maintenance` — отдельный сервер без импорта БД, бота и worker. Только `GET /health` возвращает 200 с `writes_enabled:false`; все остальные запросы получают 503/Retry-After. Он включается только отдельным согласованным deployment, а не автоматически при старте.

## 3. Воспроизводимые проверки

```bash
python -m pytest -q tests
npm --prefix frontend ci
npm --prefix frontend test
npm --prefix frontend run build
# Из frontend, после сборки; только свой sandbox в .ux-preview/:
npx playwright install --with-deps chromium
npx playwright test --config playwright.release.config.ts
```

Для полного backend PostgreSQL 16 задать **только изолированную** `BETTON_TEST_DATABASE_URL` с именем `betton_test_*`, затем выполнить pytest. CI предоставляет PostgreSQL 16 самостоятельно. Тесты не используют production `DATABASE_URL`. Для backup/restore rehearsal нужны `pg_dump`/`pg_restore` совместимой версии и права создания временных БД в тестовом кластере.

`tests/test_release_rehearsal.py` создаёт свою схему 3, двух пользователей, действительные P2P-заявки и частичное исполнение. Проверяет полную копию и настоящее восстановление, upgrade 3→4, повтор upgrade, replay прежней заявки, точное сохранение users/markets/orders/fills/positions/settlements/ledger, восстановление исходной схемы 3 в отдельную БД, её upgrade и новую запись после restore. Проверяется reconcile. На PostgreSQL используются настоящие pg_dump/pg_restore; SQLite — online backup/integrity_check. Конкурентные миграторы и откат ошибочной миграции покрыты уже существующими schema-тестами. Новые тесты также проверяют /buy 428 без изменений денег, readiness и maintenance.

`frontend/release-tests/recovery.spec.ts` запускается в Chromium с реальной production-сборкой и локальным API/HMAC-auth на синтетических данных: сервер принял POST, ответ потерян, страница закрыта/открыта; сеть недоступна, затем reload/lookup/явный повтор прежним ключом. Проверяются одна заявка и ровно одно уменьшение баланса. Два мобильных viewport/темы, screenshot recovery хранится в CI artifact. Intent специально создаётся тестовым fixture; сами формы отправки дополнительно покрыты unit/backend-тестами. Это браузерная интеграция, **не Telegram WebView** и не полный визуальный аудит.

Успешные результаты кода интеграционного кандидата и ссылки на CI приведены в разделе 8. Промежуточный PG run на `1b6baa9` дал 419 passed / 1 failed и выявил описанный выше deadlock; этот run не является успешной регрессией. После исправления: локально 397 passed, 25 PostgreSQL-only skipped; frontend 172 passed. PostgreSQL 16 CI на `dfd41c965dbe6b077be99c6d45c72fc15634b342`: **422 passed, 0 failed, 0 skipped**, включая настоящий полный backup/restore. Пропуски SQLite не являются подтверждением PostgreSQL.

## 4. Что остаётся неподтверждённым

Нет доступа к согласованной реальной копии рабочей БД, актуальным защищённым Render settings и настоящему мобильному Telegram WebView. Проверка production-копии, состояния старых nano-полей/внешних ключей и фактической маршрутизации остаётся обязательным выпускным условием. Синтетический restore не доказывает отсутствие проблем в старых реальных данных. Не подменять недостающие записи ledger выдуманными начислениями ради успешной сверки.

## 5. Порядок выпуска — только после отдельного разрешения

### 5.1. Подготовка и разрешение

1. Review PR #22, зафиксировать итоговый SHA и зелёные CI именно на нём. Сохранить приватно текущий deployment SHA, тип/расположение БД, команды build/start, health path, env и настройки worker. Убедиться, что нет отдельного polling/старого writer процесса. Не публиковать токены, admin IDs, URL с ключами и содержимое backup.
2. Подтвердить владельцу окно обслуживания. Отключить автоматический выпуск на время смены команд. Отдельно согласовать merge main, maintenance/final deploy, backup/upgrade реальной базы и регистрацию секрета webhook. Ни одно из этих действий ещё не выполнено.
3. На защищённой изолированной копии реальных данных пройти шаги backup/restore/upgrade ниже и staging-сценарии. Для PostgreSQL использовать отдельный тестовый кластер, если рабочая роль не допускает создания disposable DB. Не выдавать права production приложению ради теста.

### 5.2. Остановить записи и сделать проверенную копию

1. Развернуть согласованный кандидат в maintenance-режиме: start `python -m app.maintenance`, health `/health`. Дождаться полного завершения **всех** старых HTTP replicas и фоновых workers. Остановить отдельные денежные jobs. Старые вкладки получают 503 и сохраняют intent; webhook получает 503, а не ложный 200, чтобы Telegram мог повторить доставку. Длительное обслуживание может превысить сроки хранения Telegram updates; не затягивать окно.
2. Не выполнять backup/DDL, пока старые процессы продолжают записывать. Сроки 24 часа гарантов продолжают идти по часам; выбрать окно без близких дедлайнов, после запуска проверить обработку просроченных событий по прежним правилам, не менять экономические условия.
3. SQLite: копировать через `sqlite3.Connection.backup` при остановленных writers, проверить integrity_check и foreign_key_check; не копировать только .db, игнорируя WAL. Backup хранить с правами 0600 вне перезаписываемой release-директории. PostgreSQL: `pg_dump --format=custom`, credentials через защищённое окружение/pgpass, не CLI/логи; сохранить checksum и ограничения доступа.
4. Восстановить копию в **новую изолированную** БД. Сравнить полные fingerprints, число/ID пользователей и событий, балансы, резервы, pot, заявки, исполнения, receipts и журнал. Выполнить reconcile для покрытых журналом событий; отдельно документировать старые события с неполным покрытием. После копии не должно быть новых записей в источнике.

Пример SQLite backup, только в согласованном окне, с приватными абсолютными путями в `BETTON_SOURCE_SQLITE`/`BETTON_RELEASE_BACKUP` (скрипт не загружает app/.env и не меняет схему):

```python
import os, sqlite3
from pathlib import Path
source = Path(os.environ['BETTON_SOURCE_SQLITE']).resolve(strict=True)
backup = Path(os.environ['BETTON_RELEASE_BACKUP']).resolve()
fd = os.open(backup, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
os.close(fd)
with sqlite3.connect(source.as_uri() + '?mode=ro', uri=True) as src:
    with sqlite3.connect(backup) as dst:
        src.backup(dst)
        assert dst.execute('PRAGMA integrity_check').fetchone() == ('ok',)
        assert dst.execute('PRAGMA foreign_key_check').fetchall() == []
```

Для PostgreSQL после остановки writers: `pg_dump --format=custom --file "$BETTON_RELEASE_BACKUP"` с приватными PGHOST/PGDATABASE/PGUSER/PGPASSFILE и `umask 077`. Восстановление выполнять **на другом тестовом host/database**, `pg_restore --no-owner --no-acl --exit-on-error --dbname "$BETTON_RESTORE_DATABASE" "$BETTON_RELEASE_BACKUP"`; проверить окружение подключения до запуска. Без `--clean`/перезаписи источника. Для SQLite restore выполнить online backup из файла копии в новый файл с другим именем. Финансовая сверка обязательна сверх integrity_check. Эти примеры на рабочем окружении не запускались.

У Render pre-deploy отдельная среда, не имеющая доступа к persistent disk. Для SQLite выполнить ручную миграцию из disk-bearing maintenance instance/его shell; не помещать её в недоступный disk pre-deploy. PostgreSQL может использовать отдельный maintenance job с сетевым доступом, но только после остановки старых writers. Persistent disk также исключает обычный zero-downtime rollout; этот план намеренно использует окно обслуживания.

### 5.3. Явная миграция и конфигурация

На копии, затем после разрешения — в остановленной рабочей базе:

```bash
python -m app.migrations upgrade
python -m app.migrations check
python -c 'from app.database import assert_money_ready; assert_money_ready()'
```

Upgrade доводит до схемы **4** (baseline, BIGINT Telegram ID, event-intents, legacy-buy receipts); повтор безопасен, конкурентные миграторы сериализованы. Ordinary HTTP startup не изменяет схему. На совсем старых базах с NULL nano-полями сначала нужен отдельный проверенный money-migrate этап с проверенной копией и подтверждением округлений; не применять `--accept-rounding` автоматически. Остановиться при нарушении ссылок/денежной готовности, исправлять по отдельному плану с данными владельца.

В защищённых settings подготовить стабильные admin Telegram IDs, отдельный криптостойкий `TELEGRAM_WEBHOOK_SECRET`, при ротации допустимый previous secret, `ALLOW_UNKEYED_LEGACY_BUY=false`. BOT_TOKEN и treasury не менять. Убедиться, что demo automation выключена в production. `MINI_APP_URL` — проверенный URL существующего Mini App `/v2/`, `PUBLIC_BASE_URL` — backend. Секреты не передавать в URL/PR.

### 5.4. Запуск существующего бота

1. Build: установить requirements, `npm --prefix frontend ci`, `npm --prefix frontend run build`. Start: `python -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT"`, health `/ready`. Не запускать polling `bot/main.py`: этот отдельный режим намеренно удаляет webhook.
2. После завершения старых автоматически регистрировавших/удалявших webhook процессов явно выполнить `python -m app.webhook_security register` с защищённой конфигурацией. Регистрация сохраняет pending updates. Делать только после отдельного разрешения. Обычные рестарты webhook не удаляют/не переустанавливают. При ротации сначала все replicas принимают current+previous, затем сменить регистрацию, затем убрать previous после переходного периода.
3. Проверить существующего бота, его menu URL и reverse proxy: секретный заголовок проходит без изменения, дублирующиеся/отсутствующие/неверные заголовки отклоняются. Не слать поддельные запросы в настоящий webhook; негативные проверки проводить на staging. Menu URL может синхронизироваться при первом /start; это тоже выполнять только в согласованном выпуске.
4. Production smoke сначала read-only: /start, /help, auth старого пользователя, профиль, история, owned lookup, открытие приватной ссылки. Денежные диагностические операции — только на тестовых средствах в изолированной базе. Не считать запуск /ready достаточным smoke.

## 6. Короткая ручная проверка в настоящем Telegram

На staging URL существующего приложения без изменения production webhook, с разрешёнными тестовыми аккаунтами и синтетическими деньгами:

- Android/iOS: открытие из menu и private/deep link; RU/EN/ZH, тема, Back, закрытие/открытие, возврат из фона, старый пользователь и кошелёк read-only.
- Быстрая и своя ставка: отправить, оборвать ответ после commit, закрыть WebView, открыть; дождаться backend lookup; проверить одну заявку/один резерв/ledger. Затем запрос, не дошедший до сервера: reload и явный повтор с прежним ключом.
- Частичное исполнение, отмена остатка, возврат, settlement, четыре тарифа и минимум 20%, история победителя/гаранта. Три типа событий и повтор create после потери ответа дают одно событие/приглашение.
- Смена Telegram-аккаунта не показывает чужой intent и не отправляет его. Истёкший/повреждённый storage не запускает новую ставку автоматически. Старый некейованный /buy получает 428, новый keyed replay не списывает повторно.

CI Chromium проверяет часть этих условий, но не mobile storage policy Telegram, Bridge/BackButton и actual initData delivery.

## 7. Откат

- При неудачной миграции оставить maintenance и проверить revision/финансовые fingerprints. Миграционный rollback транзакции проверен тестами, но не заменяет backup.
- Подготовленный безопасный аварийный режим — **тот же интеграционный SHA**, start `python -m app.maintenance`, health `/health`. Его запрет записи и отказ webhook с 503 проверены автоматически. Это остановка при ошибке для roll-forward, а не обещание работы старого интерфейса. Для него не нужно откатывать схему.
- Schema 4 добавляет receipts и BIGINT. Не удалять таблицы и не сужать типы. Старые builds с exact schema 2/3 не запустятся на 4. Полный функциональный откат на прежний main не подтверждён: он потребует согласованного восстановления базы и отдельно проверенной защищённой старой сборки (S1), либо roll-forward hotfix. Не запускать автоматически старую небезопасную версию.
- Восстановление полного backup выполнять сначала в новую БД, проверить и только затем согласованно переключить. Writers должны оставаться остановленными. Если после backup принимались денежные операции, нельзя просто восстановить старую копию: потеряются они и receipts. Нужен отдельный план сверки/переноса или roll-forward.
- Render code rollback **не восстанавливает** БД/persistent disk. Сохранить настройки webhook current/previous и клиентский lookup/receipts при rollback. Не переключать на незащищённый старый webhook или /buy.

Основание особенностей платформы: официальные [Deploys](https://render.com/docs/deploys), [Health checks](https://render.com/docs/health-checks), [Rollbacks](https://render.com/docs/rollbacks), проверены 25.10.2026. Никаких Render API mutations этой задачей не выполнялось.

## 8. Итоговый CI

Все проверки последней редакции кода `c35213a4dcb5875a08655910ec332ba721fee40f` прошли:

| Проверка | Результат | CI |
|---|---|---|
| Полный backend, PostgreSQL 16 | **422 passed, 0 failed, 0 skipped** | [run 40165676776](https://github.com/mezdmal-byte/betton/actions/runs/40165676776) |
| SQLite CI | **397 passed, 13 PG-only skipped**, ещё 12 PG-тестов исключены только из SQLite job | тот же run |
| Frontend | **172 passed**, production build успешен | [run 40165676817](https://github.com/mezdmal-byte/betton/actions/runs/40165676817) |
| Chromium + реальный изолированный API | **4 passed**, две темы/viewport, потеря ответа и offline/reload/replay | [run 40165676784](https://github.com/mezdmal-byte/betton/actions/runs/40165676784) |
| Полный локальный pytest | **397 passed, 25 PG-only skipped** | локальный независимый прогон; PG подтверждён отдельным CI выше |

Тесты миграций, полный backup/restore rehearsal, rollback ошибки, разные request keys и финансовые инварианты входят в backend 422. Никакие упавшие финансовые тесты не исключались. Отдельный guard unkeyed /buy добавлен до денежных действий; legacy-тесты теперь передают ключи, сохраняя прежние денежные assertions.

[Скриншоты recovery](https://github.com/mezdmal-byte/betton/actions/runs/40165676784/artifacts/12588785797) просмотрены: 390×844/light и 430×932/dark, кнопка не перекрыта, notification восстановлена без mark-read. Artifact хранится 7 дней. Это не проверка всех экранов и не Telegram WebView.

Последний отчётный commit меняет только Markdown; **CI повторяется и на итоговом HEAD**, точные SHA/ссылки опубликованы в [PR #22](https://github.com/mezdmal-byte/betton/pull/22). Не подменять его прежним CI PR #20. Integration push не запускает дублирующие наборы: все три workflow срабатывают на обновление PR.

| ID | Статус в интеграционном коде | Подтверждение / оставшееся условие |
|---|---|---|
| S1 | Реализовано, регрессия прошла | header/rotation/proxy/shutdown tests; реальная регистрация только после согласования |
| S2 | Реализовано, регрессия прошла | BIGINT + populated/concurrent migration PG; реальная копия ещё не проверена |
| S3 | Реализовано, регрессия прошла | стабильные ID/revocation/auth tests; реальные admin ID подтвердить приватно |
| F1 | Реализовано, регрессия прошла | история отражает journal/rewards, несколько позиций/победителей; новых начислений не создавали |
| F2 | Реализовано, регрессия прошла | persistent intent/lookup/replay/rollback/concurrency + Chromium; Telegram smoke остаётся |
| F3 | Реализовано, регрессия прошла | SQLite FK init и отказ broken references; старые реальные строки проверить на копии |
| A1 | Реализовано, регрессия прошла | explicit migrations, parallel/rollback/restore; выпуск отдельно в maintenance |
| A4 | Реализовано, регрессия прошла | atomic event/invitation receipts, canonical conflict, restart/concurrency; schema 4 до запуска |

**Вывод:** разработка обязательного набора и разрешение конфликтов завершены; кандидат готов к review и контролируемой процедуре выпуска. До включения production обязательны реальная изолированная копия/сверка, Telegram smoke и разрешение владельца на операции из раздела 5. Эти проверки не заявлены выполненными. Ни один из восьми пунктов ещё не развёрнут этой работой в production. Большой новый этап разработки не требуется при успешном прохождении этих операционных ворот; конкретная проблема в реальных данных может потребовать отдельного исправления.
