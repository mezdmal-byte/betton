# BetTON — план завершения Figma · 28.10.2026

Это карта будущей работы, а не выполненный перенос. В текущем задании существующие Figma-экраны не изменялись. Настоящий image_gen создал 18 выбранных отдельных PNG; 17 готовы к ревью, один требует сверки текста. Ни один не утверждён пользователем автоматически.

## База и границы

Файл: https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA. Рабочая страница — BETTON — VISUAL V1, компоненты — BETTON — COMPONENTS. Сохранить все принятые кадры и исходные UX/архивные страницы. Не создавать новый проект/код, не трогать React/backend/production. Новые PNG разместить только как подписанные референсы; не подменять ими рабочие editable-кадры.

Прочитать соседний `FULL_FIGMA_SCREEN_INVENTORY_2026-10-28.md`: там старые источники, актуальные новые Node IDs, все предусмотренные состояния и несовпадения старых текстов с поздними решениями.

## Решения, которые нельзя автоматически закрыть

| Вопрос | Текущее положение | Как действовать до решения |
|---|---|---|
| Глобальная нижняя навигация | Мои события вместо Уведомлений предложено профилем, не утверждено глобально | Не менять принятые экраны; сохранить старую пятёрку там, где она уже принята. В профиле показать предложенный вариант с пометкой в документации |
| Метрика профиля | «Результат» — рабочая подпись, состав расчёта неизвестен | Не придумывать формулу и доходность; не дублировать цифры |
| Закрытие ставок без гаранта | Отдельное решение не зафиксировано | Не добавлять обязательный срок самостоятельно |
| Начало с гарантом | Уточнено: закрывает приём ставок; ориентировочный конец отдельно | Сохранить текущие 19:00/22:00 как пример, не откатывать к старому открытому вопросу |
| Доступность приглашений «в течение часа» | Унаследованный текст 332:108, смысл не подтверждён | Не превращать в SLA/таймер ответа; текст требует согласования |
| Обеспечение вознаграждения гаранта | Старый 463:683 содержит 20% и условия фонда | Сверить действующую спецификацию до переноса расчётов; не проектировать новую формулу |
| Кошелёк | SHELL/FUTURE в источнике | Только недоступные операции; не обещать депозиты/вывод/перевод по профильным PNG |
| Онбординг | Есть несколько версий и 5 исторических кадров | Сохранить иллюстрации; выбор кадров не считать утверждённым |
| Модерация и устаревшие поля | Старые формулировки не полностью совпадают с CREATE V3 | Нужные сведения сохранить, но не восстанавливать отдельный 8 шаговый процесс, краткое описание частного и прогноз конца публичного |

## Очерёдность переноса

1. **Сохранить основу.** Принятые FEED/EVENT/MY-BETS/DRAWER/GUARANTOR-PICK/inlineGUARANTOR и существующий CREATE не перерисовывать. Зафиксировать точные источники компонентов, токены, новые состояния в отдельных секциях без удаления старых.
2. **Профиль и личные списки.** Собрать профиль из существующих трёх PNG по журналу, затем Мои события/управление, уведомления, история и настройки по новым эталонам. Пустые/фильтрованные списки — variants одной системы.
3. **Кошелёк-shell и помощь.** Перенести ограниченные состояния без ложных денег/операций. Справочные статьи — один переиспользуемый шаблон. Позднюю механику ожидающего остатка сохранить в текстах.
4. **Рабочее место гаранта.** Кабинет, приглашение, тарифы, публичный профиль, решение. Затем адаптировать историю проверок/отзывы/подтверждения/недоступность и роль гаранта в уже принятом inline согласовании. Не смешивать базовый тариф и тариф конкретного пари.
5. **Модерация.** Очередь→проверка→редактирование→сравнение→проверка действия→результат. Причина отклонения обязательна по существующему UX; ошибка пустого поля отдельным вариантом. Авторство/редакции/вознаграждение не менять по изображению.
6. **Системные состояния и оставшиеся роли.** Общие empty/loading/offline/auth/403/404/modal/sheet/toast; согласие участника перед первой ставкой, протокол, доказательства, отмена и результат. Сверить карту старых состояний с новыми, не удалять функциональность при смене оформления.
7. **Онбординг.** Только после выбора кадров адаптировать существующие композиции и иллюстрации. Не заказывать новую генерацию автоматически.
8. **Admin Center.** Отдельная desktop секция 1440px: три эталона→15 существующих страниц. Сохранить read-only/demo, отсутствие данных и видимость по ролям. Не превращать административные таблицы в мобильные карточки ради единообразия.
9. **Сквозной QA и Prototype.** После визуального прохода связать реальные доступные переходы, проверить обратные действия/сохранение выбора. Для публичного CREATE проверить обёртку FRAME740:22661. Не обещать runtime ввод/копирование по статичным состояниям.

