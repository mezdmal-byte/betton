# BetTON Visual V1 — проверка PR #35

Дата: 02.11.2026. Ветка: `fix/visual-v1-onboarding-qa-20261102`, поверх draft PR #34.

**Результат всего Visual V1: blocked.** Это не заявление о готовности всех экранов или Telegram-релиза. Визуальный блокер доступа к браузеру снят: реальные изображения App получены в поддерживаемом Chromium GitHub Actions. Для приоритетов 1–4 выполнены реализация и проверка в пределах описанной браузерной среды; живая WebView-приёмка и полная Figma-приёмка EVENT/гаранта остаются отдельными задачами.

## Доказательства

- [Draft PR #35](https://github.com/mezdmal-byte/betton/pull/35).
- [Финальный Chromium workflow](https://github.com/mezdmal-byte/betton/actions/runs/41391162691). Проверяемый frontend/head: `bc5b9f85ad1e33c96a4c1afcbd817882829544d3`; checkout Actions: `5d7134ed08120434e10ef632de8df9085943ee07` (PR merge ref, не production merge).
- База «до»: PR #34 `df5be9e742b9c6766d6e1bf7bfe7d07e73f06ace`, отдельный git worktree. [Полный artifact](https://github.com/mezdmal-byte/betton/actions/runs/41391162691/artifacts/13117777214), retention 14 дней. Источник и параметры записаны в report.json с каждой стороны.
- **221 снимок настоящего App до + 221 после**, 87 дополнительных fixture-снимков visual/legacy, 25 workflow-снимков. Fixture-снимки не подменяют проверку App.
- Размеры настоящего App: 320/360/390/430 × 550/600/700/844, DPR 1, русская локаль, UTC, фиксированное время, светлая тема. Fullscreen success/denied — 390 × 844 с моделью host safe area. Сетевые данные из fixtures, backend не запускается.
- [Все 16 измерений ленты](docs/design/visual-v1-qa-20261102/app-matrix.json); методика и дальнейшая работа — [handoff](docs/design/VISUAL_V1_QA_HANDOFF_20261102.md).

Сравнения ниже показывают эталон и реализацию рядом. Источник нормализован по ширине; screenshot App не масштабирован. Оригинальные телефоны онбординга выше runtime 844 px; feed-референс включает OS chrome и иной контент. Pixel-diff этих изображений не используется как доказательство полного совпадения.

| Поверхность | Сравнение |
|---|---|
| Что такое BetTON | [Оригинал → PR #34 → PR #35](docs/design/visual-v1-qa-20261102/onboarding-1-comparison.png) |
| Как это работает | [Оригинал → PR #34 → PR #35](docs/design/visual-v1-qa-20261102/onboarding-2-comparison.png) |
| Создавайте свои события | [Оригинал → PR #34 → PR #35](docs/design/visual-v1-qa-20261102/onboarding-3-comparison.png) |
| Станьте гарантом | [Оригинал → PR #34 → PR #35](docs/design/visual-v1-qa-20261102/onboarding-4-comparison.png) |
| FEED-01, 700 px | [Референс и два состояния](docs/design/visual-v1-qa-20261102/feed-reference-comparison.png) |
| FEED-01, 600 px | [До / после](docs/design/visual-v1-qa-20261102/feed-600-comparison.png) |
| EVENT-01, 600 px | [До / после шапки](docs/design/visual-v1-qa-20261102/event-compact-comparison.png) |

## Пять поверхностей соответствия

| Проверка | Установлено по изображениям и DOM | Предел вывода |
|---|---|---|
| Структура и композиция | Восстановлены все четыре разные композиции оригинала; три страницы деталей имеют собственные hero/условия/CTA. На маленьких высотах контент прокручивается, footer остаётся видимым. | Адаптивная компоновка, а не растянутая копия телефона из PNG. |
| Иллюстрации и иконки | Игроки, аватар предложения, рукопожатие/ожидание, типы событий, роли и этапы взяты из исходного PNG; сохранены Figma SVG деталей. Соединения веток — нативный SVG. | PNG весит 1.57 MB; это осознанный кандидат на отдельную оптимизацию без смены графики. |
| Типографика и редактируемый UI | Заголовки 40/44 на большом экране; локальные container queries на коротких. Тексты и controls — DOM, не растровый экран. Устранено обрезание навигационной подписи 320 px. | В узкой навигации 9.5 px; размеры остальных шрифтов этим исправлением не уменьшались. |
| Отступы, размеры, цвет | Компактная лента имеет меньшие внутренние отступы и 46 px блок исхода. При 390 × 600 видимо 2.556 карточки вместо 2.011 (+27.1%); при 390 × 700 — 3.166 вместо 2.448 (+29.3%). | При 844 px плотность карточек не изменена. Данные, TON и текущая навигационная модель сохранены. |
| Поведение и оболочка | Настоящий App проверен с header/scroll/footer, safe surface, bridge Back, Escape, focus trap, возвратом фокуса и scroll, synthetic swipe и keyboard resize. EVENT получил ту же host-шапку. | Synthetic bridge/pointer/visualViewport не доказывают поведение системной клавиатуры или жестов Telegram на iOS/Android. |

## Найдено и исправлено

| Приоритет | Наблюдение | Исправление и подтверждение |
|---|---|---|
| P1 | Ранее приложение нельзя было увидеть в доступном cloud preview. | Снимки actual App в Actions, сохранение artifacts при любом исходе; доступ не обходился. |
| P1 | Онбординг был масштабируемым canvas с упрощёнными иллюстрациями; 320 × 550 давал слишком мелкие тексты. | Native layout + оригинальная графика, отдельный scroll, постоянный CTA; 16 viewport-точек и все 7 экранов. |
| P2 | В первом восстановленном варианте дата исходного raster попадала в stadium crop; multiply давал прямоугольные матовые поля; ветки отличались высотой и не соединялись с процессом. | Crop стадиона ограничен иллюстрацией; multiply удалён; высоты выровнены; соединения восстановлены. Сравнение финальных снимков с оригиналом. |
| P2 | Высота ровно 700 px не включала compact. | Порог ≤700, unit regression и реальный App 700 px. |
| P2 | В первом пакете проверки nav-контейнера не поймали перенесённую/обрезанную подпись «Мои события» при 320 px. | Однострочная подпись, узкая коррекция шрифта; теперь проверяются actual bounds каждой подписи, а не только nav. [До](docs/design/visual-v1-qa-20261102/feed-before-320x550.png) / [после](docs/design/visual-v1-qa-20261102/feed-320x550.png) 320 × 550 закреплены отдельно. |
| P2 | EVENT в Telegram терял высоту на шапке 78 px. | Применены существующие host variables 52/56 px. Проверены четыре вкладки настоящего события и fullscreen. |
| P2 | Возврат с деталей не восстанавливал выбранную карточку и её положение. | Сохранение scrollTop и возврат фокуса; Playwright проверяет каждый из трёх переходов на всей матрице. |

## Проверки

| Проверка | Итог |
|---|---|
| Actual App screenshot/geometry/interaction harness | 221 до + 221 после; after errors=[]; все проверки успешны |
| `verify-visual-v1.mjs` | 87 снимков; no overflow/broken images/runtime errors; creator confirmation + legacy retained |
| `verify-workflows-v1.mjs` | 25 снимков; stale revision, final decision, failed request, decline/return, cancellation/revision, theme focus, wallet network callback |
| Frontend CI | 209 tests + production build |
| Integration browser recovery | 6 browser recovery + 74 prototype checks, успешно (отдельно от 221 App-снимка) |
| SQLite / PostgreSQL regression | SQLite 496 passed / 14 skipped; PostgreSQL 522 passed (изолированный CI) |
| `python scripts/check_dev.py --skills`, staged diff checks | Успешно перед каждым commit |

Новый workflow-check отмены сначала упал на неоднозначном locator: одноимённые h1 и h2. Locator ограничен уровнем 1; продуктовую логику ради теста не меняли. Ранний harness также обнаружил недостающий mock heartbeat и роль searchbox; они исправлены до первого успешного App-прогона. История не скрывается обновлением snapshots.

В baseline допустимы зафиксированные ошибки старой навигационной подписи; baseline снимается для сравнения и не маскирует after-failure. Кандидат после исправлений завершился без ошибок. В baseline записаны четыре сообщения об обрезанной подписи; after errors=[]. Нет горизонтального overflow и сломанных assets; панели не перекрывают scroll и не выходят за safe surface.

## Незакрытая приёмка

- **P2 validation gap:** настоящий Telegram iOS/Android, системные safe areas, клавиатура, native drag-down/edge-жесты. Доступного устройства в этом Work нет; браузерная модель это не закрывает.
- **P2 scope gap:** полная визуальная приёмка EVENT по актуальным Figma-состояниям и guarantor flow через настоящий App + безопасную SIM. Сейчас EVENT проверен read-only навигацией, гарант — отдельными fixtures. Статус «экран полностью готов» им не присваивается.

После проверенного SHA добавлены только документация и сохранённые доказательства; frontend-код не менялся.

Нет merge/deploy, изменений settlement, production DB, webhook или основного Telegram-бота. Существующая SIM и legacy сохранены.


## Продолжение PR #36 — EVENT / GUARANTOR, 02.11.2026

Предыдущие разделы описывают PR #35. Новый пакет и источники — [handoff EVENT / GUARANTOR](docs/design/VISUAL_V1_EVENT_GUARANTOR_20261102.md). Проверенный frontend `dccf3193f1c9623f8931f85d4c31193a431f0636`, checkout merge `f94937844097486a6a8b335e0678a508da26aec3`; после проверенного кода — только docs и evidence.

[Финальный Actions run](https://github.com/mezdmal-byte/betton/actions/runs/41486741392) успешен: 223 before + 274 after actual-App screenshots, errors=[]; 87 visual/legacy, 28 workflow и 11 chat screenshots. 215 unit tests + production build; browser recovery и PostgreSQL CI также успешны (ссылки в handoff).

| Проверяемая область | Итог и доказательство |
|---|---|
| Люди и фон онбординга | Самостоятельные прозрачные assets; [до / после](docs/design/visual-v1-event-guarantor-20261102/onboarding-before-after.png) и [DPR 3](docs/design/visual-v1-event-guarantor-20261102/onboarding-retina-detail.png). Малые эмблемы/предметный растр не перегенерированы. |
| Событие и панель | Настоящий App, все 16 размеров, живые Chromium touch-события; сохраняются сумма/режим/свой коэффициент. Исправлены новый клик после drag, скрытая выплата и пересечение секций. График zero/one/multiple points, оба исхода. |
| Частное пари | Гарант/тариф/следующие шаги перед графиком, переговоры в том же полотне, отдельные подтверждения сохранены. [Сценарий](docs/design/visual-v1-event-guarantor-20261102/event-guarantor-overview.png). Согласование не помечается зелёным «Активно». |
| Чат и legacy | Встроенный composer с выбранной ставкой; fixture send/reply/delete/error/guest/legacy checks прошли. Реальные сообщения никому не отправлялись. |
| FEED | Поиск вместо верхнего дубля профиля. Нового прироста плотности нет: все 16 значений равны PR #35. |

Общую приёмку нельзя считать полностью закрытой: настоящий Telegram iOS/Android, системная клавиатура/жесты, длинная история встроенного обсуждения и сложные роли/состояния через безопасную SIM ещё требуют проверки. App-тесты используют детерминированный API-перехватчик, а не живую SIM. Полная визуальная готовность EVENT не заявляется. Денежные контроллеры сохранены; backend/settlement/production DB/webhook/бот не менялись; merge/deploy не выполнялись.
