# Ночной спринт BetTON — итог 26 октября 2026

Работа: `codex/night-sprint-20261026`, [PR #24](https://github.com/mezdmal-byte/betton/pull/24)
с базой PR #23 (`4574ba1`). Это отдельная разработка, не production release.
Подробные контрольные точки: [NIGHT_SPRINT_PROGRESS.md](NIGHT_SPRINT_PROGRESS.md).

## Реализовано и проверено

| Этап | Результат | Проверка |
|---|---|---|
| A — остатки аудита | Подтверждено наличие восьми исправлений; PR20 — предок, webhook совпадает с PR21; отдельные release gates | История Git, существующие интеграционные/финансовые регрессии |
| B — денежная диагностика | Повторно используемый pure-SQL read-only toolkit, анонимный экспорт, 0/1/2 exit codes, классификация proven/unknown/incomplete | 20 целевых тестов, реальные сохранённые snapshots |
| B — миграционная репетиция | Новая копия schema3/4, backup/restore, повтор upgrade, сохранность всех прежних таблиц, rollback в другую копию; отказ при критическом повреждении | 7 целевых тестов; репетиция на согласованном schema4 SIM-снимке |
| C — интеграция | SQLite/PostgreSQL, денежные инварианты, конкуренция, receipts/replay, миграции и recovery | Локально 479 SQLite passed / 26 PG-only skipped; 505 native PG passed / 0 skipped до дополнительного recovery-launcher |
| D — Admin Center | Перенесена существующая реализация, отдельный localhost8885 процесс, согласованный snapshot, 14 разделов, schema4/гаранты/история/сверка | 24 целевых теста, дополнительные snapshot/PG-role тесты, браузер 14 разделов без write/external requests |
| E — Skills | Два установленных pinned MIT skills, Impeccable adapter, шесть собственных навыков, актуальный AGENTS, staged developer gate | 10 skills валидны, 26 inline paths, 10 regression tests; новые навыки появились в каталоге Codex при продолжении |
| F — onboarding | Три полноразмерных React-направления, пять экранов + три пояснения типов, RU/EN/ZH, light/dark, 320/360/390/430, reduced motion, keyboard/Back | 74 Playwright passed; отдельные TypeScript/Vite build; независимые A/B и один batch/confirm |
| G/H — UX и Windows | Recovery запускается на отдельном порту и отдельной базе, не останавливает SIM; исправлены доказанные prototype UX-дефекты | 6 новых launcher-регрессий + 10 developer tests; 4 recovery scenarios в двух темах |

Существующий frontend: **175 tests passed / 30 files**, production TypeScript/Vite build успешен.
Предупреждение о bundle >500kB осталось; проверки им не отключались.
Последние CI-проверки точного HEAD и ссылки на runs публикуются в PR #24: прежний зелёный
run не подменяет проверку нового кода. Прототипная матрица добавлена в существующий browser workflow,
без второго набора зависимостей; artifacts включают только synthetic preview/evidence, не всю `.ux-preview`.

## Конкретные найденные и исправленные причины

- Admin Center на Windows неверно разбирал `C%3A` после SQLAlchemy2.1 URL encoding.
  Теперь путь декодируется ровно один раз; есть регрессия.
- Старый рабочий branch в AGENTS вёл к PR15; теперь это историческая запись,
  актуальные PR22/23/night явно отделены. Ошибочная ссылка skill на `app/migrations.py`
  исправлена на пакет; validator теперь проверяет собственные inline repo paths.
- Прототип Learn скрывал Filled/Returned ниже scrollport при видимом управлении.
  Обратная связь теперь остаётся видна рядом с действиями. Согласие больше не означает
  одновременно фонд и результат. Hit area 44px, исправлены contrast/мелкие подписи,
  срок гаранта привязан к окончанию события, malformed variant URL не вызывает crash,
  переходы восстанавливают scroll/focus. Действующий onboarding не менялся.
- Recovery-конфигурация занимала пользовательский порт8877. Новый launcher принимает
  только локальный unprivileged port и получает отдельную test-папку. Исходный HMAC,
  маркер, Origin/Host/client guards и постоянный secret-detector сохранены без изменений.

## Что установлено в окружении

`emil-design-eng` и explicit-only `prototype` закреплены на официальном MIT source
`emilkowalski/skills@2d228630ba1446365f614a108cb8252f1feda202`.
Impeccable использует существующий канонический runtime4.3.1 и сохранённый hook.
Созданы `betton-financial-safety`, `betton-debugging`, `betton-telegram-miniapp`,
`betton-ui-quality`, `betton-simulation`, `betton-release`.
Происхождение, лицензии, причины пропуска остальных кандидатов и повторная установка:
[SKILLS_AND_WORKFLOW.md](SKILLS_AND_WORKFLOW.md). Десятки дублирующих skills не установлены.

Использованы независимые роли финансовой диагностики, Admin-интеграции, skills/workflow,
Product Guardian, Art Director и два isolated critique agents. Постоянные роли и hook сохранены.
Автоматизация — существующие GitHub Actions, расширенные prototype gate, и `check-dev.bat`.
Новых периодических заданий/уведомлений или внешних сообщений не создавали.

## Как открыть результаты

Из этой ночной рабочей копии:

1. `start-admin-simulation.bat` → http://127.0.0.1:8885 . Авторизация только локальными
   сгенерированными данными из `.ux-preview/admin-center-runtime/access.json`; не отправлять их в чат/Git.
   Остановка: `stop-admin-simulation.bat`. Каждый запуск сохраняет прежний snapshot.
2. `start-onboarding-prototypes.bat` → http://127.0.0.1:8886/prototypes/onboarding/index.html .
   Переключение Minimal/Motion/Learn: кнопки или 1–3; R повторяет; язык/тема выбираются сверху.
   Если preview уже открыт, используйте URL; занятый порт не уничтожает чужой процесс.
   Для процесса, запущенного этим BAT, остановка — Ctrl+C.
3. `python scripts/financial_diagnostics.py PATH_TO_EXISTING_SNAPSHOT` — анонимная read-only сводка.
   `--details` включает только локальные подробности, их не публиковать.
4. `python scripts/rehearse_release.py --source PATH_TO_SNAPSHOT --work-dir .ux-preview/new-review`
   — только новая изолированная папка; это не запуск миграции источника.
5. `python scripts/check_dev.py --skills`, `--tests <paths>`, `--frontend`; Windows-обёртка `check-dev.bat`.

Подробные команды для recovery-порта и прототипов — в progress и [ONBOARDING_PROTOTYPES.md](ONBOARDING_PROTOTYPES.md).
Текущий preview8886 может обслуживаться сохранённым agent worktree `betton-night-onboarding`;
его проверенный исходник интегрирован в ночную ветку, рабочее дерево не удаляется, пока preview нужен.

## Старая база и финансовые границы

В сохранённой исторической копии: 263 рынка, 217 заявок, 73 исполнения, 564 journal rows,
26 settlements. Нет маркеров схемы/денежной миграции, но есть nano-колонки и journal.
36 float pot-зеркал расходятся с nano/fill фактами; integer-структура и journal-pot не
противоречат друг другу. Это **не доказательство двойного начисления** и не разрешение
выбрать удобный остаток. Статус — incomplete/unknown; исходник не исправлялся/мигрировался.
Toolkit намеренно не дублирует payout/fee engine и не объявляет глобальные балансы
доказанными без grants/LMSR baseline. Авторитетная core reconciliation остаётся отдельной.

Snapshot активной SIM: schema4, 42 рынка, 48 заявок, 18 исполнений, 99 journal rows;
структурные проверки пройдены с явно указанными ограничениями.
Тесты денег/replay/migration/SELECT-only выполнены только на синтетических отдельных базах.

## Не выполнено автоматически / следующая сессия

- Владелец выбирает визуальное направление; ни один прототип не внедрён в production onboarding/Figma.
- Настоящий Android/iOS Telegram WebView, screen reader и политика мобильного storage требуют ручного smoke.
  Chromium/bridge emulation не названы реальным мобильным Telegram.
- Историческая storage authority и недостающий baseline требуют доказательств;
  корректирующие проводки и автоматическое исправление реальных остатков запрещены.
- Production deploy, Render, main merge, webhook/global-menu изменения и реальные TON-переводы не выполнялись.
- Нет подтверждённого функционального отката старого main на schema4; maintenance/roll-forward ограничения сохранены.

Следующий порядок: review точного CI HEAD → выбор prototype направления → ручной mobile smoke →
отдельно согласованное исследование исторической authority. Внутри этого спринта не найдено основания
переписывать экономику, matching, settlement или заново делать уже завершённые исправления аудита.