## Карта старое → новое

### Главная, категории, поиск

- Старые источники: [22:10070](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10070), [22:10156](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10156), [22:10190](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10190), [22:10296](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10296), [22:10341](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10341).
- Уже новое: [487:2](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=487-2), [498:556](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-556), [498:1002](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-1002).
- Референсы: Да: feed-v1.png; новая главная принята.
- Объём: Не пересоздавать FEED. Адаптировать поиск/категории/фильтры и пустые варианты существующих компонентов; отдельный PNG не нужен.

### Избранное и черновики

- Старые источники: [22:10763](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10763), [22:31527](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31527), [22:31960](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31960), [22:31980](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31980).
- Уже новое: 493:355 — входы меню.
- Референсы: Самостоятельного принятого PNG нет.
- Объём: Адаптация карточек FEED/форм CREATE; наличие пунктов меню не подтверждает backend. Не добавлять в обязательный релиз без решения.

### Событие и размещение ставок

- Старые источники: [22:10995](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10995), [22:11049](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11049), [22:11125](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11125), [22:11305](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11305), [22:11350](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11350), [22:11394](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11394).
- Уже новое: [500:2399](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-2399), [566:23541](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=566-23541), [566:24121](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=566-24121), [566:24602](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=566-24602), [578:6024](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=578-6024), [578:24819](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=578-24819), [578:25471](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=578-25471), [578:26116](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=578-26116), [620:18529](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=620-18529).
- Референсы: Да: event-layout-v1.png + event-header-v1.png; EVENT принят.
- Объём: Сохранить. Адаптировать закрыто/результат/отмена/404/доступ по ссылке и роли, если нет нового варианта. Не создавать новую концепцию ставки.

### Мои ставки

- Старые источники: [22:16441](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16441), [22:16563](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16563), [22:16680](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16680), [22:16742](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16742), [22:16944](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16944).
- Уже новое: [487:4](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=487-4), [500:2628](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-2628), [498:1912](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-1912), [498:2330](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-2330).
- Референсы: Да: my-bets-v1.png; новая версия принята.
- Объём: Деталь пари/предложения, отмена остатка, пустые/ошибки — адаптации EVENT и карточек, не новый MY-BETS.

### Мои события

- Старые источники: [22:27414](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27414), [22:27493](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27493), [22:27560](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27560), [22:27633](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27633), [22:27706](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27706), [22:27767](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27767), [22:27834](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27834), [22:27895](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27895), [22:27962](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27962), [333:209](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-209).
- Уже новое: Нового списка в VISUAL V1 не найдено.
- Референсы: Ранее нет; теперь MY_EVENTS_ALL.png — к ревью.
- Объём: Новый визуальный список на старой функциональности; состояния адаптировать, не генерировать десяток одинаковых.

### Управление своим событием

- Старые источники: [22:28022](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-28022), [22:19374](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19374), [22:19303](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19303).
- Уже новое: Новой отдельной версии не найдено.
- Референсы: MY_EVENT_MANAGEMENT.png — к ревью.
- Объём: Собрать нативную страницу из карточки события и строк параметров; доступные действия зависят от статуса/роли. Формулы не менять.

### Создание — выбор типа

- Старые источники: [328:19](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-19), [413:364](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=413-364), [413:392](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=413-392), [413:420](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=413-420).
- Уже новое: [720:27261](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=720-27261), [720:27345](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=720-27345), [720:27429](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=720-27429).
- Референсы: V3: 05_PUBLIC_CREATE_APPROVED.png / 02_CREATE_THREE_FLOWS_BASE.png.
- Объём: Готовый CREATE-01 не пересоздавать.

### Создание — публичное

- Старые источники: [375:17002](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=375-17002), [375:17030](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=375-17030), [333:334](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-334).
- Уже новое: [728:22227](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=728-22227), [737:22356](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=737-22356), [737:22518](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=737-22518), [737:22656](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=737-22656), [738:23116](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=738-23116), [738:23238](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=738-23238).
- Референсы: Да, V3; пользователь принял сценарий.
- Объём: Сохранить. Ошибки/редактирование/повторная отправка — адаптации. Не восстанавливать 8 шагов или прогноз завершения.

### Создание — без гаранта

- Старые источники: [375:17068](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=375-17068), [375:17096](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=375-17096), [333:351](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-351), [415:516](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-516), [415:549](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-549).
- Уже новое: [744:22843](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-22843), [744:22886](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-22886), [744:22972](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-22972), [744:23027](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23027), [744:23476](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23476), [744:23528](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23528).
- Референсы: Да, V3; сценарий принят.
- Объём: Сохранить. Закрытие приёма ставок у этого типа остаётся открытым; не наследовать решение для гаранта автоматически.

### Создание — с гарантом

- Старые источники: [328:47](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-47), [328:76](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-76), [328:106](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-106), [330:107](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-107), [331:366](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-366).
- Уже новое: [750:22946](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-22946), [750:22992](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-22992), [750:23049](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-23049), [751:23338](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=751-23338), [751:23546](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=751-23546), [750:23387](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-23387), [750:23876](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-23876), [750:24027](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-24027).
- Референсы: Да, V3; последний старт добавлен по замечанию пользователя.
- Объём: Не создавать заново. Последнее исправление начала ещё не имеет отдельного финального принятия. Приглашение≠согласование≠приём ставок.

### Уведомления

- Старые источники: [22:25630](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-25630), [22:25701](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-25701), [22:25762](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-25762), [22:25872](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-25872), [22:25821](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-25821).
- Уже новое: Новой версии не найдено.
- Референсы: NOTIFICATIONS_ALL.png — к ревью.
- Объём: Новый визуальный список; фильтры и детали адаптировать. Не обещать push-доставку.

### Свой профиль

- Старые источники: [22:26777](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26777), [22:27012](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27012), [22:27148](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27148), [22:27216](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27216).
- Уже новое: Нативного PROFILE нового стиля не найдено.
- Референсы: 3 оригинальных профильных PNG открыты; не окончательно утверждены.
- Объём: Собрать из шапки/баннера№2 и нижней навигации/единой статистики№3. Не придумывать четвёртый концепт. Результат — рабочее название.

### Публичный автор

- Старые источники: [22:26849](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26849), [22:26888](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26888), [22:26915](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26915).
- Уже новое: Нового оформления не найдено.
- Референсы: Отдельного принятого PNG нет; использовать профильные части.
- Объём: Адаптировать профиль/список событий. Только доступные достоверные метрики, не выдумывать рейтинг автора.

### Настройки

- Старые источники: [22:26946](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26946), [22:26640](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26640), [22:26704](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26704).
- Уже новое: Новой версии не найдено.
- Референсы: SETTINGS.png — к ревью.
- Объём: Новая оболочка, варианты строк и языковой выбор — компоненты. Тёмную тему не считать утверждённой.

### История операций

- Старые источники: [22:17261](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17261), [22:17326](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17326), [22:17382](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17382), [22:17441](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17441), [22:17610](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17610), [22:17723](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17723), [22:17783](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17783).
- Уже новое: Новой версии не найдено.
- Референсы: HISTORY_ALL.png — к ревью.
- Объём: Список + деталь адаптацией; данные и формулы из проекта, не из PNG.

### Кошелёк

- Старые источники: [22:29235](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29235), [22:29261](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29261), [22:29285](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29285), [22:29309](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29309), [22:29327](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29327), [22:29349](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29349), [22:29373](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29373).
- Уже новое: Новой версии не найдено.
- Референсы: WALLET_NOT_CONNECTED.png — к ревью.
- Объём: Перенести shell. Не проектировать работающую финансовую интеграцию на основании демонстрации профиля.

### Поиск/выбор гаранта

- Старые источники: [328:133](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-133), [328:169](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-169), [328:203](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-203).
- Уже новое: [487:5](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=487-5), [500:2837](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-2837), [498:2539](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-2539), [498:2821](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-2821).
- Референсы: Да: guarantor-select-v1.png; принято.
- Объём: Не пересоздавать. Поиск/пустой список/нет bio/длинный bio — адаптации.

### Публичный профиль гаранта

- Старые источники: [328:235](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-235), [330:46](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-46), [330:77](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-77), [332:441](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-441).
- Уже новое: Отдельной новой версии не найдено.
- Референсы: GUARANTOR_PUBLIC_PROFILE.png — к ревью.
- Объём: Новый визуальный профиль из принятой карточки гаранта; различать базовый и согласованный тариф пари.

### Кабинет гаранта, приглашения, тарифы

- Старые источники: [332:108](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-108), [330:165](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-165), [332:140](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-140), [332:165](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-165), [332:193](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-193), [332:225](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-225), [333:318](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-318).
- Уже новое: [Новых самостоятельных страниц нет](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=Новых самостоятельных страниц нет), [ часть статусов приглашения уже в CREATE](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id= часть статусов приглашения уже в CREATE).
- Референсы: GUARANTOR_DASHBOARD / INVITATION / TARIFFS — к ревью, dashboard требует сверки текста.
- Объём: Новые 3 композиции. Фикс/смешанный/процент с минимумом и состояния — адаптации. Устаревшие таймеры 00:42/5 мин не переносить.

### Согласование условий

- Старые источники: [330:192](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-192), [330:230](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-230), [330:270](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-270), [330:309](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-309), [332:387](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-387), [332:413](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-413), [335:272](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=335-272).
- Уже новое: [493:351](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=493-351), [493:352](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=493-352), [493:353](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=493-353), [493:354](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=493-354), [500:3081](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-3081), [500:3158](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-3158), [500:3249](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-3249).
- Референсы: Да: guarantor-v1 основа + принятая inline композиция; концепты 4/8 только детали.
- Объём: Сохранить принятый inline. Адаптировать роль гаранта и его исходящие действия; не возвращать отдельное приложение согласования.

### Результат и история гаранта

- Старые источники: [331:211](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-211), [333:165](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-165), [348:223](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=348-223), [332:474](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-474), [331:243](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-243), [331:276](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-276), [331:300](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-300), [331:331](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-331), [332:248](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-248), [337:214](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=337-214).
- Уже новое: Отдельного нового набора нет.
- Референсы: GUARANTOR_DECISION.png — к ревью.
- Объём: Новый эталон решения; подтверждение/результат/отзыв/история адаптировать из EVENT и профильных карточек. Решение окончательное по существующей логике.

### Согласие участника и обеспечение

- Старые источники: [331:149](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-149), [331:180](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-180), [463:683](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=463-683), [415:582](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-582), [415:615](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-615), [415:648](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-648).
- Уже новое: Часть действий покрыта EVENT/GUARANTOR, полного нового набора нет.
- Референсы: Самостоятельного принятого PNG нет; адаптация существующих компонентов.
- Объём: Не потерять в массовом переносе. Формулу обеспечения/20% и сроки не придумывать по старой подписи — сверить действующие правила перед отображением расчётов.

### Модерация

- Старые источники: [22:30639](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30639), [414:3](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-3), [414:36](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-36), [414:69](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-69), [414:102](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-102), [414:168](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-168), [415:820](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-820), [415:847](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-847), [415:876](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-876).
- Уже новое: Новых самостоятельных экранов не найдено.
- Референсы: MODERATION_QUEUE / REVIEW / COMPARE — к ревью.
- Объём: 3 новых эталона; формы/подтверждения/результаты — адаптации. Автора и вознаграждение не подменять модератором. Не копировать устаревшие сроки/поля CREATE.

### Иллюстрированный онбординг

- Старые источники: [291:17](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=291-17), [291:66](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=291-66), [291:109](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=291-109), [291:149](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=291-149), [291:184](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=291-184), [304:2146](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=304-2146), [304:2190](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=304-2190), [304:2231](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=304-2231).
- Уже новое: Нового оранжевого комплекта нет.
- Референсы: Есть иллюстрации Figma, не отдельный новый PNG; финальный выбор 5 кадров не подтверждён.
- Объём: Сохранить композиции и иллюстрации, адаптировать палитру/типографику после выбора кадров. Ничего не генерировать заново.

### Помощь и правила

- Старые источники: [22:29409](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29409), [22:29429](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29429), [22:29454](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29454), [22:29474](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29474), [22:29513](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29513), [22:29536](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29536), [22:29600](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29600), [22:29619](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29619), [22:29661](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29661), [22:29684](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29684).
- Уже новое: Нового оформления не найдено.
- Референсы: HELP_HOME.png — к ревью.
- Объём: Одна оболочка + адаптации текстовых статей/аккордеонов. Тексты частичного исполнения сверить с поздним решением об ожидающем остатке.

### Системные состояния

- Старые источники: [22:31102](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31102), [22:31137](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31137), [22:31154](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31154), [22:31190](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31190), [22:31207](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31207), [22:31224](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31224), [22:31241](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31241), [22:31310](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31310), [22:31344](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31344), [22:31363](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31363), [22:31418](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31418), [22:31475](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31475), [22:31496](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31496).
- Уже новое: [500:3343](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-3343), [500:3566](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-3566), [EVENT/CREATE QA/keyboard частично готовы](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=EVENT/CREATE QA/keyboard частично готовы).
- Референсы: Самостоятельного принятого PNG нет; отдельная генерация не нужна.
- Объём: Адаптировать общий набор нативных состояний; не создавать отдельную визуальную концепцию на каждую ошибку.

### Admin Center desktop

- Старые источники: [421:3](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-3), [421:29](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-29), [421:55](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-55), [421:81](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-81), [421:107](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-107), [421:133](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-133), [428:2](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-2), [428:98](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-98), [428:194](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-194), [428:290](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-290), [428:386](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-386), [428:482](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-482), [428:578](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-578), [428:674](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-674), [428:770](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-770).
- Уже новое: [Нового светлого набора нет](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=Нового светлого набора нет), [ старый desktop сохранён](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id= старый desktop сохранён).
- Референсы: ADMIN_OVERVIEW / USER_DETAIL / LEDGER — к ревью.
- Объём: 3 новыхшаблона;12 страницадаптировать,сохранивтаблицы/метрики/права/демо. Не сжимать desktop до 390. Только просмотр.

### Будущие эксперименты

- Старые источники: [22:31527](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31527), [22:31563](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31563), [22:31598](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31598), [22:31742](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31742), [22:31940](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31940), [22:32018](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32018).
- Уже новое: Не считать новым VISUAL V1.
- Референсы: Нет утверждённых PNG.
- Объём: Инвентаризировать, не включать автоматически в обязательную массовую реализацию. Не восстанавливать LMSR/отвергнутые направления.

## Созданные референсы

| PNG | Источник функциональности | Статус |
|---|---|---|
| [MY_EVENTS_ALL.png](https://chatgpt.com/library?file_id=libfile_cffc626756448191b1d28b7c012bb51c&account_id=personal) | [22:27414](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27414) | Готово к ревью |
| [NOTIFICATIONS_ALL.png](https://chatgpt.com/library?file_id=libfile_79cab2a86ba8819191a6d9070cab961c&account_id=personal) | [22:25630](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-25630) | Готово к ревью |
| [HISTORY_ALL.png](https://chatgpt.com/library?file_id=libfile_8904676b25b0819182e8de4be85e1ebd&account_id=personal) | [22:17261](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17261) | Готово к ревью |
| [WALLET_NOT_CONNECTED.png](https://chatgpt.com/library?file_id=libfile_40032624f9a48191a7ae962f33089c9a&account_id=personal) | [22:29235](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29235) | Готово к ревью |
| [GUARANTOR_DASHBOARD.png](https://chatgpt.com/library?file_id=libfile_a6bfd342f3648191b0e3305d6f4612dc&account_id=personal) | [332:108](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-108) | Требует исправлений |
| [MY_EVENT_MANAGEMENT.png](https://chatgpt.com/library?file_id=libfile_476e82f3be3481918fc085d3de0c9043&account_id=personal) | [22:28022](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-28022) | Готово к ревью |
| [GUARANTOR_INVITATION.png](https://chatgpt.com/library?file_id=libfile_fbe6424d5c988191b167d9ac906be7ca&account_id=personal) | [330:165](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-165) | Готово к ревью |
| [GUARANTOR_TARIFFS.png](https://chatgpt.com/library?file_id=libfile_13fef4b20750819192fb2d60c72c0e2f&account_id=personal) | [332:165](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-165) | Готово к ревью |
| [GUARANTOR_DECISION.png](https://chatgpt.com/library?file_id=libfile_b98ff4c386e88191a82cea86da34bc74&account_id=personal) | [331:211](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-211) | Готово к ревью |
| [GUARANTOR_PUBLIC_PROFILE.png](https://chatgpt.com/library?file_id=libfile_051962d107d08191851924eb7ef50214&account_id=personal) | [328:235](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-235) | Готово к ревью |
| [MODERATION_QUEUE.png](https://chatgpt.com/library?file_id=libfile_f12bbcdaea8c8191b0598980635207c6&account_id=personal) | [22:30639](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30639) | Готово к ревью |
| [MODERATION_REVIEW.png](https://chatgpt.com/library?file_id=libfile_8808fd8ae76881919541216ca520e348&account_id=personal) | [414:3](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-3) | Готово к ревью |
| [MODERATION_COMPARE.png](https://chatgpt.com/library?file_id=libfile_46cf905ce6bc819192117ba4640de251&account_id=personal) | [414:69](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-69) | Готово к ревью |
| [SETTINGS.png](https://chatgpt.com/library?file_id=libfile_1096ad481a088191ad0417b1f5f47069&account_id=personal) | [22:26946](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26946) | Готово к ревью |
| [HELP_HOME.png](https://chatgpt.com/library?file_id=libfile_07586bece18c8191a257b3d42d116b75&account_id=personal) | [22:29409](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29409) | Готово к ревью |
| [ADMIN_OVERVIEW.png](https://chatgpt.com/library?file_id=libfile_e381542a1de88191a52e87a5b2259135&account_id=personal) | [421:3](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-3) | Готово к ревью |
| [ADMIN_USER_DETAIL.png](https://chatgpt.com/library?file_id=libfile_062899dec6c08191948ea42018e01ae6&account_id=personal) | [421:55](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-55) | Готово к ревью |
| [ADMIN_LEDGER.png](https://chatgpt.com/library?file_id=libfile_550f310400348191846ffa0b2f799b4e&account_id=personal) | [421:107](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-107) | Готово к ревью |

Подробное «что сохранить / только демо / открыто» для каждого PNG — README комплекта. Изображения созданы настоящим image_gen, не программным рисованием.

## Прямые адаптации, для которых отдельный PNG не требуется

| Семейство | Не потерять состояния | Основа |
|---|---|---|
| FEED | Поиск/результаты/пусто/категории/сортировка/фильтры/избранное | Принятый FEED + старые 22:10156/22:10296/22:10341 |
| EVENT | Закрыто/ожидает результата/исход 1/исход 2/отмена/ссылка/нет предложений/404 | Принятый EVENT + старые 22:11305–22:11416; новые коды не создавать вместо существующих |
| MY-BETS | Деталь предложения/исполнения, отмена остатка, пустые, завершённые | MY-BETS + EVENT, старые 22:16563/22:16680/22:16944 |
| Уведомления | Непрочитанные/прочитанные/деталь/пусто и типы уведомления | NOTIFICATIONS_ALL +22:25701/22:25872/22:25821 |
| История | Сделки/предложения/расчёт/выплата/возврат/отмена/деталь/пусто | HISTORY_ALL +22:17326/22:17382/22:17723/22:17783 |
| Профиль автора | Публичный/события/статистика/гость | Профильные PNG +22:26849/22:26888/22:26915/22:27352 |
| Кошелёк | Ошибка подключения/недоступен/ограничен, будущие deposit/withdrawdisabled | WALLET_NOT_CONNECTED +22:29309/22:29327/22:29349 |
| Гарант | Фикс, смешанный, процент с минимумом;доступность выключена;сохранено | GUARANTOR_TARIFFS +332:140/332:193/332:225/333:318;4 модели из принятойсистемы |
| Проверки гаранта | История/пусто/отзыв/сохранён/выборпобедителя/доказательства/подтверждение | Новыйпрофиль/решение +332:248/337:198/331:300/331:331/348:223/332:474/333:165 |
| Согласование | Роль гаранта,контрпредложения,явноеподтверждениеобеими,устаревшаяредакция | Принятые 493:351–354 +330:230/330:270/332:413 |
| Частное участие | Принятиеправил/протокол/ожиданиеобеспечения/отмена |331:149/331:180/463:683/415:582 +принятый GUARANTOR;финансовыевопросыотдельно |
| Модерация | edit/reject/reason/error/approve/check/success/conflict/forbidden | Новые 3PNG +414:36/414:168/415:916/414:102/414:135/22:31039 |
| Помощь | P2P/предложения/комиссия/исход/частное/отмена/FAQ/правила | HELP_HOME + страницы 16HELP, тексты сверить |
| Система | Skeleton/empty/offline/retry/auth/expired/403/404/maintenance/balance/changedquote/sheet/modal/toast | Принятые компоненты +18SYSTEM STATES |
| Admin | Пользователи,событие,аудит,health,ошибки,инцидент,безопасность,backup,alerts,сверка,blockchain,роли | 3desktopPNG +все 15 оригиналов 421/428 |

## Разделы без самостоятельного нового PNG

Профиль имеет три прежних PNG вместо четвёртого. Поиск/фильтры/категории, избранное/черновики, роли и конечные состояния EVENT/MY-BETS, участник частного пари, история/отзывы гаранта, справочные статьи, системные ошибки и 12 прочих desktop страниц — самостоятельных новых PNG нет, но функциональные источники и шаблоны для адаптации указаны. Future/experiments, юридические тексты и рабочие операции кошелька не признаны готовыми или обязательными.

## Критерии готовности будущего Figma-прохода

- Каждый рабочий экран редактируем: нативные текст, таблицы, графики, кнопки и иконки; компоненты, экземпляры и Auto Layout. Растр допустим для фото, иллюстраций и логотипов, не для всей UI.
- Сохраняются порядок и функциональность исходных состояний с поздними поправками. Не добавляются новые финансовые поля и гарантии. Суммы, коэффициенты, резерв, прибыль и выплата не противоречат друг другу; формулы не выводятся из PNG.
- Основная ширина — 390 px. На 320 и 430 px проверены длинные надписи, кнопки, вкладки, нижняя панель, клавиатура, доступность прокрутки и отсутствие обрезаний. Для desktop 1440 px сохраняется табличная композиция.
- Для каждой уникальной композиции получен настоящий скриншот Figma, сравнён с принятым эталоном и PNG; очевидные различия исправлены. Текущий пакет референсов не заменяет проверку будущих макетов.
- Роли и этапы различимы: приглашение, согласование, публикация, приём ставок, решение, расчёт. Сообщение чата не подтверждает редакцию. Ориентировочное завершение не является фактическим.
- Прототип связан в пределах доступных экранов. Демонстрационные переходы не выдаются за backend или реальное отправление приглашений.

## Итоговая оценка готовности материалов

Материалов достаточно для большого поэтапного задания на перенос основных оставшихся разделов, с сохранением принятых экранов и локальным QA. Недостаточно для заявления «вся Figma готова и утверждена»: новые PNG ещё не прошли пользовательское ревью, текст кабинета спорный, онбординг не выбран; глобальная навигация, профильная метрика, закрытие ставок без гаранта и обеспечение вознаграждения имеют открытые решения. Эти вопросы нужно обходить без придумывания правил, продолжая независимую визуальную работу.
