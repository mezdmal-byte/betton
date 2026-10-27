# BetTON — полная карта экранов Figma · 28.10.2026

Статус: аудит и подготовка переноса. Это не утверждение новых экранов и не изменение продукта.

Файл: https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA. Исходные макеты не изменялись. Проверены все **35 страниц** файла: названия, иерархия, размеры и Node IDs; в приложении ниже **1237 фреймов-кандидатов** с учётом архивов, QA, прототипных копий и обзорных досок. Это **не 1237 уникальных экранов продукта**. Карта ниже сводит их в **28 функциональных разделов**.

## Что проверено и чего аудит не доказывает

- Выполнен полный структурный обход страниц с дополнительным обходом вложенных обзорных досок. Сохранён `FIGMA_INVENTORY_RAW.json` с Node IDs, путями и размерами. В крупных страницах текст всех копий не выгружался: содержимое ключевых сценариев прочитано отдельно.
- Визуально открыты репрезентативные исходники: новая главная, старые Мои события/управление, уведомления, история, кошелёк, настройки, помощь, профиль/приглашение/тарифы/решение/история гаранта, модерация/сравнение и 3 шаблона Admin Center. Это не покадровый пиксельный QA каждого архивного дубля.
- Все **10 оригинальных PNG v1** и **3 профильных PNG** получены и открыты. Все 13 декодируются; SHA-256 совпали с сохранёнными MANIFEST. Отклонённая генерация события и концепты 4/8 состояний не использовались как новые утверждённые экраны.
- Прочитаны README, FIGMA_HANDOFF, CREATE_FLOW_VISUAL_DECISIONS_2026-10-27, PROFILE_VISUAL_DECISIONS_2026-10-28 и профильный README из Library. Более поздние прямые решения пользователя имеют приоритет.
- Поиск дополнительного контекста прошлых чатов оказался недоступен. Достоверный источник поздних решений — доступная переписка, текущая Figma и указанные журналы. История версий Figma не восстанавливалась.
- Статусы CURRENT/FUTURE/SHELL в старых кадрах — авторские пометки макетов, **не доказательство реализации API**. React/backend/production не проверялись и не менялись. Прототипы не запускались в Present; клики и адаптивность новых будущих макетов здесь не сертифицированы.

## Приоритет поздних решений

1. FEED, EVENT, MY-BETS, DRAWER, GUARANTOR-PICK и основное частное пари с inline Чат/Условия/История приняты и заморожены. Новая генерация этих экранов не требуется.
2. Публичный CREATE и частный без гаранта приняты. С гарантом уже собран; последнее добавление начала выполнено по замечанию пользователя, отдельного окончательного принятия после этой правки ещё нет.
3. **Частное с гарантом:** начало закрывает приём ставок; ориентировочное завершение нужно для оценки гарантом и не завершает событие. Текущий [750:22992](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-22992) показывает 19:00/22:00. Старый журнал CREATE ещё содержит открытый вопрос без этого позднего уточнения — не откатывать Figma.
4. Срок закрытия у **частного без гаранта** остаётся отдельно нерешённым. Не переносить решение предыдущего пункта автоматически.
5. При недостаточном встречном объёме пользователь может убрать хвост/уменьшить сумму либо задать собственный минимальный коэффициент для ожидающей части; автоматический возврат не является универсальным правилом. Финансовые формулы не менялись.
6. Профиль: шапка/баннер из №2, низ/одна статистика из №3. Предлагаемая навигация `Главная / Мои ставки / Создать / Мои события / Профиль`, колокольчик сверху — **не глобально утверждена**. В остальных принятых макетах сохранять текущую пятёрку.
7. `Результат` — рабочая русская подпись метрики профиля; семантика и доступность расчёта требуют подтверждения. Не изображать демонстрационные суммы/верификацию/кошелёк как действующие возможности.

## Карта разделов и переноса

«Нового нет» ниже означает отсутствие нового оформления на VISUAL V1, **не отсутствие старого экрана**. Новые PNG имеют статус ревью, пользователь их ещё не утверждал.

| Раздел | Старые источники — Node IDs | Новый стиль / принятые кадры | PNG-референс и статус | Уже предусмотренные состояния | Что делать дальше |
|---|---|---|---|---|---|
| Главная, категории, поиск | [22:10070](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10070), [22:10156](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10156), [22:10190](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10190), [22:10296](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10296), [22:10341](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10341) | [487:2](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=487-2), [498:556](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-556), [498:1002](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-1002) | Да: feed-v1.png; новая главная принята | Поиск, результаты/пусто, фильтры, категории, сортировка, закрытые/завершённые карточки | Не пересоздавать FEED. Адаптировать поиск/категории/фильтры и пустые варианты существующих компонентов; отдельный PNG не нужен. |
| Избранное и черновики | [22:10763](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10763), [22:31527](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31527), [22:31960](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31960), [22:31980](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31980) | 493:355 — входы меню | Самостоятельного принятого PNG нет | Избранное и редактирование черновика отмечены FUTURE/EXPERIMENT | Адаптация карточек FEED/форм CREATE; наличие пунктов меню не подтверждает backend. Не добавлять в обязательный релиз без решения. |
| Событие и размещение ставок | [22:10995](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10995), [22:11049](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11049), [22:11125](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11125), [22:11305](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11305), [22:11350](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11350), [22:11394](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11394) | [500:2399](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-2399), [566:23541](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=566-23541), [566:24121](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=566-24121), [566:24602](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=566-24602), [578:6024](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=578-6024), [578:24819](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=578-24819), [578:25471](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=578-25471), [578:26116](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=578-26116), [620:18529](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=620-18529) | Да: event-layout-v1.png + event-header-v1.png; EVENT принят | 4 вкладки, выбранное предложение, быстрая/своя заявка, подтверждения, частичное исполнение, ожидание/отмена остатка, клавиатура, QA320/430 | Сохранить. Адаптировать закрыто/результат/отмена/404/доступ по ссылке и роли, если нет нового варианта. Не создавать новую концепцию ставки. |
| Мои ставки | [22:16441](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16441), [22:16563](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16563), [22:16680](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16680), [22:16742](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16742), [22:16944](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16944) | [487:4](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=487-4), [500:2628](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-2628), [498:1912](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-1912), [498:2330](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-2330) | Да: my-bets-v1.png; новая версия принята | Все / В ставках / Мои предложения / Завершённые, С гарантами отдельно, активные/ожидание/завершённые карточки | Деталь пари/предложения, отмена остатка, пустые/ошибки — адаптации EVENT и карточек, не новый MY-BETS. |
| Мои события | [22:27414](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27414), [22:27493](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27493), [22:27560](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27560), [22:27633](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27633), [22:27706](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27706), [22:27767](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27767), [22:27834](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27834), [22:27895](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27895), [22:27962](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27962), [333:209](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-209) | Нового списка в VISUAL V1 не найдено | Ранее нет; теперь MY_EVENTS_ALL.png — к ревью | Все/Открытые/Завершённые; модерация, ожидание решения, отклонено, отменено, пусто | Новый визуальный список на старой функциональности; состояния адаптировать, не генерировать десяток одинаковых. |
| Управление своим событием | [22:28022](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-28022), [22:19374](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19374), [22:19303](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19303) | Новой отдельной версии не найдено | MY_EVENT_MANAGEMENT.png — к ревью | Открыто, ожидание результата, отклонение с причиной, исправить/отправить повторно | Собрать нативную страницу из карточки события и строк параметров; доступные действия зависят от статуса/роли. Формулы не менять. |
| Создание — выбор типа | [328:19](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-19), [413:364](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=413-364), [413:392](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=413-392), [413:420](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=413-420) | [720:27261](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=720-27261), [720:27345](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=720-27345), [720:27429](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=720-27429) | V3: 05_PUBLIC_CREATE_APPROVED.png / 02_CREATE_THREE_FLOWS_BASE.png | 3 типа; выбранные состояния и Continue | Готовый CREATE-01 не пересоздавать. |
| Создание — публичное | [375:17002](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=375-17002), [375:17030](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=375-17030), [333:334](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-334) | [728:22227](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=728-22227), [737:22356](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=737-22356), [737:22518](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=737-22518), [737:22656](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=737-22656), [738:23116](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=738-23116), [738:23238](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=738-23238) | Да, V3; пользователь принял сценарий | Вопрос+2 исхода+категория, критерии/источники/начало, проверка, отправлено, календарь, клавиатура | Сохранить. Ошибки/редактирование/повторная отправка — адаптации. Не восстанавливать 8 шагов или прогноз завершения. |
| Создание — без гаранта | [375:17068](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=375-17068), [375:17096](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=375-17096), [333:351](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-351), [415:516](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-516), [415:549](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-549) | [744:22843](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-22843), [744:22886](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-22886), [744:22972](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-22972), [744:23027](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23027), [744:23476](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23476), [744:23528](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23528) | Да, V3; сценарий принят | Вопрос/условия/проверка/создано/пригласить/копирование; QA320/430, клавиатура | Сохранить. Закрытие приёма ставок у этого типа остаётся открытым; не наследовать решение для гаранта автоматически. |
| Создание — с гарантом | [328:47](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-47), [328:76](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-76), [328:106](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-106), [330:107](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-107), [331:366](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-366) | [750:22946](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-22946), [750:22992](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-22992), [750:23049](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-23049), [751:23338](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=751-23338), [751:23546](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=751-23546), [750:23387](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-23387), [750:23876](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-23876), [750:24027](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-24027) | Да, V3; последний старт добавлен по замечанию пользователя | Начало 19:00 и ориентировочное завершение 22:00, выбор существующего гаранта, приглашение, ожидание/принят/отказ, календари обеих дат, QA | Не создавать заново. Последнее исправление начала ещё не имеет отдельного финального принятия. Приглашение≠согласование≠приём ставок. |
| Уведомления | [22:25630](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-25630), [22:25701](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-25701), [22:25762](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-25762), [22:25872](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-25872), [22:25821](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-25821) | Новой версии не найдено | NOTIFICATIONS_ALL.png — к ревью | Все/Непрочитанные/Прочитанные, деталь; частичное/полное исполнение, отмена, возврат, расчёт, выплата, модерация; пусто; Preferences/OS — FUTURE | Новый визуальный список; фильтры и детали адаптировать. Не обещать push-доставку. |
| Свой профиль | [22:26777](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26777), [22:27012](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27012), [22:27148](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27148), [22:27216](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27216) | Нативного PROFILE нового стиля не найдено | 3 оригинальных профильных PNG открыты; не окончательно утверждены | Баланс, единая статистика/период, меню, Станьте гарантом | Собрать из шапки/баннера№2 и нижней навигации/единой статистики№3. Не придумывать четвёртый концепт. Результат — рабочее название. |
| Публичный автор | [22:26849](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26849), [22:26888](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26888), [22:26915](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26915) | Нового оформления не найдено | Отдельного принятого PNG нет; использовать профильные части | Публичный профиль, события автора, статистика, гостевой режим 22:27352 | Адаптировать профиль/список событий. Только доступные достоверные метрики, не выдумывать рейтинг автора. |
| Настройки | [22:26946](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26946), [22:26640](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26640), [22:26704](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26704) | Новой версии не найдено | SETTINGS.png — к ревью | Тема/язык/уведомления/безопасность/о приложении; preferences/OS FUTURE | Новая оболочка, варианты строк и языковой выбор — компоненты. Тёмную тему не считать утверждённой. |
| История операций | [22:17261](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17261), [22:17326](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17326), [22:17382](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17382), [22:17441](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17441), [22:17610](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17610), [22:17723](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17723), [22:17783](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17783) | Новой версии не найдено | HISTORY_ALL.png — к ревью | Все/Сделки/Мои предложения, расчёты, доход создателя, выплата/возврат/отмена, деталь, пусто | Список + деталь адаптацией; данные и формулы из проекта, не из PNG. |
| Кошелёк | [22:29235](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29235), [22:29261](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29261), [22:29285](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29285), [22:29309](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29309), [22:29327](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29327), [22:29349](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29349), [22:29373](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29373) | Новой версии не найдено | WALLET_NOT_CONNECTED.png — к ревью | Не подключён/недоступен/ограничен; deposit/withdraw/transaction отмечены FUTURE | Перенести shell. Не проектировать работающую финансовую интеграцию на основании демонстрации профиля. |
| Поиск/выбор гаранта | [328:133](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-133), [328:169](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-169), [328:203](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-203) | [487:5](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=487-5), [500:2837](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-2837), [498:2539](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-2539), [498:2821](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-2821) | Да: guarantor-select-v1.png; принято | Сортировка, фильтры, карточки, О себе, выбор и stickyContinue | Не пересоздавать. Поиск/пустой список/нет bio/длинный bio — адаптации. |
| Публичный профиль гаранта | [328:235](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-235), [330:46](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-46), [330:77](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-77), [332:441](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-441) | Отдельной новой версии не найдено | GUARANTOR_PUBLIC_PROFILE.png — к ревью | До выбора и выбранный гарант, отзывы, события/история проверок | Новый визуальный профиль из принятой карточки гаранта; различать базовый и согласованный тариф пари. |
| Кабинет гаранта, приглашения, тарифы | [332:108](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-108), [330:165](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-165), [332:140](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-140), [332:165](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-165), [332:193](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-193), [332:225](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-225), [333:318](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-318) | [Новых самостоятельных страниц нет](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=Новых самостоятельных страниц нет), [ часть статусов приглашения уже в CREATE](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id= часть статусов приглашения уже в CREATE) | GUARANTOR_DASHBOARD / INVITATION / TARIFFS — к ревью, dashboard требует сверки текста | Доступность, приглашение, формы тарифа, сохранён, отказ/нет ответа, проверки | Новые 3 композиции. Фикс/смешанный/процент с минимумом и состояния — адаптации. Устаревшие таймеры 00:42/5 мин не переносить. |
| Согласование условий | [330:192](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-192), [330:230](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-230), [330:270](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-270), [330:309](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-309), [332:387](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-387), [332:413](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-413), [335:272](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=335-272) | [493:351](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=493-351), [493:352](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=493-352), [493:353](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=493-353), [493:354](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=493-354), [500:3081](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-3081), [500:3158](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-3158), [500:3249](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-3249) | Да: guarantor-v1 основа + принятая inline композиция; концепты 4/8 только детали | Чат/Условия/История внутри основного пари, редакции, встречный тариф, явные подтверждения | Сохранить принятый inline. Адаптировать роль гаранта и его исходящие действия; не возвращать отдельное приложение согласования. |
| Результат и история гаранта | [331:211](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-211), [333:165](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-165), [348:223](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=348-223), [332:474](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-474), [331:243](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-243), [331:276](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-276), [331:300](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-300), [331:331](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-331), [332:248](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-248), [337:214](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=337-214) | Отдельного нового набора нет | GUARANTOR_DECISION.png — к ревью | Выбор исхода, доказательства, проверка/подтверждение, ожидание, отмена, отзыв, сохранён, история | Новый эталон решения; подтверждение/результат/отзыв/история адаптировать из EVENT и профильных карточек. Решение окончательное по существующей логике. |
| Согласие участника и обеспечение | [331:149](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-149), [331:180](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-180), [463:683](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=463-683), [415:582](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-582), [415:615](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-615), [415:648](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-648) | Часть действий покрыта EVENT/GUARANTOR, полного нового набора нет | Самостоятельного принятого PNG нет; адаптация существующих компонентов | Принятие правил перед первой ставкой, протокол, ожидание объёма, частное без гаранта | Не потерять в массовом переносе. Формулу обеспечения/20% и сроки не придумывать по старой подписи — сверить действующие правила перед отображением расчётов. |
| Модерация | [22:30639](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30639), [414:3](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-3), [414:36](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-36), [414:69](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-69), [414:102](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-102), [414:168](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-168), [415:820](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-820), [415:847](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-847), [415:876](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-876) | Новых самостоятельных экранов не найдено | MODERATION_QUEUE / REVIEW / COMPARE — к ревью | Очередь, review/edit/compare, одобрение исходной/исправленной, публикация, отклонение/причина/ошибка, уведомление автора; старые close/void/settlement | 3 новых эталона; формы/подтверждения/результаты — адаптации. Автора и вознаграждение не подменять модератором. Не копировать устаревшие сроки/поля CREATE. |
| Иллюстрированный онбординг | [291:17](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=291-17), [291:66](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=291-66), [291:109](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=291-109), [291:149](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=291-149), [291:184](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=291-184), [304:2146](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=304-2146), [304:2190](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=304-2190), [304:2231](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=304-2231) | Нового оранжевого комплекта нет | Есть иллюстрации Figma, не отдельный новый PNG; финальный выбор 5 кадров не подтверждён | Иллюстрированная V2, сохранённая V1, 3 подробныхтипа; entry/auth/loading/error | Сохранить композиции и иллюстрации, адаптировать палитру/типографику после выбора кадров. Ничего не генерировать заново. |
| Помощь и правила | [22:29409](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29409), [22:29429](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29429), [22:29454](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29454), [22:29474](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29474), [22:29513](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29513), [22:29536](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29536), [22:29600](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29600), [22:29619](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29619), [22:29661](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29661), [22:29684](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29684) | Нового оформления не найдено | HELP_HOME.png — к ревью | P2P, предложения, комиссия, определение результата, частное, отмена, FAQ, правила; юридические документы FUTURE | Одна оболочка + адаптации текстовых статей/аккордеонов. Тексты частичного исполнения сверить с поздним решением об ожидающем остатке. |
| Системные состояния | [22:31102](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31102), [22:31137](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31137), [22:31154](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31154), [22:31190](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31190), [22:31207](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31207), [22:31224](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31224), [22:31241](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31241), [22:31310](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31310), [22:31344](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31344), [22:31363](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31363), [22:31418](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31418), [22:31475](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31475), [22:31496](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31496) | [500:3343](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-3343), [500:3566](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-3566), [EVENT/CREATE QA/keyboard частично готовы](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=EVENT/CREATE QA/keyboard частично готовы) | Самостоятельного принятого PNG нет; отдельная генерация не нужна | Skeleton/loading/empty/offline/retry/auth/expired/403/404/maintenance/quotechange/balance/destructive/sheet/modal/toast | Адаптировать общий набор нативных состояний; не создавать отдельную визуальную концепцию на каждую ошибку. |
| Admin Center desktop | [421:3](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-3), [421:29](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-29), [421:55](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-55), [421:81](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-81), [421:107](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-107), [421:133](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-133), [428:2](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-2), [428:98](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-98), [428:194](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-194), [428:290](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-290), [428:386](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-386), [428:482](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-482), [428:578](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-578), [428:674](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-674), [428:770](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-770) | [Нового светлого набора нет](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=Нового светлого набора нет), [ старый desktop сохранён](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id= старый desktop сохранён) | ADMIN_OVERVIEW / USER_DETAIL / LEDGER — к ревью | 15 отдельных desktop страниц:обзор,пользователи,карточки,журнал,аудит,health,ошибки,инцидент,безопасность,backup,alerts,сверка,blockchain,роли | 3 новыхшаблона;12 страницадаптировать,сохранивтаблицы/метрики/права/демо. Не сжимать desktop до 390. Только просмотр. |
| Будущие эксперименты | [22:31527](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31527), [22:31563](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31563), [22:31598](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31598), [22:31742](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31742), [22:31940](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31940), [22:32018](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32018) | Не считать новым VISUAL V1 | Нет утверждённых PNG | Watchlist/recent/trending/analytics/report/platformstatus/юридическиечерновики | Инвентаризировать, не включать автоматически в обязательную массовую реализацию. Не восстанавливать LMSR/отвергнутые направления. |

## Обнаруженные расхождения, без вмешательства в принятый дизайн

- Имя фрейма EVENT `608:18979` по-прежнему «остаток возвращён», но текущий видимый текст правильно говорит «Часть предложения ожидает» и оставляет 1300 TON в резерве по 1.67. Ошибка имени слоя, а не основание менять принятую механику.
- Старый guarantor UX содержит «ответ за минуту», 00:42, 5 минут на согласование. Новые приглашения не копируют их как действующие правила. 24 часа относится к решению после фактического завершения, не к ответу на приглашение.
- В кабинете гаранта унаследовано «Новые приглашения доступны в течение часа». Значение этого ограничения не подтверждено последним журналом; PNG этого кабинета требует сверки текста перед финальным переносом.
- Старое `463:683` содержит формулу обеспечения и минимум прибыли 20%. Это не разрешение вводить новые расчёты в экран. Нужна сверка действующей продуктовой спецификации перед переносом финансово значимых условий.
- Старый модераторский UX содержит отдельное «Приём ставок до», дополнительное описание и редактируемое правило невозможности результата. Не возвращать их в CREATE вопреки V3; для модерации сохранять необходимые сведения, но унифицировать с поздним CREATE и общими правилами без самовольного изменения логики.
- Profile PNG содержит идеи пополнения/вывода/перевода, курс USD и верификацию. Старый WALLET прямо говорит SHELL/FUTURE. В новом кошельке показано неподключённое состояние, денежные действия отключены.
- В публичном CREATE обзор `740:22661` — FRAME, а основные экраны вложены в него. Это структурный риск для межэкранных NAVIGATE-переходов; фактическая поломка в Present не проверена. Перед демонстрацией прототипа проверить, при необходимости заменить только обёртку на SECTION с сохранением кадров и геометрии. В этом аудите ничего не менялось.
- Принятое частное пари в старом примере использует «карта 1», новый CREATE — весь матч. Это демонстрационные разные контексты/редакции; не объединять молча критерии и тарифы разных пари.

## Дизайн-система, существующая на момент аудита

На BETTON — COMPONENTS найдены **85 компонентов** и **13 component sets**; во всём файле доступны **104 локальные переменные** и **15 текстовых стилей**. Часть глобальных переменных историческая; не переносить старую палитру по факту её наличия.

- [480:18088](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=480-18088) — V1/Button
- [480:18093](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=480-18093) — V1/Tab
- [480:18106](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=480-18106) — V1/Outcome
- [480:18270](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=480-18270) — V1/Bottom navigation
- [480:18300](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=480-18300) — V1/Chat message
- [503:137](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=503-137) — V1/Status
- [552:541](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=552-541) — EVENT01/Chart tooltip
- [552:556](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=552-556) — EVENT01/Stake mode
- [719:367](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=719-367) — CREATE01/Event type
- [719:391](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=719-391) — CREATE01/Type selection
- [727:471](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=727-471) — CREATE02/Field
- [736:475](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=736-475) — CREATE/Public header
- [736:492](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=736-492) — CREATE/Optional source

Нужные будущие расширения: строки уведомления/операции/настроек, карточка статуса своего события, таблица desktop, сравнение редакций, профильная статистика и формы кабинета гаранта. Расширять текущие компоненты, а не строить новую библиотеку заново.

## Полный поимённый реестр найденных кадров

Названия ниже переданы из Figma без исправления опечаток и устаревших терминов. Архивные/QA/прототипные страницы сохранены в реестре для прослеживаемости, не включены автоматически в очередь новой генерации. Список не означает утверждения каждого состояния. Доски большого размера могут быть контейнерами, а не пользовательским экраном.

### МАКЕТЫ ГЕНЕРАЦИИ · [662:2](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=662-2)

Экранные фреймы не выявлены данным обходом: страница содержит компоненты, служебные материалы или изображения.

### 00 — INDEX / COVER · [12:2](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-2)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [12:4095](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-4095) | 00 · BetTON · Product Architecture | 1660×1040 | /BETTON · REVIEW START HERE |
| [22:34411](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-34411) | 01 · BetTON · Product Directory | 1660×1769 | /BETTON · REVIEW START HERE |

### 01 — FOUNDATIONS · [12:3](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-3)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [12:34](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-34) | 01 · Foundations · Сетка и геометрия | 390×844 | /CORE |
| [12:67](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-67) | 02 · Foundations · Цвет и контраст | 390×844 | /CORE |
| [12:83](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-83) | 03 · Foundations · Типографика | 390×844 | /CORE |
| [59:792](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=59-792) | Light C · Token and component contract | 1384×1336 | /A / C · SEMANTIC SYSTEM · DESIGN CANDIDATE |

### 02 — COMPONENTS · [12:4](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-4)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [12:103](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-103) | 01 · Components · Навигация и выбор | 390×844 | /CORE |
| [12:154](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-154) | 02 · Components · Строки продукта | 390×844 | /CORE |
| [12:259](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-259) | 05 · Components · Кнопки и icon buttons | 390×844 | /STATES |
| [12:187](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-187) | 03 · Components · Обратная связь | 390×844 | /ERRORS |
| [12:227](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-227) | 04 · Components · Системные состояния | 390×844 | /ERRORS |
| [12:285](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-285) | 06 · Components · Inputs & Search | 390×844 | /ERRORS |
| [54:159](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=54-159) | Screen content | 390×768 | /REUSABLE COMPONENTS · REFINED/BetTON / App Shell |
| [81:147](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=81-147) | Catalog column 1 | 390×1489 | /LIGHT C · Shared component catalog |
| [81:240](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=81-240) | Catalog column 2 | 390×1770 | /LIGHT C · Shared component catalog |
| [81:335](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=81-335) | Catalog column 3 | 390×1399 | /LIGHT C · Shared component catalog |
| [81:391](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=81-391) | Catalog column 4 | 390×1375 | /LIGHT C · Shared component catalog |

### 03 — ENTRY / ONBOARDING · [12:5](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-5)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:29030](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29030) | 01 · Entry · Splash | 390×844 | /CORE |
| [22:29067](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29067) | 02 · Entry · Welcome | 390×844 | /CORE |
| [22:29087](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29087) | 03 · Entry · P2P Intro | 390×844 | /CORE |
| [22:29109](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29109) | 04 · Entry · How Markets Work | 390×844 | /CORE |
| [22:29129](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29129) | 05 · Entry · Quick Trade vs Own Price | 390×844 | /CORE |
| [22:29147](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29147) | 06 · Entry · Fee Explanation | 390×844 | /CORE |
| [22:29170](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29170) | 07 · Entry · Final CTA | 390×844 | /CORE |
| [22:29188](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29188) | 08 · Entry · Auth Required | 390×844 | /CORE |
| [22:29047](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29047) | 09 · Entry · Initial Loading | 390×844 | /STATES |
| [22:29208](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29208) | 10 · Entry · Telegram Auth Failure | 390×844 | /ERRORS |

### 04 — MARKETS · [12:6](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-6)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:10070](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10070) | 01 · Markets · Default Feed | 390×844 | /CORE |
| [22:10156](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10156) | 02 · Markets · Search | 390×844 | /CORE |
| [22:10190](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10190) | 03 · Markets · Search Results | 390×844 | /CORE |
| [22:10296](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10296) | 04 · Markets · Filters | 390×844 | /CORE |
| [22:10341](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10341) | 05 · Markets · Category | 390×844 | /CORE |
| [22:10394](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10394) | 06 · Markets · Popular | 390×844 | /CORE |
| [22:10458](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10458) | 07 · Markets · New | 390×844 | /CORE |
| [22:10522](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10522) | 08 · Markets · Closing Soon | 390×844 | /CORE |
| [22:10574](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10574) | 09 · Markets · Available Offers | 390×844 | /CORE |
| [22:10257](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10257) | 10 · Markets · Empty Search | 390×844 | /STATES |
| [22:10638](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10638) | 11 · Markets · No Offers | 390×844 | /STATES |
| [22:10679](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10679) | 12 · Markets · Closed Row | 390×844 | /STATES |
| [22:10722](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10722) | 13 · Markets · Resolved Row | 390×844 | /STATES |
| [22:10763](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10763) | 14 · Markets · Saved FUTURE | 390×844 | /FUTURE |
| [22:10816](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10816) | 15 · Markets · Recently Viewed FUTURE | 390×844 | /FUTURE |
| [22:10879](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10879) | 16 · Markets · Trending FUTURE | 390×844 | /FUTURE |
| [22:10944](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10944) | 17 · Markets · Recently Resolved FUTURE | 390×844 | /FUTURE |

### 05 — MARKET DETAIL · [12:7](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-7)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:10995](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-10995) | 01 · Market Detail · Overview | 390×844 | /CORE |
| [22:11049](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11049) | 02 · Market Detail · Full Order Book | 390×844 | /CORE |
| [22:11086](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11086) | 03 · Market Detail · Recent Trades | 390×844 | /CORE |
| [22:11125](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11125) | 04 · Market Detail · Trade Odds History | 390×844 | /CORE |
| [22:11172](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11172) | 05 · Market Detail · Criteria | 390×844 | /CORE |
| [22:11194](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11194) | 06 · Market Detail · Sources | 390×844 | /CORE |
| [22:11216](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11216) | 07 · Market Detail · Resolution Source | 390×844 | /CORE |
| [22:11238](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11238) | 08 · Market Detail · Share | 390×844 | /CORE |
| [22:11261](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11261) | 09 · Market Detail · Unlisted Access | 390×844 | /CORE |
| [22:11283](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11283) | 11 · Market Detail · No Offers | 390×844 | /STATES |
| [22:11305](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11305) | 12 · Market Detail · Closed | 390×844 | /STATES |
| [22:11327](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11327) | 13 · Market Detail · Awaiting Resolution | 390×844 | /STATES |
| [22:11350](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11350) | 14 · Market Detail · Resolved Outcome 1 | 390×844 | /STATES |
| [22:11372](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11372) | 15 · Market Detail · Resolved Outcome 2 | 390×844 | /STATES |
| [22:11394](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11394) | 16 · Market Detail · Voided | 390×844 | /STATES |
| [22:11416](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11416) | 17 · Market Detail · Not Found | 390×844 | /ERRORS |

### 06 — QUICK TRADE · [12:8](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-8)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:13261](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-13261) | 01 · Quick Trade · Entry | 390×844 | /CORE |
| [22:13327](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-13327) | 02 · Quick Trade · Select Outcome 1 | 390×844 | /CORE |
| [22:13381](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-13381) | 03 · Quick Trade · Select Outcome 2 | 390×844 | /CORE |
| [22:13435](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-13435) | 04 · Quick Trade · Amount Input | 390×844 | /CORE |
| [22:13482](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-13482) | 05 · Quick Trade · Execution Preview | 390×844 | /CORE |
| [22:13588](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-13588) | 06 · Quick Trade · Confirmation | 390×844 | /CORE |
| [22:13535](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-13535) | 07 · Quick Trade · Partial Fill Preview | 390×844 | /STATES |
| [22:13638](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-13638) | 08 · Quick Trade · Quote Changed | 390×844 | /STATES |
| [22:13688](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-13688) | 09 · Quick Trade · No Offers | 390×844 | /STATES |
| [22:13782](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-13782) | 10 · Quick Trade · Processing | 390×844 | /STATES |
| [22:13811](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-13811) | 11 · Quick Trade · Full Fill | 390×844 | /STATES |
| [22:13858](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-13858) | 12 · Quick Trade · Partial Fill | 390×844 | /STATES |
| [22:13955](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-13955) | 13 · Quick Trade · Success | 390×844 | /STATES |
| [22:14002](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14002) | 14 · Quick Trade · Position Created | 390×844 | /STATES |
| [22:13735](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-13735) | 15 · Quick Trade · Insufficient Balance | 390×844 | /ERRORS |
| [22:13908](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-13908) | 16 · Quick Trade · Failed | 390×844 | /ERRORS |

### 07 — OWN PRICE · [12:9](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-9)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:14058](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14058) | 01 · Own Price · Entry | 390×844 | /CORE |
| [22:14124](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14124) | 02 · Own Price · Select Outcome 1 | 390×844 | /CORE |
| [22:14178](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14178) | 03 · Own Price · Select Outcome 2 | 390×844 | /CORE |
| [22:14232](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14232) | 04 · Own Price · Price Input | 390×844 | /CORE |
| [22:14279](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14279) | 05 · Own Price · Amount Input | 390×844 | /CORE |
| [22:14326](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14326) | 06 · Own Price · Reserve Preview | 390×844 | /CORE |
| [22:14373](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14373) | 07 · Own Price · Order Preview | 390×844 | /CORE |
| [22:14426](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14426) | 08 · Own Price · Confirmation | 390×844 | /CORE |
| [22:14693](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14693) | 09 · Own Price · Order Detail | 390×844 | /CORE |
| [22:14743](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14743) | 10 · Own Price · Cancel Remainder Confirmation | 390×844 | /CORE |
| [22:14476](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14476) | 11 · Own Price · Processing | 390×844 | /STATES |
| [22:14505](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14505) | 12 · Own Price · Placed | 390×844 | /STATES |
| [22:14552](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14552) | 13 · Own Price · Resting Order | 390×844 | /STATES |
| [22:14599](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14599) | 14 · Own Price · Partial Fill | 390×844 | /STATES |
| [22:14646](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14646) | 15 · Own Price · Full Fill | 390×844 | /STATES |
| [22:14793](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14793) | 16 · Own Price · Cancelled | 390×844 | /STATES |
| [22:14840](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14840) | 17 · Own Price · Invalid Price | 390×844 | /ERRORS |
| [22:14887](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14887) | 18 · Own Price · Invalid Step | 390×844 | /ERRORS |
| [22:14934](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14934) | 19 · Own Price · Insufficient Reserve | 390×844 | /ERRORS |
| [22:14981](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-14981) | 20 · Own Price · Submission Error | 390×844 | /ERRORS |

### 08 — PORTFOLIO · [12:10](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-10)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:16441](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16441) | 01 · Portfolio · Overview | 390×844 | /CORE |
| [22:16504](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16504) | 02 · Portfolio · Positions | 390×844 | /CORE |
| [22:16563](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16563) | 03 · Portfolio · Position Detail | 390×844 | /CORE |
| [22:16623](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16623) | 04 · Portfolio · Open Orders | 390×844 | /CORE |
| [22:16680](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16680) | 05 · Portfolio · Order Detail | 390×844 | /CORE |
| [22:16742](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16742) | 06 · Portfolio · Settled Positions | 390×844 | /CORE |
| [22:16890](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16890) | 07 · Portfolio · Creator Income | 390×844 | /CORE |
| [22:16944](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16944) | 08 · Portfolio · Cancel Order | 390×844 | /CORE |
| [22:16791](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16791) | 09 · Portfolio · Closed Positions | 390×844 | /STATES |
| [22:16840](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-16840) | 10 · Portfolio · Cancelled Orders | 390×844 | /STATES |
| [22:17000](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17000) | 11 · Portfolio · Empty Portfolio | 390×844 | /STATES |
| [22:17047](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17047) | 12 · Portfolio · Empty Positions | 390×844 | /STATES |
| [22:17102](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17102) | 13 · Portfolio · Empty Orders | 390×844 | /STATES |
| [22:17156](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17156) | 14 · Portfolio · Unauthorized | 390×844 | /ERRORS |
| [22:17205](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17205) | 15 · Portfolio · Error | 390×844 | /ERRORS |

### 09 — ACTIVITY / HISTORY · [12:11](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-11)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:17261](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17261) | 01 · Activity · All | 390×844 | /CORE |
| [22:17326](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17326) | 02 · Activity · Trades | 390×844 | /CORE |
| [22:17382](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17382) | 03 · Activity · Orders | 390×844 | /CORE |
| [22:17441](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17441) | 04 · Activity · Settlement | 390×844 | /CORE |
| [22:17610](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17610) | 05 · Activity · Creator Income | 390×844 | /CORE |
| [22:17723](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17723) | 06 · Activity · Detail | 390×844 | /CORE |
| [22:17498](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17498) | 07 · Activity · Payout | 390×844 | /STATES |
| [22:17554](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17554) | 08 · Activity · Refund | 390×844 | /STATES |
| [22:17666](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17666) | 09 · Activity · Cancelled | 390×844 | /STATES |
| [22:17783](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17783) | 10 · Activity · Empty | 390×844 | /STATES |

### 10 — ARCHIVE · CREATE · прежние 8 шагов · [12:12](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-12)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:17849](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17849) | 01 · Create Market · Start | 390×844 | /CORE |
| [22:17919](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17919) | 02 · Create Market · Question | 390×844 | /CORE |
| [22:17991](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-17991) | 03 · Create Market · Description | 390×844 | /CORE |
| [22:18063](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-18063) | 04 · Create Market · Resolution Criteria | 390×844 | /CORE |
| [22:18138](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-18138) | 05 · Create Market · Primary Source | 390×844 | /CORE |
| [22:18210](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-18210) | 06 · Create Market · Additional Source | 390×844 | /CORE |
| [22:18285](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-18285) | 07 · Create Market · Category | 390×844 | /CORE |
| [22:18360](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-18360) | 08 · Create Market · Close Date | 390×844 | /CORE |
| [22:18432](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-18432) | 09 · Create Market · Close Time | 390×844 | /CORE |
| [22:18504](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-18504) | 10 · Create Market · Public or Unlisted | 390×844 | /CORE |
| [22:18586](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-18586) | 11 · Create Market · Review | 390×844 | /CORE |
| [22:18740](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-18740) | 12 · Create Market · Submit Confirmation | 390×844 | /CORE |
| [22:18814](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-18814) | 13 · Create Market · Processing | 390×844 | /STATES |
| [22:18880](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-18880) | 14 · Create Market · Pending Moderation | 390×844 | /STATES |
| [22:18663](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-18663) | 15 · Create Market · Validation Errors | 390×844 | /ERRORS |
| [22:18948](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-18948) | 16 · Create Market · Draft FUTURE | 390×844 | /FUTURE |
| [22:19016](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19016) | 17 · Create Market · Edit Draft FUTURE | 390×844 | /FUTURE |

### 11 — CREATE RESULTS · [12:13](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-13)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:19374](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19374) | 01 · Create Result · Edit and Resubmit | 390×844 | /CORE |
| [22:19590](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19590) | 02 · Create Result · Share Token | 390×844 | /CORE |
| [22:19658](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19658) | 03 · Create Result · Share Link | 390×844 | /CORE |
| [22:19856](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19856) | 04 · Create Result · Open Market | 390×844 | /CORE |
| [22:19099](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19099) | 05 · Create Result · Pending Moderation | 390×844 | /STATES |
| [22:19167](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19167) | 06 · Create Result · Approved | 390×844 | /STATES |
| [22:19235](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19235) | 07 · Create Result · Rejected | 390×844 | /STATES |
| [22:19448](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19448) | 08 · Create Result · Public Market Created | 390×844 | /STATES |
| [22:19519](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19519) | 09 · Create Result · Unlisted Market Created | 390×844 | /STATES |
| [22:19726](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19726) | 10 · Create Result · Share Success | 390×844 | /STATES |
| [22:19924](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19924) | 11 · Create Result · Closed | 390×844 | /STATES |
| [22:19992](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19992) | 12 · Create Result · Resolved | 390×844 | /STATES |
| [22:20060](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-20060) | 13 · Create Result · Voided | 390×844 | /STATES |
| [22:19303](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19303) | 14 · Create Result · Rejected With Reason | 390×844 | /ERRORS |
| [22:19791](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-19791) | 15 · Create Result · Share Failed | 390×844 | /ERRORS |

### 12 — NOTIFICATIONS · [12:14](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-14)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:25630](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-25630) | 01 · Notifications · Default | 390×844 | /CORE |
| [22:25701](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-25701) | 02 · Notifications · Unread | 390×844 | /CORE |
| [22:25762](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-25762) | 03 · Notifications · Read | 390×844 | /CORE |
| [22:25872](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-25872) | 04 · Notifications · Detail | 390×844 | /CORE |
| [22:26192](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26192) | 05 · Notifications · Market Closing Soon | 390×844 | /CORE |
| [22:26576](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26576) | 06 · Notifications · Admin Moderation | 390×844 | /CORE |
| [22:25821](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-25821) | 07 · Notifications · Empty | 390×844 | /STATES |
| [22:25936](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-25936) | 08 · Notifications · Partial Fill | 390×844 | /STATES |
| [22:26000](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26000) | 09 · Notifications · Full Fill | 390×844 | /STATES |
| [22:26064](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26064) | 10 · Notifications · Order Cancelled | 390×844 | /STATES |
| [22:26128](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26128) | 11 · Notifications · Refund | 390×844 | /STATES |
| [22:26256](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26256) | 12 · Notifications · Market Closed | 390×844 | /STATES |
| [22:26320](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26320) | 13 · Notifications · Market Resolved | 390×844 | /STATES |
| [22:26384](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26384) | 14 · Notifications · Payout | 390×844 | /STATES |
| [22:26448](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26448) | 15 · Notifications · Created Market Approved | 390×844 | /STATES |
| [22:26512](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26512) | 16 · Notifications · Created Market Rejected | 390×844 | /STATES |
| [22:26640](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26640) | 17 · Notifications · Preferences FUTURE | 390×844 | /FUTURE |
| [22:26704](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26704) | 18 · Notifications · OS Permissions FUTURE | 390×844 | /FUTURE |

### 13 — PROFILE · [12:15](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-15)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:26777](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26777) | 01 · Profile · Own | 390×844 | /CORE |
| [22:26849](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26849) | 02 · Profile · Public Creator | 390×844 | /CORE |
| [22:26888](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26888) | 03 · Profile · Creator Markets | 390×844 | /CORE |
| [22:26915](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26915) | 04 · Profile · Creator Statistics | 390×844 | /CORE |
| [22:26946](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-26946) | 05 · Profile · Settings | 390×844 | /CORE |
| [22:27012](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27012) | 06 · Profile · My Markets Shortcut | 390×844 | /CORE |
| [22:27148](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27148) | 08 · Profile · History Shortcut | 390×844 | /CORE |
| [22:27216](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27216) | 09 · Profile · Help | 390×844 | /CORE |
| [22:27284](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27284) | 10 · Profile · Admin Shortcut | 390×844 | /CORE |
| [22:27352](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27352) | 11 · Profile · Guest | 390×844 | /CORE |
| [22:27080](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27080) | 07 · Profile · Wallet Shortcut · FUTURE SHELL | 390×844 | /FUTURE · WALLET SHELL |

### 14 — MY MARKETS · [12:16](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-16)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:27414](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27414) | 01 · My Markets · All | 390×844 | /CORE |
| [22:27560](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27560) | 02 · My Markets · Open | 390×844 | /CORE |
| [22:28022](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-28022) | 03 · My Markets · Management Detail | 390×844 | /CORE |
| [22:27493](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27493) | 04 · My Markets · Pending | 390×844 | /STATES |
| [22:27633](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27633) | 05 · My Markets · Closed | 390×844 | /STATES |
| [22:27706](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27706) | 06 · My Markets · Awaiting Resolution | 390×844 | /STATES |
| [22:27767](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27767) | 07 · My Markets · Resolved | 390×844 | /STATES |
| [22:27834](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27834) | 08 · My Markets · Rejected | 390×844 | /STATES |
| [22:27895](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27895) | 09 · My Markets · Voided | 390×844 | /STATES |
| [22:27962](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-27962) | 10 · My Markets · Empty | 390×844 | /STATES |

### 15 — WALLET · [12:17](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-17)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:29235](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29235) | 01 · Wallet · Overview | 390×844 | /FUTURE |
| [22:29261](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29261) | 02 · Wallet · Deposit | 390×844 | /FUTURE |
| [22:29285](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29285) | 03 · Wallet · Withdraw | 390×844 | /FUTURE |
| [22:29309](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29309) | 04 · Wallet · Not Connected | 390×844 | /FUTURE |
| [22:29327](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29327) | 05 · Wallet · Unavailable | 390×844 | /FUTURE |
| [22:29349](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29349) | 06 · Wallet · Limited Functionality | 390×844 | /FUTURE |
| [22:29373](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29373) | 07 · Wallet · Future Transaction | 390×844 | /FUTURE |

### 16 — HELP / INFO · [12:18](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-18)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:29409](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29409) | 01 · Help · Home | 390×844 | /CORE |
| [22:29429](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29429) | 02 · Help · How P2P Works | 390×844 | /CORE |
| [22:29454](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29454) | 03 · Help · Order Book | 390×844 | /CORE |
| [22:29474](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29474) | 04 · Help · Quick Trade vs Own Price | 390×844 | /CORE |
| [22:29513](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29513) | 05 · Help · Fee Model | 390×844 | /CORE |
| [22:29536](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29536) | 06 · Help · How Resolution Works | 390×844 | /CORE |
| [22:29558](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29558) | 07 · Help · Unlisted Markets | 390×844 | /CORE |
| [22:29581](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29581) | 08 · Help · Cancel or Void | 390×844 | /CORE |
| [22:29600](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29600) | 09 · Help · FAQ | 390×844 | /CORE |
| [22:29619](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29619) | 10 · Help · Rules | 390×844 | /CORE |
| [22:29641](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29641) | 11 · Help · About BetTON | 390×844 | /CORE |
| [22:29493](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29493) | 12 · Help · Partial Fills | 390×844 | /STATES |
| [22:29661](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29661) | 13 · Help · Terms FUTURE | 390×844 | /FUTURE |
| [22:29684](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-29684) | 14 · Help · Privacy FUTURE | 390×844 | /FUTURE |

### 17 — MODERATION / ADMIN · [12:19](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-19)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:30639](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30639) | 01 · Moderation · Queue | 390×844 | /CORE |
| [22:30678](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30678) | 02 · Moderation · Market Review | 390×844 | /CORE |
| [22:30699](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30699) | 03 · Moderation · Criteria Review | 390×844 | /CORE |
| [22:30719](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30719) | 04 · Moderation · Source Review | 390×844 | /CORE |
| [22:30739](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30739) | 05 · Moderation · Approve | 390×844 | /CORE |
| [22:30761](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30761) | 06 · Moderation · Approve Confirmation | 390×844 | /CORE |
| [22:30782](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30782) | 07 · Moderation · Reject | 390×844 | /CORE |
| [22:30804](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30804) | 08 · Moderation · Reject Reason | 390×844 | /CORE |
| [22:30827](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30827) | 09 · Moderation · Close | 390×844 | /CORE |
| [22:30848](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30848) | 10 · Moderation · Close Confirmation | 390×844 | /CORE |
| [22:30869](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30869) | 11 · Moderation · Void | 390×844 | /CORE |
| [22:30890](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30890) | 12 · Moderation · Void Reason | 390×844 | /CORE |
| [22:30912](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30912) | 13 · Moderation · Select Outcome | 390×844 | /CORE |
| [22:30932](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30932) | 14 · Moderation · Settlement Preview | 390×844 | /CORE |
| [22:30955](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30955) | 15 · Moderation · Settlement Confirmation | 390×844 | /CORE |
| [22:30659](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30659) | 16 · Moderation · Empty Queue | 390×844 | /STATES |
| [22:30977](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30977) | 17 · Moderation · Processing | 390×844 | /STATES |
| [22:30996](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-30996) | 18 · Moderation · Success | 390×844 | /STATES |
| [22:31017](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31017) | 19 · Moderation · Failure | 390×844 | /ERRORS |
| [22:31039](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31039) | 20 · Moderation · Conflict Stale Data | 390×844 | /ERRORS |
| [22:31058](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31058) | 21 · Moderation · Forbidden | 390×844 | /ERRORS |
| [414:3](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-3) | Модерация / review | 390×844 |  |
| [414:36](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-36) | Модерация / edit | 390×844 |  |
| [414:69](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-69) | Модерация / compare | 390×844 |  |
| [414:102](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-102) | Модерация / approve | 390×844 |  |
| [414:135](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-135) | Модерация / published | 390×844 |  |
| [414:168](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-168) | Модерация / reject | 390×844 |  |
| [414:201](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-201) | Модерация / rejected | 390×844 |  |
| [414:234](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=414-234) | Модерация / creatorNotice | 390×844 |  |
| [415:820](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-820) | Модерация / approveOriginal | 390×844 |  |
| [415:847](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-847) | Модерация / creatorChanges | 390×844 |  |
| [415:876](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-876) | Модерация / creatorOriginal | 390×844 |  |
| [415:916](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-916) | Модерация / rejectError | 390×844 |  |

### 18 — SYSTEM STATES · [12:20](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-20)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:31102](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31102) | 01 · System · Skeleton | 390×844 | /CORE |
| [22:31137](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31137) | 02 · System · Offline | 390×844 | /CORE |
| [22:31171](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31171) | 03 · System · Retry | 390×844 | /CORE |
| [22:31190](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31190) | 04 · System · Auth Required | 390×844 | /CORE |
| [22:31207](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31207) | 05 · System · Auth Expired | 390×844 | /CORE |
| [22:31241](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31241) | 06 · System · 404 | 390×844 | /CORE |
| [22:31310](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31310) | 07 · System · Maintenance | 390×844 | /CORE |
| [22:31344](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31344) | 08 · System · Stale Quote | 390×844 | /CORE |
| [22:31418](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31418) | 09 · System · Destructive Confirmation | 390×844 | /CORE |
| [22:31475](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31475) | 10 · System · Bottom Sheet | 390×844 | /CORE |
| [22:31496](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31496) | 11 · System · Modal | 390×844 | /CORE |
| [22:31086](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31086) | 12 · System · Initial Loading | 390×844 | /STATES |
| [22:31120](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31120) | 13 · System · Empty | 390×844 | /STATES |
| [22:31326](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31326) | 14 · System · Backend Processing | 390×844 | /STATES |
| [22:31382](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31382) | 15 · System · Generic Success | 390×844 | /STATES |
| [22:31441](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31441) | 16 · System · Toast Success | 390×844 | /STATES |
| [22:31154](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31154) | 17 · System · Network Error | 390×844 | /ERRORS |
| [22:31224](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31224) | 18 · System · Forbidden | 390×844 | /ERRORS |
| [22:31259](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31259) | 19 · System · Market Not Found | 390×844 | /ERRORS |
| [22:31276](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31276) | 20 · System · Invalid Share Token | 390×844 | /ERRORS |
| [22:31293](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31293) | 21 · System · Unavailable Unlisted Link | 390×844 | /ERRORS |
| [22:31363](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31363) | 22 · System · Insufficient Balance | 390×844 | /ERRORS |
| [22:31400](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31400) | 23 · System · Generic Error | 390×844 | /ERRORS |
| [22:31458](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31458) | 24 · System · Toast Error | 390×844 | /ERRORS |

### 19 — FUTURE / EXPERIMENTS · [12:21](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-21)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:31527](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31527) | 01 · Future · Saved Watchlist | 390×844 | /FUTURE |
| [22:31563](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31563) | 02 · Future · Recently Viewed | 390×844 | /FUTURE |
| [22:31598](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31598) | 03 · Future · Trending | 390×844 | /FUTURE |
| [22:31634](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31634) | 04 · Future · Recently Resolved | 390×844 | /FUTURE |
| [22:31670](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31670) | 05 · Future · Related Markets | 390×844 | /FUTURE |
| [22:31706](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31706) | 06 · Future · Advanced Market Statistics | 390×844 | /FUTURE |
| [22:31742](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31742) | 07 · Future · Creator Analytics | 390×844 | /FUTURE |
| [22:31778](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31778) | 08 · Future · Creator Activity | 390×844 | /FUTURE |
| [22:31814](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31814) | 09 · Future · Advanced Trade Odds History | 390×844 | /FUTURE |
| [22:31850](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31850) | 10 · Future · Evidence Viewer | 390×844 | /FUTURE |
| [22:31868](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31868) | 11 · Future · Resolution Evidence | 390×844 | /FUTURE |
| [22:31886](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31886) | 12 · Future · Order Execution Breakdown | 390×844 | /FUTURE |
| [22:31904](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31904) | 13 · Future · Money Movement Detail | 390×844 | /FUTURE |
| [22:31922](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31922) | 14 · Future · Notification Preferences | 390×844 | /FUTURE |
| [22:31940](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31940) | 15 · Future · Report Market | 390×844 | /FUTURE |
| [22:31960](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31960) | 16 · Future · Draft Market | 390×844 | /FUTURE |
| [22:31980](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-31980) | 17 · Future · Edit Draft | 390×844 | /FUTURE |
| [22:32000](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32000) | 18 · Future · Archived Markets | 390×844 | /FUTURE |
| [22:32018](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32018) | 19 · Future · Platform Status | 390×844 | /FUTURE |
| [22:32036](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32036) | 20 · Future · Terms | 390×844 | /FUTURE |
| [22:32054](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32054) | 21 · Future · Privacy | 390×844 | /FUTURE |
| [22:32072](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32072) | 22 · Future · About BetTON | 390×844 | /FUTURE |

### 20 — COLOR DIRECTION C · LIGHT · [12:22](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-22)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [57:2](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=57-2) | Markets · Default Feed | 900×927 | /A / C · ART DIRECTION REVIEW · 10 MATCHED SCREENS |
| [58:172](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=58-172) | Market Detail · Overview | 900×927 | /A / C · ART DIRECTION REVIEW · 10 MATCHED SCREENS |
| [58:286](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=58-286) | Quick Trade · Entry | 900×927 | /A / C · ART DIRECTION REVIEW · 10 MATCHED SCREENS |
| [58:432](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=58-432) | Quick Trade · Confirmation | 900×927 | /A / C · ART DIRECTION REVIEW · 10 MATCHED SCREENS |
| [58:554](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=58-554) | Own Price · Entry | 900×927 | /A / C · ART DIRECTION REVIEW · 10 MATCHED SCREENS |
| [58:706](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=58-706) | Portfolio · Overview | 900×927 | /A / C · ART DIRECTION REVIEW · 10 MATCHED SCREENS |
| [58:849](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=58-849) | Create Market | 900×927 | /A / C · ART DIRECTION REVIEW · 10 MATCHED SCREENS |
| [58:993](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=58-993) | Notifications | 900×927 | /A / C · ART DIRECTION REVIEW · 10 MATCHED SCREENS |
| [58:1152](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=58-1152) | Profile | 900×927 | /A / C · ART DIRECTION REVIEW · 10 MATCHED SCREENS |
| [58:1362](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=58-1362) | My Markets | 900×927 | /A / C · ART DIRECTION REVIEW · 10 MATCHED SCREENS |
| [147:996](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-996) | Dark A · 360 · Markets | 360×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:1090](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-1090) | Dark A · 360 · Detail | 360×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:1149](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-1149) | Dark A · 360 · Quick Trade | 360×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:1222](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-1222) | Dark A · 360 · Order Book | 360×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:1262](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-1262) | Dark A · 360 · Long labels | 360×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:1335](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-1335) | Light C · 360 · Markets | 360×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:1429](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-1429) | Light C · 360 · Detail | 360×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:1488](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-1488) | Light C · 360 · Quick Trade | 360×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:1561](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-1561) | Light C · 360 · Order Book | 360×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:1601](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-1601) | Light C · 360 · Long labels | 360×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:1674](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-1674) | Dark A · 390 · Markets | 390×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:1768](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-1768) | Dark A · 390 · Detail | 390×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:1827](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-1827) | Dark A · 390 · Quick Trade | 390×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:1900](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-1900) | Dark A · 390 · Order Book | 390×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:1940](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-1940) | Dark A · 390 · Long labels | 390×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:2013](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-2013) | Light C · 390 · Markets | 390×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:2107](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-2107) | Light C · 390 · Detail | 390×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:2166](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-2166) | Light C · 390 · Quick Trade | 390×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:2239](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-2239) | Light C · 390 · Order Book | 390×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:2279](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-2279) | Light C · 390 · Long labels | 390×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:2352](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-2352) | Dark A · 430 · Markets | 430×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:2446](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-2446) | Dark A · 430 · Detail | 430×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:2505](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-2505) | Dark A · 430 · Quick Trade | 430×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:2578](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-2578) | Dark A · 430 · Order Book | 430×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:2618](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-2618) | Dark A · 430 · Long labels | 430×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:2691](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-2691) | Light C · 430 · Markets | 430×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:2785](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-2785) | Light C · 430 · Detail | 430×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:2844](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-2844) | Light C · 430 · Quick Trade | 430×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:2917](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-2917) | Light C · 430 · Order Book | 430×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [147:2957](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=147-2957) | Light C · 430 · Long labels | 430×844 | /ODDS-FIRST · RESPONSIVE QA · 360 / 390 / 430 |
| [181:2470](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=181-2470) | PILOT · Market Detail · Dima/Vasya · Dark A | 390×884 | /PILOT · THEME REVIEW · READY |
| [181:2471](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=181-2471) | PILOT · Market Detail · Dima/Vasya · Light C | 390×884 | /PILOT · THEME REVIEW · READY |
| [181:2521](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=181-2521) | PILOT · Quick Trade · Dima · Dark A | 390×884 | /PILOT · THEME REVIEW · READY |
| [181:2522](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=181-2522) | PILOT · Quick Trade · Dima · Light C | 390×884 | /PILOT · THEME REVIEW · READY |
| [181:2552](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=181-2552) | PILOT · Market Detail · long title · Dark A | 390×884 | /PILOT · THEME REVIEW · READY |
| [181:2553](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=181-2553) | PILOT · Market Detail · long title · Light C | 390×884 | /PILOT · THEME REVIEW · READY |

### 21 — PROTOTYPE · MAIN USER · [12:23](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-23)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:32137](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32137) | 01 · Entry · Final CTA | 390×844 | /FLOW 01 · Onboarding → Trade → Portfolio |
| [22:32156](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32156) | 02 · Markets · Default Feed | 390×844 | /FLOW 01 · Onboarding → Trade → Portfolio |
| [22:32220](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32220) | 03 · Market Detail · Overview | 390×844 | /FLOW 01 · Onboarding → Trade → Portfolio |
| [22:32273](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32273) | 04 · Quick Trade · Entry | 390×844 | /FLOW 01 · Onboarding → Trade → Portfolio |
| [22:32316](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32316) | 05 · Quick Trade · Confirmation | 390×844 | /FLOW 01 · Onboarding → Trade → Portfolio |
| [22:32349](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32349) | 06 · Quick Trade · Success | 390×844 | /FLOW 01 · Onboarding → Trade → Portfolio |
| [22:32379](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32379) | 07 · Portfolio · Overview | 390×844 | /FLOW 01 · Onboarding → Trade → Portfolio |
| [22:32410](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32410) | 01 · Market Detail · Overview | 390×844 | /FLOW 02 · Detail → Own Price → Open Orders |
| [22:32463](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32463) | 02 · Own Price · Entry | 390×844 | /FLOW 02 · Detail → Own Price → Open Orders |
| [22:32506](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32506) | 03 · Own Price · Order Preview | 390×844 | /FLOW 02 · Detail → Own Price → Open Orders |
| [22:32542](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32542) | 04 · Own Price · Placed | 390×844 | /FLOW 02 · Detail → Own Price → Open Orders |
| [22:32572](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32572) | 05 · Portfolio · Open Orders | 390×844 | /FLOW 02 · Detail → Own Price → Open Orders |
| [22:32589](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32589) | 06 · Portfolio · Order Detail | 390×844 | /FLOW 02 · Detail → Own Price → Open Orders |
| [22:32618](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32618) | АРХИВ · прежняя форма / 01 · Create Market · Start | 390×844 | /FLOW 03 · Create → Pending |
| [22:32655](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32655) | АРХИВ · прежняя форма / 02 · Create Market · Question | 390×844 | /FLOW 03 · Create → Pending |
| [22:32693](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32693) | АРХИВ · прежняя форма / 03 · Create Market · Resolution Criteria | 390×844 | /FLOW 03 · Create → Pending |
| [22:32735](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32735) | АРХИВ · прежняя форма / 04 · Create Market · Primary Source | 390×844 | /FLOW 03 · Create → Pending |
| [22:32773](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32773) | АРХИВ · прежняя форма / 05 · Create Market · Category | 390×844 | /FLOW 03 · Create → Pending |
| [22:32814](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32814) | АРХИВ · прежняя форма / 06 · Create Market · Close Time | 390×844 | /FLOW 03 · Create → Pending |
| [22:32852](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32852) | АРХИВ · прежняя форма / 07 · Create Market · Public or Unlisted | 390×844 | /FLOW 03 · Create → Pending |
| [22:32895](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32895) | АРХИВ · прежняя форма / 08 · Create Market · Review | 390×844 | /FLOW 03 · Create → Pending |
| [22:32938](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32938) | АРХИВ · прежняя форма / 09 · Create Market · Processing | 390×844 | /FLOW 03 · Create → Pending |
| [22:32970](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-32970) | АРХИВ · прежняя форма / 10 · Create Market · Pending Moderation | 390×844 | /FLOW 03 · Create → Pending |
| [74:1600](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1600) | АРХИВ · прежняя форма / 03 · Create Market · Description | 390×844 | /FLOW 03 · Create → Pending |
| [74:1637](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1637) | АРХИВ · прежняя форма / 06 · Create Market · Additional Source | 390×844 | /FLOW 03 · Create → Pending |
| [74:1678](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1678) | АРХИВ · прежняя форма / 08 · Create Market · Close Date | 390×844 | /FLOW 03 · Create → Pending |
| [74:1715](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1715) | АРХИВ · прежняя форма / 12 · Create Market · Submit Confirmation | 390×844 | /FLOW 03 · Create → Pending |
| [22:33005](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33005) | 01 · Markets · Default Feed | 390×844 | /FLOW 04 · Bottom Navigation Destinations |
| [22:33069](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33069) | 02 · Portfolio · Overview | 390×844 | /FLOW 04 · Bottom Navigation Destinations |
| [22:33099](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33099) | АРХИВ · прежняя форма / 03 · Create Market · Start | 390×844 | /FLOW 04 · Bottom Navigation Destinations |
| [22:33136](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33136) | 04 · Notifications · Default | 390×844 | /FLOW 04 · Bottom Navigation Destinations |
| [22:33174](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33174) | 05 · Profile · Own | 390×844 | /FLOW 04 · Bottom Navigation Destinations |
| [74:902](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-902) | 02 · Entry · Welcome | 390×844 | /FLOW 00 · Onboarding |
| [74:922](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-922) | 03 · Entry · P2P Intro | 390×844 | /FLOW 00 · Onboarding |
| [74:944](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-944) | 04 · Entry · How Markets Work | 390×844 | /FLOW 00 · Onboarding |
| [74:964](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-964) | 05 · Entry · Quick Trade vs Own Price | 390×844 | /FLOW 00 · Onboarding |
| [74:982](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-982) | 06 · Entry · Fee Explanation | 390×844 | /FLOW 00 · Onboarding |
| [74:1006](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1006) | 01 · My Markets · All | 390×844 | /FLOW 05 · Profile destinations |
| [74:1045](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1045) | 01 · Wallet · Overview | 390×844 | /FLOW 05 · Profile destinations |
| [74:1071](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1071) | 01 · Activity · All | 390×844 | /FLOW 05 · Profile destinations |
| [74:1096](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1096) | 01 · Help · Home | 390×844 | /FLOW 05 · Profile destinations |
| [74:1116](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1116) | 05 · Profile · Settings | 390×844 | /FLOW 05 · Profile destinations |
| [74:1148](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1148) | 10 · Profile · Admin Shortcut | 390×844 | /FLOW 05 · Profile destinations |
| [74:1183](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1183) | Quick Trade · NO · Entry | 390×844 | /FLOW 06 · Trade branches & cancellation |
| [74:1218](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1218) | Quick Trade · NO · Confirmation | 390×844 | /FLOW 06 · Trade branches & cancellation |
| [74:1248](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1248) | Quick Trade · NO · Success | 390×844 | /FLOW 06 · Trade branches & cancellation |
| [74:1277](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1277) | 08 · Own Price · Confirmation | 390×844 | /FLOW 06 · Trade branches & cancellation |
| [74:1309](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1309) | 08 · Portfolio · Cancel Order | 390×844 | /FLOW 06 · Trade branches & cancellation |
| [74:1330](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1330) | 10 · Portfolio · Cancelled Orders | 390×844 | /FLOW 06 · Trade branches & cancellation |
| [74:1346](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1346) | 08 · Market Detail · Share | 390×844 | /FLOW 07 · Market detail destinations |
| [74:1368](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1368) | 05 · Market Detail · Criteria | 390×844 | /FLOW 07 · Market detail destinations |
| [74:1390](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1390) | 06 · Market Detail · Sources | 390×844 | /FLOW 07 · Market detail destinations |
| [74:1412](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1412) | 02 · Market Detail · Full Order Book | 390×844 | /FLOW 07 · Market detail destinations |
| [74:1443](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1443) | 03 · Market Detail · Recent Trades | 390×844 | /FLOW 07 · Market detail destinations |
| [74:1477](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1477) | 02 · Markets · Search | 390×844 | /FLOW 08 · Supporting destinations |
| [74:1494](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1494) | 04 · Markets · Filters | 390×844 | /FLOW 08 · Supporting destinations |
| [74:1521](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1521) | 04 · Notifications · Detail | 390×844 | /FLOW 08 · Supporting destinations |
| [74:1551](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1551) | 03 · Portfolio · Position Detail | 390×844 | /FLOW 08 · Supporting destinations |
| [74:1577](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=74-1577) | 05 · Help · Fee Model | 390×844 | /FLOW 08 · Supporting destinations |
| [135:7740](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7740) | DIMA · Outcome 1 · detail | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7741](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7741) | DIMA · Outcome 1 · quick | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7742](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7742) | DIMA · Outcome 1 · own | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7743](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7743) | DIMA · Outcome 1 · book | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7744](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7744) | DIMA · Outcome 1 · portfolio | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7745](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7745) | DIMA · Outcome 1 · orders | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7746](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7746) | DIMA · Outcome 2 · detail | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7747](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7747) | DIMA · Outcome 2 · quick | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7748](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7748) | DIMA · Outcome 2 · own | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7749](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7749) | DIMA · Outcome 2 · book | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7750](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7750) | DIMA · Outcome 2 · portfolio | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7751](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7751) | DIMA · Outcome 2 · orders | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7752](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7752) | SPORT · Outcome 1 · detail | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7753](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7753) | SPORT · Outcome 1 · quick | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7754](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7754) | SPORT · Outcome 1 · own | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7755](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7755) | SPORT · Outcome 1 · book | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7756](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7756) | SPORT · Outcome 1 · portfolio | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7757](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7757) | SPORT · Outcome 1 · orders | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7758](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7758) | SPORT · Outcome 2 · detail | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7759](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7759) | SPORT · Outcome 2 · quick | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7760](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7760) | SPORT · Outcome 2 · own | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7761](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7761) | SPORT · Outcome 2 · book | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7762](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7762) | SPORT · Outcome 2 · portfolio | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7763](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7763) | SPORT · Outcome 2 · orders | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7764](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7764) | TON · Outcome 2 · detail | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7765](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7765) | TON · Outcome 2 · book | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [135:7766](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=135-7766) | TON · Outcome 2 · own | 390×844 | /ODDS-FIRST · OUTCOME LABEL FLOWS |
| [386:2800](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=386-2800) | Мои ставки / Завершённые | 390×844 |  |
| [387:9840](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=387-9840) | Мои ставки / Активные | 390×844 |  |

### 22 — PROTOTYPE · ADMIN · [12:24](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-24)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:33278](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33278) | 01 · Profile · Own | 390×844 | /FLOW · ADMIN · Review / Approve or Reject / Settlement |
| [22:33317](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33317) | 02 · Profile · Admin Shortcut | 390×844 | /FLOW · ADMIN · Review / Approve or Reject / Settlement |
| [22:33352](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33352) | 03 · Moderation · Queue | 390×844 | /FLOW · ADMIN · Review / Approve or Reject / Settlement |
| [22:33373](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33373) | 04 · Moderation · Market Review | 390×844 | /FLOW · ADMIN · Review / Approve or Reject / Settlement |
| [22:33395](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33395) | 05 · Moderation · Criteria Review | 390×844 | /FLOW · ADMIN · Review / Approve or Reject / Settlement |
| [22:33416](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33416) | 06 · Moderation · Source Review | 390×844 | /FLOW · ADMIN · Review / Approve or Reject / Settlement |
| [22:33437](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33437) | 07 · Moderation · Approve Confirmation | 390×844 | /FLOW · ADMIN · Review / Approve or Reject / Settlement |
| [22:33459](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33459) | 08 · Moderation · Reject Reason | 390×844 | /FLOW · ADMIN · Review / Approve or Reject / Settlement |
| [22:33483](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33483) | 09 · Moderation · Select Outcome | 390×844 | /FLOW · ADMIN · Review / Approve or Reject / Settlement |
| [22:33504](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33504) | 10 · Moderation · Settlement Preview | 390×844 | /FLOW · ADMIN · Review / Approve or Reject / Settlement |
| [22:33528](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33528) | 11 · Moderation · Settlement Confirmation | 390×844 | /FLOW · ADMIN · Review / Approve or Reject / Settlement |
| [22:33551](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33551) | 12 · Moderation · Success | 390×844 | /FLOW · ADMIN · Review / Approve or Reject / Settlement |
| [79:76](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=79-76) | Moderation · approved · Result | 390×844 | /FLOW · ADMIN · Review / Approve or Reject / Settlement |
| [79:153](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=79-153) | Moderation · rejected · Result | 390×844 | /FLOW · ADMIN · Review / Approve or Reject / Settlement |

### 23 — PROTOTYPE · FUTURE · [12:25](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-25)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [22:33628](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33628) | 01 · Future · Saved Watchlist | 390×844 | /FUTURE · Concept gallery · not Current |
| [22:33648](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33648) | 02 · Future · Advanced Market Statistics | 390×844 | /FUTURE · Concept gallery · not Current |
| [22:33668](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33668) | 03 · Future · Creator Analytics | 390×844 | /FUTURE · Concept gallery · not Current |
| [22:33688](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33688) | 04 · Future · Advanced Trade Odds History | 390×844 | /FUTURE · Concept gallery · not Current |
| [22:33708](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33708) | 05 · Future · Evidence Viewer | 390×844 | /FUTURE · Concept gallery · not Current |
| [22:33727](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33727) | 06 · Future · Notification Preferences | 390×844 | /FUTURE · Concept gallery · not Current |
| [22:33746](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33746) | 07 · Future · Report Market | 390×844 | /FUTURE · Concept gallery · not Current |
| [22:33767](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-33767) | 08 · Future · Draft Market | 390×844 | /FUTURE · Concept gallery · not Current |

### 22 — HANDOFF · LIGHT C QA · [227:42363](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42363)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [227:42371](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42371) | LIGHT C · 01 · Entry · Splash | 390×844 | /03 — ENTRY / ONBOARDING · LIGHT C |
| [227:42385](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42385) | LIGHT C · 02 · Entry · Welcome | 390×844 | /03 — ENTRY / ONBOARDING · LIGHT C |
| [227:42402](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42402) | LIGHT C · 03 · Entry · P2P Intro | 390×844 | /03 — ENTRY / ONBOARDING · LIGHT C |
| [227:42421](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42421) | LIGHT C · 04 · Entry · How Markets Work | 390×844 | /03 — ENTRY / ONBOARDING · LIGHT C |
| [227:42438](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42438) | LIGHT C · 05 · Entry · Quick Trade vs Own Price | 390×844 | /03 — ENTRY / ONBOARDING · LIGHT C |
| [227:42453](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42453) | LIGHT C · 06 · Entry · Fee Explanation | 390×844 | /03 — ENTRY / ONBOARDING · LIGHT C |
| [227:42473](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42473) | LIGHT C · 07 · Entry · Final CTA | 390×844 | /03 — ENTRY / ONBOARDING · LIGHT C |
| [227:42488](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42488) | LIGHT C · 08 · Entry · Auth Required | 390×844 | /03 — ENTRY / ONBOARDING · LIGHT C |
| [227:42505](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42505) | LIGHT C · 09 · Entry · Initial Loading | 390×844 | /03 — ENTRY / ONBOARDING · LIGHT C |
| [227:42522](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42522) | LIGHT C · 10 · Entry · Telegram Auth Failure | 390×844 | /03 — ENTRY / ONBOARDING · LIGHT C |
| [227:42540](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42540) | LIGHT C · 01 · Markets · Default Feed | 390×844 | /04 — MARKETS · LIGHT C |
| [227:42557](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42557) | LIGHT C · 02 · Markets · Search | 390×844 | /04 — MARKETS · LIGHT C |
| [227:42571](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42571) | LIGHT C · 03 · Markets · Search Results | 390×844 | /04 — MARKETS · LIGHT C |
| [227:42591](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42591) | LIGHT C · 04 · Markets · Filters | 390×844 | /04 — MARKETS · LIGHT C |
| [227:42615](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42615) | LIGHT C · 05 · Markets · Category | 390×844 | /04 — MARKETS · LIGHT C |
| [227:42630](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42630) | LIGHT C · 06 · Markets · Popular | 390×844 | /04 — MARKETS · LIGHT C |
| [227:42647](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42647) | LIGHT C · 07 · Markets · New | 390×844 | /04 — MARKETS · LIGHT C |
| [227:42664](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42664) | LIGHT C · 08 · Markets · Closing Soon | 390×844 | /04 — MARKETS · LIGHT C |
| [227:42679](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42679) | LIGHT C · 09 · Markets · Available Offers | 390×844 | /04 — MARKETS · LIGHT C |
| [227:42696](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42696) | LIGHT C · 10 · Markets · Empty Search | 390×844 | /04 — MARKETS · LIGHT C |
| [227:42714](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42714) | LIGHT C · 11 · Markets · No Offers | 390×844 | /04 — MARKETS · LIGHT C |
| [227:42727](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42727) | LIGHT C · 12 · Markets · Closed Row | 390×844 | /04 — MARKETS · LIGHT C |
| [227:42740](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-42740) | LIGHT C · 13 · Markets · Resolved Row | 390×844 | /04 — MARKETS · LIGHT C |
| [227:43305](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43305) | LIGHT C · 01 · Market Detail · Overview | 390×844 | /05 — MARKET DETAIL · LIGHT C |
| [227:43329](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43329) | LIGHT C · 02 · Market Detail · Full Order Book | 390×844 | /05 — MARKET DETAIL · LIGHT C |
| [227:43344](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43344) | LIGHT C · 03 · Market Detail · Recent Trades | 390×844 | /05 — MARKET DETAIL · LIGHT C |
| [227:43352](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43352) | LIGHT C · 04 · Market Detail · Trade Odds History | 390×844 | /05 — MARKET DETAIL · LIGHT C |
| [227:43360](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43360) | LIGHT C · 05 · Market Detail · Criteria | 390×844 | /05 — MARKET DETAIL · LIGHT C |
| [227:43379](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43379) | LIGHT C · 06 · Market Detail · Sources | 390×844 | /05 — MARKET DETAIL · LIGHT C |
| [227:43398](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43398) | LIGHT C · 07 · Market Detail · Resolution Source | 390×844 | /05 — MARKET DETAIL · LIGHT C |
| [227:43417](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43417) | LIGHT C · 08 · Market Detail · Share | 390×844 | /05 — MARKET DETAIL · LIGHT C |
| [227:43436](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43436) | LIGHT C · 09 · Market Detail · Unlisted Access | 390×844 | /05 — MARKET DETAIL · LIGHT C |
| [227:43455](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43455) | LIGHT C · 11 · Market Detail · No Offers | 390×844 | /05 — MARKET DETAIL · LIGHT C |
| [227:43474](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43474) | LIGHT C · 12 · Market Detail · Closed | 390×844 | /05 — MARKET DETAIL · LIGHT C |
| [227:43493](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43493) | LIGHT C · 13 · Market Detail · Awaiting Resolution | 390×844 | /05 — MARKET DETAIL · LIGHT C |
| [227:43512](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43512) | LIGHT C · 14 · Market Detail · Resolved Outcome 1 | 390×844 | /05 — MARKET DETAIL · LIGHT C |
| [227:43531](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43531) | LIGHT C · 15 · Market Detail · Resolved Outcome 2 | 390×844 | /05 — MARKET DETAIL · LIGHT C |
| [227:43550](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43550) | LIGHT C · 16 · Market Detail · Voided | 390×844 | /05 — MARKET DETAIL · LIGHT C |
| [227:43569](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43569) | LIGHT C · 17 · Market Detail · Not Found | 390×844 | /05 — MARKET DETAIL · LIGHT C |
| [227:43660](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43660) | LIGHT C · 01 · Quick Trade · Entry | 390×844 | /06 — QUICK TRADE · LIGHT C |
| [227:43674](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43674) | LIGHT C · 02 · Quick Trade · Select Outcome 1 | 390×844 | /06 — QUICK TRADE · LIGHT C |
| [227:43688](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43688) | LIGHT C · 03 · Quick Trade · Select Outcome 2 | 390×844 | /06 — QUICK TRADE · LIGHT C |
| [227:43703](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43703) | LIGHT C · 04 · Quick Trade · Amount Input | 390×844 | /06 — QUICK TRADE · LIGHT C |
| [227:43717](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43717) | LIGHT C · 05 · Quick Trade · Execution Preview | 390×844 | /06 — QUICK TRADE · LIGHT C |
| [227:43731](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43731) | LIGHT C · 06 · Quick Trade · Confirmation | 390×844 | /06 — QUICK TRADE · LIGHT C |
| [227:43746](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43746) | LIGHT C · 07 · Quick Trade · Partial Fill Preview | 390×844 | /06 — QUICK TRADE · LIGHT C |
| [227:43778](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43778) | LIGHT C · 08 · Quick Trade · Quote Changed | 390×844 | /06 — QUICK TRADE · LIGHT C |
| [227:43807](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43807) | LIGHT C · 09 · Quick Trade · No Offers | 390×844 | /06 — QUICK TRADE · LIGHT C |
| [227:43833](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43833) | LIGHT C · 10 · Quick Trade · Processing | 390×844 | /06 — QUICK TRADE · LIGHT C |
| [227:43858](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43858) | LIGHT C · 11 · Quick Trade · Full Fill | 390×844 | /06 — QUICK TRADE · LIGHT C |
| [227:43884](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43884) | LIGHT C · 12 · Quick Trade · Partial Fill | 390×844 | /06 — QUICK TRADE · LIGHT C |
| [227:43913](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43913) | LIGHT C · 13 · Quick Trade · Success | 390×844 | /06 — QUICK TRADE · LIGHT C |
| [227:43939](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43939) | LIGHT C · 14 · Quick Trade · Position Created | 390×844 | /06 — QUICK TRADE · LIGHT C |
| [227:43965](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43965) | LIGHT C · 15 · Quick Trade · Insufficient Balance | 390×844 | /06 — QUICK TRADE · LIGHT C |
| [227:43991](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-43991) | LIGHT C · 16 · Quick Trade · Failed | 390×844 | /06 — QUICK TRADE · LIGHT C |
| [227:44595](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-44595) | LIGHT C · 01 · Own Price · Entry | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:44611](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-44611) | LIGHT C · 02 · Own Price · Select Outcome 1 | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:44627](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-44627) | LIGHT C · 03 · Own Price · Select Outcome 2 | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:44643](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-44643) | LIGHT C · 04 · Own Price · Price Input | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:44659](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-44659) | LIGHT C · 05 · Own Price · Amount Input | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:44675](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-44675) | LIGHT C · 06 · Own Price · Reserve Preview | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:44701](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-44701) | LIGHT C · 07 · Own Price · Order Preview | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:44733](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-44733) | LIGHT C · 08 · Own Price · Confirmation | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:44762](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-44762) | LIGHT C · 09 · Own Price · Order Detail | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:44791](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-44791) | LIGHT C · 10 · Own Price · Cancel Remainder Confirmation | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:44820](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-44820) | LIGHT C · 11 · Own Price · Processing | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:44845](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-44845) | LIGHT C · 12 · Own Price · Placed | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:44871](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-44871) | LIGHT C · 13 · Own Price · Resting Order | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:44897](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-44897) | LIGHT C · 14 · Own Price · Partial Fill | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:44923](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-44923) | LIGHT C · 15 · Own Price · Full Fill | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:44949](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-44949) | LIGHT C · 16 · Own Price · Cancelled | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:44975](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-44975) | LIGHT C · 17 · Own Price · Invalid Price | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:45001](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-45001) | LIGHT C · 18 · Own Price · Invalid Step | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:45027](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-45027) | LIGHT C · 19 · Own Price · Insufficient Reserve | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:45053](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-45053) | LIGHT C · 20 · Own Price · Submission Error | 390×844 | /07 — OWN PRICE · LIGHT C |
| [227:45639](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-45639) | LIGHT C · 01 · Portfolio · Overview | 390×844 | /08 — PORTFOLIO · LIGHT C |
| [227:45668](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-45668) | LIGHT C · 02 · Portfolio · Positions | 390×844 | /08 — PORTFOLIO · LIGHT C |
| [227:45684](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-45684) | LIGHT C · 03 · Portfolio · Position Detail | 390×844 | /08 — PORTFOLIO · LIGHT C |
| [227:45707](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-45707) | LIGHT C · 04 · Portfolio · Open Orders | 390×844 | /08 — PORTFOLIO · LIGHT C |
| [227:45720](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-45720) | LIGHT C · 05 · Portfolio · Order Detail | 390×844 | /08 — PORTFOLIO · LIGHT C |
| [227:45744](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-45744) | LIGHT C · 06 · Portfolio · Settled Positions | 390×844 | /08 — PORTFOLIO · LIGHT C |
| [227:45756](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-45756) | LIGHT C · 07 · Portfolio · Creator Income | 390×844 | /08 — PORTFOLIO · LIGHT C |
| [227:45773](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-45773) | LIGHT C · 08 · Portfolio · Cancel Order | 390×844 | /08 — PORTFOLIO · LIGHT C |
| [227:45791](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-45791) | LIGHT C · 09 · Portfolio · Closed Positions | 390×844 | /08 — PORTFOLIO · LIGHT C |
| [227:45803](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-45803) | LIGHT C · 10 · Portfolio · Cancelled Orders | 390×844 | /08 — PORTFOLIO · LIGHT C |
| [227:45815](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-45815) | LIGHT C · 11 · Portfolio · Empty Portfolio | 390×844 | /08 — PORTFOLIO · LIGHT C |
| [227:45825](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-45825) | LIGHT C · 12 · Portfolio · Empty Positions | 390×844 | /08 — PORTFOLIO · LIGHT C |
| [227:45836](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-45836) | LIGHT C · 13 · Portfolio · Empty Orders | 390×844 | /08 — PORTFOLIO · LIGHT C |
| [227:45847](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-45847) | LIGHT C · 14 · Portfolio · Unauthorized | 390×844 | /08 — PORTFOLIO · LIGHT C |
| [227:45858](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-45858) | LIGHT C · 15 · Portfolio · Error | 390×844 | /08 — PORTFOLIO · LIGHT C |
| [227:46253](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46253) | LIGHT C · 01 · Activity · All | 390×844 | /09 — ACTIVITY / HISTORY · LIGHT C |
| [227:46275](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46275) | LIGHT C · 02 · Activity · Trades | 390×844 | /09 — ACTIVITY / HISTORY · LIGHT C |
| [227:46288](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46288) | LIGHT C · 03 · Activity · Orders | 390×844 | /09 — ACTIVITY / HISTORY · LIGHT C |
| [227:46304](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46304) | LIGHT C · 04 · Activity · Settlement | 390×844 | /09 — ACTIVITY / HISTORY · LIGHT C |
| [227:46317](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46317) | LIGHT C · 05 · Activity · Creator Income | 390×844 | /09 — ACTIVITY / HISTORY · LIGHT C |
| [227:46330](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46330) | LIGHT C · 06 · Activity · Detail | 390×844 | /09 — ACTIVITY / HISTORY · LIGHT C |
| [227:46353](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46353) | LIGHT C · 07 · Activity · Payout | 390×844 | /09 — ACTIVITY / HISTORY · LIGHT C |
| [227:46366](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46366) | LIGHT C · 08 · Activity · Refund | 390×844 | /09 — ACTIVITY / HISTORY · LIGHT C |
| [227:46379](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46379) | LIGHT C · 09 · Activity · Cancelled | 390×844 | /09 — ACTIVITY / HISTORY · LIGHT C |
| [227:46392](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46392) | LIGHT C · 10 · Activity · Empty | 390×844 | /09 — ACTIVITY / HISTORY · LIGHT C |
| [227:46683](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46683) | LIGHT C · 01 · Create Market · Start | 390×844 | /10 — CREATE MARKET · LIGHT C |
| [227:46717](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46717) | LIGHT C · 02 · Create Market · Question | 390×844 | /10 — CREATE MARKET · LIGHT C |
| [227:46751](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46751) | LIGHT C · 03 · Create Market · Description | 390×844 | /10 — CREATE MARKET · LIGHT C |
| [227:46785](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46785) | LIGHT C · 04 · Create Market · Resolution Criteria | 390×844 | /10 — CREATE MARKET · LIGHT C |
| [227:46823](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46823) | LIGHT C · 05 · Create Market · Primary Source | 390×844 | /10 — CREATE MARKET · LIGHT C |
| [227:46857](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46857) | LIGHT C · 06 · Create Market · Additional Source | 390×844 | /10 — CREATE MARKET · LIGHT C |
| [227:46895](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46895) | LIGHT C · 07 · Create Market · Category | 390×844 | /10 — CREATE MARKET · LIGHT C |
| [227:46932](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46932) | LIGHT C · 08 · Create Market · Close Date | 390×844 | /10 — CREATE MARKET · LIGHT C |
| [227:46966](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-46966) | LIGHT C · 09 · Create Market · Close Time | 390×844 | /10 — CREATE MARKET · LIGHT C |
| [227:47000](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47000) | LIGHT C · 10 · Create Market · Public or Unlisted | 390×844 | /10 — CREATE MARKET · LIGHT C |
| [227:47039](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47039) | LIGHT C · 11 · Create Market · Review | 390×844 | /10 — CREATE MARKET · LIGHT C |
| [227:47078](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47078) | LIGHT C · 12 · Create Market · Submit Confirmation | 390×844 | /10 — CREATE MARKET · LIGHT C |
| [227:47115](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47115) | LIGHT C · 13 · Create Market · Processing | 390×844 | /10 — CREATE MARKET · LIGHT C |
| [227:47143](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47143) | LIGHT C · 14 · Create Market · Pending Moderation | 390×844 | /10 — CREATE MARKET · LIGHT C |
| [227:47173](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47173) | LIGHT C · 15 · Create Market · Validation Errors | 390×844 | /10 — CREATE MARKET · LIGHT C |
| [227:47585](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47585) | LIGHT C · 01 · Create Result · Edit and Resubmit | 390×844 | /11 — CREATE RESULTS · LIGHT C |
| [227:47621](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47621) | LIGHT C · 02 · Create Result · Share Token | 390×844 | /11 — CREATE RESULTS · LIGHT C |
| [227:47651](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47651) | LIGHT C · 03 · Create Result · Share Link | 390×844 | /11 — CREATE RESULTS · LIGHT C |
| [227:47681](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47681) | LIGHT C · 04 · Create Result · Open Market | 390×844 | /11 — CREATE RESULTS · LIGHT C |
| [227:47711](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47711) | LIGHT C · 05 · Create Result · Pending Moderation | 390×844 | /11 — CREATE RESULTS · LIGHT C |
| [227:47741](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47741) | LIGHT C · 06 · Create Result · Approved | 390×844 | /11 — CREATE RESULTS · LIGHT C |
| [227:47771](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47771) | LIGHT C · 07 · Create Result · Rejected | 390×844 | /11 — CREATE RESULTS · LIGHT C |
| [227:47801](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47801) | LIGHT C · 08 · Create Result · Public Market Created | 390×844 | /11 — CREATE RESULTS · LIGHT C |
| [227:47835](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47835) | LIGHT C · 09 · Create Result · Unlisted Market Created | 390×844 | /11 — CREATE RESULTS · LIGHT C |
| [227:47869](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47869) | LIGHT C · 10 · Create Result · Share Success | 390×844 | /11 — CREATE RESULTS · LIGHT C |
| [227:47896](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47896) | LIGHT C · 11 · Create Result · Closed | 390×844 | /11 — CREATE RESULTS · LIGHT C |
| [227:47926](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47926) | LIGHT C · 12 · Create Result · Resolved | 390×844 | /11 — CREATE RESULTS · LIGHT C |
| [227:47956](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47956) | LIGHT C · 13 · Create Result · Voided | 390×844 | /11 — CREATE RESULTS · LIGHT C |
| [227:47986](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-47986) | LIGHT C · 14 · Create Result · Rejected With Reason | 390×844 | /11 — CREATE RESULTS · LIGHT C |
| [227:48020](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-48020) | LIGHT C · 15 · Create Result · Share Failed | 390×844 | /11 — CREATE RESULTS · LIGHT C |
| [227:48410](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-48410) | LIGHT C · 01 · Notifications · Default | 390×844 | /12 — NOTIFICATIONS · LIGHT C |
| [227:48429](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-48429) | LIGHT C · 02 · Notifications · Unread | 390×844 | /12 — NOTIFICATIONS · LIGHT C |
| [227:48453](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-48453) | LIGHT C · 03 · Notifications · Read | 390×844 | /12 — NOTIFICATIONS · LIGHT C |
| [227:48475](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-48475) | LIGHT C · 04 · Notifications · Detail | 390×844 | /12 — NOTIFICATIONS · LIGHT C |
| [227:48502](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-48502) | LIGHT C · 05 · Notifications · Market Closing Soon | 390×844 | /12 — NOTIFICATIONS · LIGHT C |
| [227:48529](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-48529) | LIGHT C · 06 · Notifications · Admin Moderation | 390×844 | /12 — NOTIFICATIONS · LIGHT C |
| [227:48556](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-48556) | LIGHT C · 07 · Notifications · Empty | 390×844 | /12 — NOTIFICATIONS · LIGHT C |
| [227:48571](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-48571) | LIGHT C · 08 · Notifications · Partial Fill | 390×844 | /12 — NOTIFICATIONS · LIGHT C |
| [227:48598](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-48598) | LIGHT C · 09 · Notifications · Full Fill | 390×844 | /12 — NOTIFICATIONS · LIGHT C |
| [227:48625](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-48625) | LIGHT C · 10 · Notifications · Order Cancelled | 390×844 | /12 — NOTIFICATIONS · LIGHT C |
| [227:48652](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-48652) | LIGHT C · 11 · Notifications · Refund | 390×844 | /12 — NOTIFICATIONS · LIGHT C |
| [227:48679](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-48679) | LIGHT C · 12 · Notifications · Market Closed | 390×844 | /12 — NOTIFICATIONS · LIGHT C |
| [227:48706](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-48706) | LIGHT C · 13 · Notifications · Market Resolved | 390×844 | /12 — NOTIFICATIONS · LIGHT C |
| [227:48733](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-48733) | LIGHT C · 14 · Notifications · Payout | 390×844 | /12 — NOTIFICATIONS · LIGHT C |
| [227:48760](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-48760) | LIGHT C · 15 · Notifications · Created Market Approved | 390×844 | /12 — NOTIFICATIONS · LIGHT C |
| [227:48787](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-48787) | LIGHT C · 16 · Notifications · Created Market Rejected | 390×844 | /12 — NOTIFICATIONS · LIGHT C |
| [227:49212](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-49212) | LIGHT C · 01 · Profile · Own | 390×844 | /13 — PROFILE · LIGHT C |
| [227:49275](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-49275) | LIGHT C · 02 · Profile · Public Creator | 390×844 | /13 — PROFILE · LIGHT C |
| [227:49312](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-49312) | LIGHT C · 03 · Profile · Creator Markets | 390×844 | /13 — PROFILE · LIGHT C |
| [227:49337](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-49337) | LIGHT C · 04 · Profile · Creator Statistics | 390×844 | /13 — PROFILE · LIGHT C |
| [227:49366](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-49366) | LIGHT C · 05 · Profile · Settings | 390×844 | /13 — PROFILE · LIGHT C |
| [227:49396](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-49396) | LIGHT C · 06 · Profile · My Markets Shortcut | 390×844 | /13 — PROFILE · LIGHT C |
| [227:49427](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-49427) | LIGHT C · 08 · Profile · History Shortcut | 390×844 | /13 — PROFILE · LIGHT C |
| [227:49458](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-49458) | LIGHT C · 09 · Profile · Help | 390×844 | /13 — PROFILE · LIGHT C |
| [227:49489](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-49489) | LIGHT C · 10 · Profile · Admin Shortcut | 390×844 | /13 — PROFILE · LIGHT C |
| [227:49520](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-49520) | LIGHT C · 11 · Profile · Guest | 390×844 | /13 — PROFILE · LIGHT C |
| [227:49787](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-49787) | LIGHT C · 01 · My Markets · All | 390×844 | /14 — MY MARKETS · LIGHT C |
| [227:49823](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-49823) | LIGHT C · 02 · My Markets · Open | 390×844 | /14 — MY MARKETS · LIGHT C |
| [227:49853](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-49853) | LIGHT C · 03 · My Markets · Management Detail | 390×844 | /14 — MY MARKETS · LIGHT C |
| [227:49890](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-49890) | LIGHT C · 04 · My Markets · Pending | 390×844 | /14 — MY MARKETS · LIGHT C |
| [227:49914](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-49914) | LIGHT C · 05 · My Markets · Closed | 390×844 | /14 — MY MARKETS · LIGHT C |
| [227:49944](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-49944) | LIGHT C · 06 · My Markets · Awaiting Resolution | 390×844 | /14 — MY MARKETS · LIGHT C |
| [227:49962](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-49962) | LIGHT C · 07 · My Markets · Resolved | 390×844 | /14 — MY MARKETS · LIGHT C |
| [227:49986](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-49986) | LIGHT C · 08 · My Markets · Rejected | 390×844 | /14 — MY MARKETS · LIGHT C |
| [227:50004](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50004) | LIGHT C · 09 · My Markets · Voided | 390×844 | /14 — MY MARKETS · LIGHT C |
| [227:50028](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50028) | LIGHT C · 10 · My Markets · Empty | 390×844 | /14 — MY MARKETS · LIGHT C |
| [227:50333](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50333) | LIGHT C · 01 · Help · Home | 390×844 | /16 — HELP / INFO · LIGHT C |
| [227:50350](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50350) | LIGHT C · 02 · Help · How P2P Works | 390×844 | /16 — HELP / INFO · LIGHT C |
| [227:50372](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50372) | LIGHT C · 03 · Help · Order Book | 390×844 | /16 — HELP / INFO · LIGHT C |
| [227:50389](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50389) | LIGHT C · 04 · Help · Quick Trade vs Own Price | 390×844 | /16 — HELP / INFO · LIGHT C |
| [227:50405](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50405) | LIGHT C · 05 · Help · Fee Model | 390×844 | /16 — HELP / INFO · LIGHT C |
| [227:50425](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50425) | LIGHT C · 06 · Help · How Resolution Works | 390×844 | /16 — HELP / INFO · LIGHT C |
| [227:50444](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50444) | LIGHT C · 07 · Help · Unlisted Markets | 390×844 | /16 — HELP / INFO · LIGHT C |
| [227:50464](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50464) | LIGHT C · 08 · Help · Cancel or Void | 390×844 | /16 — HELP / INFO · LIGHT C |
| [227:50480](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50480) | LIGHT C · 09 · Help · FAQ | 390×844 | /16 — HELP / INFO · LIGHT C |
| [227:50496](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50496) | LIGHT C · 10 · Help · Rules | 390×844 | /16 — HELP / INFO · LIGHT C |
| [227:50515](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50515) | LIGHT C · 11 · Help · About BetTON | 390×844 | /16 — HELP / INFO · LIGHT C |
| [227:50532](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50532) | LIGHT C · 12 · Help · Partial Fills | 390×844 | /16 — HELP / INFO · LIGHT C |
| [227:50552](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50552) | LIGHT C · 01 · Moderation · Queue | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50569](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50569) | LIGHT C · 02 · Moderation · Market Review | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50587](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50587) | LIGHT C · 03 · Moderation · Criteria Review | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50604](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50604) | LIGHT C · 04 · Moderation · Source Review | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50621](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50621) | LIGHT C · 05 · Moderation · Approve | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50640](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50640) | LIGHT C · 06 · Moderation · Approve Confirmation | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50658](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50658) | LIGHT C · 07 · Moderation · Reject | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50677](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50677) | LIGHT C · 08 · Moderation · Reject Reason | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50697](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50697) | LIGHT C · 09 · Moderation · Close | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50715](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50715) | LIGHT C · 10 · Moderation · Close Confirmation | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50733](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50733) | LIGHT C · 11 · Moderation · Void | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50751](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50751) | LIGHT C · 12 · Moderation · Void Reason | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50770](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50770) | LIGHT C · 13 · Moderation · Select Outcome | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50787](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50787) | LIGHT C · 14 · Moderation · Settlement Preview | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50807](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50807) | LIGHT C · 15 · Moderation · Settlement Confirmation | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50826](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50826) | LIGHT C · 16 · Moderation · Empty Queue | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50842](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50842) | LIGHT C · 17 · Moderation · Processing | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50858](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50858) | LIGHT C · 18 · Moderation · Success | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50876](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50876) | LIGHT C · 19 · Moderation · Failure | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50895](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50895) | LIGHT C · 20 · Moderation · Conflict Stale Data | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50911](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50911) | LIGHT C · 21 · Moderation · Forbidden | 390×844 | /17 — MODERATION / ADMIN · LIGHT C |
| [227:50930](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50930) | LIGHT C · 01 · System · Skeleton | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:50945](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50945) | LIGHT C · 02 · System · Offline | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:50959](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50959) | LIGHT C · 03 · System · Retry | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:50975](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50975) | LIGHT C · 04 · System · Auth Required | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:50989](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-50989) | LIGHT C · 05 · System · Auth Expired | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51003](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51003) | LIGHT C · 06 · System · 404 | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51018](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51018) | LIGHT C · 07 · System · Maintenance | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51031](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51031) | LIGHT C · 08 · System · Stale Quote | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51047](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51047) | LIGHT C · 09 · System · Destructive Confirmation | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51067](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51067) | LIGHT C · 10 · System · Bottom Sheet | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51082](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51082) | LIGHT C · 11 · System · Modal | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51096](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51096) | LIGHT C · 12 · System · Initial Loading | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51109](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51109) | LIGHT C · 13 · System · Empty | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51123](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51123) | LIGHT C · 14 · System · Backend Processing | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51138](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51138) | LIGHT C · 15 · System · Generic Success | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51153](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51153) | LIGHT C · 16 · System · Toast Success | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51166](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51166) | LIGHT C · 17 · System · Network Error | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51180](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51180) | LIGHT C · 18 · System · Forbidden | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51194](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51194) | LIGHT C · 19 · System · Market Not Found | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51208](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51208) | LIGHT C · 20 · System · Invalid Share Token | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51222](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51222) | LIGHT C · 21 · System · Unavailable Unlisted Link | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51236](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51236) | LIGHT C · 22 · System · Insufficient Balance | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51252](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51252) | LIGHT C · 23 · System · Generic Error | 390×844 | /18 — SYSTEM STATES · LIGHT C |
| [227:51267](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=227-51267) | LIGHT C · 24 · System · Toast Error | 390×844 | /18 — SYSTEM STATES · LIGHT C |

### 23 — HANDOFF · IMPLEMENTATION · [228:2](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=228-2)

Экранные фреймы не выявлены данным обходом: страница содержит компоненты, служебные материалы или изображения.

### 99 — ARCHIVE · [0:1](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=0-1)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [7:11145](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-11145) | 16 Extra Product Patterns · Complete | 1660×2831 |  |
| [7:10886](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10886) | 15 System & Edge States · Complete | 1660×2743 |  |
| [7:10623](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10623) | 14 Moderation · Complete | 1660×2743 |  |
| [7:10442](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10442) | 13 Wallet & Help · Complete | 1660×1887 |  |
| [7:8600](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8600) | 12 Profile & My Markets · Complete | 1660×9591 |  |
| [7:8440](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8440) | 11 Notifications · Complete | 1660×3599 |  |
| [7:8343](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8343) | 10 Create Results · Complete | 1660×4455 |  |
| [7:8212](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8212) | 09 Create Market · Complete | 1660×6167 |  |
| [7:7856](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-7856) | 08 Portfolio & Activity · Complete | 1660×7879 |  |
| [7:6453](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6453) | 07 Own Price · Complete | 1660×1874 |  |
| [7:6268](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6268) | 06 Quick Trade · Complete | 1660×1874 |  |
| [7:6021](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6021) | 05 Market Detail · Complete | 1660×1874 |  |
| [7:5674](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-5674) | 04 Markets · Complete | 1660×1874 |  |
| [7:5374](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-5374) | 01–03 Foundations, Components & Entry · Complete | 1660×1874 |  |
| [7:3](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-3) | 00 Cover & Inventory | 1660×1040 |  |
| [7:33](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-33) | 01 Foundations | 1660×1018 |  |
| [7:74](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-74) | 02 Components & States | 1660×1018 |  |
| [7:133](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-133) | 03 Entry | 1660×1018 |  |
| [7:179](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-179) | 04 Markets | 1660×1018 |  |
| [7:279](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-279) | 05 Market Detail | 1660×1018 |  |
| [7:343](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-343) | 06 Quick Trade | 1660×1018 |  |
| [7:396](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-396) | 07 Own Price | 1660×1018 |  |
| [7:446](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-446) | 08 Portfolio & Activity | 1660×1018 |  |
| [7:541](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-541) | 09 Create Market | 1660×1018 |  |
| [7:588](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-588) | 10 Create Results | 1660×1018 |  |
| [7:635](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-635) | 11 Notifications | 1660×1018 |  |
| [7:700](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-700) | 12 Profile & My Markets | 1660×1018 |  |
| [7:769](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-769) | 13 Wallet & Help | 1660×1018 |  |
| [7:826](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-826) | 14 Moderation | 1660×1018 |  |
| [7:879](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-879) | 15 System & Edge States | 1660×1018 |  |
| [7:924](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-924) | 16 Extra Product Patterns | 1660×1018 |  |
| [12:4048](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-4048) | 01 · Color Direction B · Лента рынков | 390×844 | /SUPERSEDED · Color Direction Exploration |
| [12:7453](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-7453) | BetTON color direction comparison | 1056×7545 | /SUPERSEDED · Purple Direction B |
| [22:11434](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=22-11434) | 10 · Market Detail · Legacy LMSR | 390×844 | /SUPERSEDED · Legacy LMSR mechanics |
| [7:11153](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-11153) | Статистика автора | 390×844 | /16 Extra Product Patterns · Complete/Screen grid |
| [7:11194](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-11194) | Настройки уведомлений | 390×844 | /16 Extra Product Patterns · Complete/Screen grid |
| [7:11222](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-11222) | Лента рынков | 390×844 | /16 Extra Product Patterns · Complete/Screen grid |
| [7:11257](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-11257) | Успешное действие | 390×844 | /16 Extra Product Patterns · Complete/Screen grid |
| [7:11285](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-11285) | Ошибка действия | 390×844 | /16 Extra Product Patterns · Complete/Screen grid |
| [7:11312](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-11312) | Поделиться рынком | 390×844 | /16 Extra Product Patterns · Complete/Screen grid |
| [7:11342](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-11342) | Вероятность или коэффициент | 390×844 | /16 Extra Product Patterns · Complete/Screen grid |
| [7:11370](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-11370) | Рынки | 430×932 | /16 Extra Product Patterns · Complete/Screen grid |
| [7:10894](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10894) | Не удалось загрузить рынки | 390×844 | /15 System & Edge States · Complete/Screen grid |
| [7:10919](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10919) | Нужна авторизация | 390×844 | /15 System & Edge States · Complete/Screen grid |
| [7:10944](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10944) | Сессия истекла | 390×844 | /15 System & Edge States · Complete/Screen grid |
| [7:10964](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10964) | Доступ запрещён | 390×844 | /15 System & Edge States · Complete/Screen grid |
| [7:10989](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10989) | Рынок не найден | 390×844 | /15 System & Edge States · Complete/Screen grid |
| [7:11014](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-11014) | Unlisted ссылка недоступна | 390×844 | /15 System & Edge States · Complete/Screen grid |
| [7:11039](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-11039) | Технические работы | 390×844 | /15 System & Edge States · Complete/Screen grid |
| [7:11064](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-11064) | Нет сети | 390×844 | /15 System & Edge States · Complete/Screen grid |
| [7:11089](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-11089) | Котировка устарела | 390×844 | /15 System & Edge States · Complete/Screen grid |
| [7:11116](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-11116) | Недостаточно средств | 390×844 | /15 System & Edge States · Complete/Screen grid |
| [7:10631](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10631) | Подтвердить одобрение | 390×844 | /14 Moderation · Complete/Screen grid |
| [7:10660](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10660) | Отклонить рынок | 390×844 | /14 Moderation · Complete/Screen grid |
| [7:10686](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10686) | Закрыть / void | 390×844 | /14 Moderation · Complete/Screen grid |
| [7:10712](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10712) | Выбрать исход | 390×844 | /14 Moderation · Complete/Screen grid |
| [7:10743](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10743) | Подтвердить settlement | 390×844 | /14 Moderation · Complete/Screen grid |
| [7:10772](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10772) | Нет доступа | 390×844 | /14 Moderation · Complete/Screen grid |
| [7:10798](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10798) | Очередь пуста | 390×844 | /14 Moderation · Complete/Screen grid |
| [7:10827](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10827) | Обрабатываем решение | 390×844 | /14 Moderation · Complete/Screen grid |
| [7:10856](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10856) | Решение не сохранено | 390×844 | /14 Moderation · Complete/Screen grid |
| [7:10450](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10450) | Кошелёк | 390×844 | /13 Wallet & Help · Complete/Screen grid |
| [7:10482](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10482) | Как работает P2P | 390×844 | /13 Wallet & Help · Complete/Screen grid |
| [7:10507](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10507) | Quick Trade или своя цена | 390×844 | /13 Wallet & Help · Complete/Screen grid |
| [7:10533](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10533) | Комиссия | 390×844 | /13 Wallet & Help · Complete/Screen grid |
| [7:10568](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10568) | Как определяется исход | 390×844 | /13 Wallet & Help · Complete/Screen grid |
| [7:10593](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-10593) | Помощь и FAQ | 390×844 | /13 Wallet & Help · Complete/Screen grid |
| [7:8608](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8608) | Настройки профиля | 390×844 | /12 Profile & My Markets · Complete/Screen grid |
| [7:8646](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8646) | Помощь и FAQ | 390×844 | /12 Profile & My Markets · Complete/Screen grid |
| [7:8682](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8682) | Кошелёк | 390×844 | /12 Profile & My Markets · Complete/Screen grid |
| [7:8720](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8720) | Админ профиль | 390×844 | /12 Profile & My Markets · Complete/Screen grid |
| [7:8758](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8758) | Мои рынки pending | 390×844 | /12 Profile & My Markets · Complete/Screen grid |
| [7:8801](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8801) | Мои рынки open | 390×844 | /12 Profile & My Markets · Complete/Screen grid |
| [7:8846](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8846) | Мои рынки resolved | 390×844 | /12 Profile & My Markets · Complete/Screen grid |
| [7:8889](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8889) | Мои рынки rejected | 390×844 | /12 Profile & My Markets · Complete/Screen grid |
| [7:8927](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8927) | Мои рынки пусты | 390×844 | /12 Profile & My Markets · Complete/Screen grid |
| [7:8965](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8965) | Публичные события автора | 390×844 | /12 Profile & My Markets · Complete/Screen grid |
| [7:9002](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-9002) | Статистика автора | 390×844 | /12 Profile & My Markets · Complete/Screen grid |
| [7:8448](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8448) | Нет уведомлений | 390×844 | /11 Notifications · Complete/Screen grid |
| [7:8484](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8484) | Админ уведомление | 390×844 | /11 Notifications · Complete/Screen grid |
| [7:8523](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8523) | Настройки уведомлений | 390×844 | /11 Notifications · Complete/Screen grid |
| [7:8561](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8561) | Разрешения недоступны | 390×844 | /11 Notifications · Complete/Screen grid |
| [7:8351](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8351) | Рынок отклонён | 390×844 | /10 Create Results · Complete/Screen grid |
| [7:8368](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8368) | Unlisted создан | 390×844 | /10 Create Results · Complete/Screen grid |
| [7:8388](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8388) | Рынок открыт | 390×844 | /10 Create Results · Complete/Screen grid |
| [7:8405](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8405) | Ошибка копирования | 390×844 | /10 Create Results · Complete/Screen grid |
| [7:8422](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8422) | Переход в Мои рынки | 390×844 | /10 Create Results · Complete/Screen grid |
| [7:8220](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8220) | Публичный рынок | 390×844 | /09 Create Market · Complete/Screen grid |
| [7:8237](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8237) | Рынок по ссылке | 390×844 | /09 Create Market · Complete/Screen grid |
| [7:8254](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8254) | Вопрос и исходы | 390×844 | /09 Create Market · Complete/Screen grid |
| [7:8273](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8273) | Критерии результата | 390×844 | /09 Create Market · Complete/Screen grid |
| [7:8290](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8290) | Финальная форма | 390×844 | /09 Create Market · Complete/Screen grid |
| [7:8307](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8307) | Проверка рынка | 390×844 | /09 Create Market · Complete/Screen grid |
| [7:8325](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8325) | Отправка рынка | 390×844 | /09 Create Market · Complete/Screen grid |
| [7:7864](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-7864) | Сводка портфеля | 390×844 | /08 Portfolio & Activity · Complete/Screen grid |
| [7:7910](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-7910) | Открытые ордера | 390×844 | /08 Portfolio & Activity · Complete/Screen grid |
| [7:7953](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-7953) | Портфель пуст | 390×844 | /08 Portfolio & Activity · Complete/Screen grid |
| [7:7994](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-7994) | Требуется вход | 390×844 | /08 Portfolio & Activity · Complete/Screen grid |
| [7:8032](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8032) | История операций | 390×844 | /08 Portfolio & Activity · Complete/Screen grid |
| [7:8075](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8075) | Завершённая активность | 390×844 | /08 Portfolio & Activity · Complete/Screen grid |
| [7:8116](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8116) | История сделок | 390×844 | /08 Portfolio & Activity · Complete/Screen grid |
| [7:8157](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8157) | История пуста | 390×844 | /08 Portfolio & Activity · Complete/Screen grid |
| [7:8193](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-8193) | Отмена остатка | 390×844 | /08 Portfolio & Activity · Complete/Screen grid |
| [7:6461](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6461) | Ордер размещён | 390×844 | /07 Own Price · Complete/Screen grid |
| [7:6490](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6490) | Частично исполнен | 390×844 | /07 Own Price · Complete/Screen grid |
| [7:6519](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6519) | Отменить остаток | 390×844 | /07 Own Price · Complete/Screen grid |
| [7:6553](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6553) | Остаток отменён | 390×844 | /07 Own Price · Complete/Screen grid |
| [7:6584](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6584) | Ошибка ордера | 390×844 | /07 Own Price · Complete/Screen grid |
| [7:6613](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6613) | Недостаточно средств | 390×844 | /07 Own Price · Complete/Screen grid |
| [7:6276](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6276) | Нет доступных предложений | 390×844 | /06 Quick Trade · Complete/Screen grid |
| [7:6305](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6305) | Недостаточно средств | 390×844 | /06 Quick Trade · Complete/Screen grid |
| [7:6334](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6334) | Подтверждение IOC | 390×844 | /06 Quick Trade · Complete/Screen grid |
| [7:6363](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6363) | Сделка исполнена | 390×844 | /06 Quick Trade · Complete/Screen grid |
| [7:6394](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6394) | Котировка изменилась | 390×844 | /06 Quick Trade · Complete/Screen grid |
| [7:6423](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6423) | Не удалось исполнить | 390×844 | /06 Quick Trade · Complete/Screen grid |
| [7:6029](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6029) | Стакан | 390×844 | /05 Market Detail · Complete/Screen grid |
| [7:6063](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6063) | Критерии и правила | 390×844 | /05 Market Detail · Complete/Screen grid |
| [7:6095](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6095) | Доступ по ссылке | 390×844 | /05 Market Detail · Complete/Screen grid |
| [7:6124](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6124) | Рынок закрыт | 390×844 | /05 Market Detail · Complete/Screen grid |
| [7:6151](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6151) | Результат · ДА | 390×844 | /05 Market Detail · Complete/Screen grid |
| [7:6180](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6180) | Рынок отменён | 390×844 | /05 Market Detail · Complete/Screen grid |
| [7:6207](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6207) | Проверка создателя | 390×844 | /05 Market Detail · Complete/Screen grid |
| [7:6238](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-6238) | Legacy LMSR | 390×844 | /05 Market Detail · Complete/Screen grid |
| [7:5682](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-5682) | Поиск рынков | 390×844 | /04 Markets · Complete/Screen grid |
| [7:5729](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-5729) | Фильтры | 390×844 | /04 Markets · Complete/Screen grid |
| [7:5781](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-5781) | Сначала новые | 390×844 | /04 Markets · Complete/Screen grid |
| [7:5830](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-5830) | Популярные | 390×844 | /04 Markets · Complete/Screen grid |
| [7:5879](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-5879) | Скоро закроются | 390×844 | /04 Markets · Complete/Screen grid |
| [7:5928](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-5928) | Ничего не найдено | 390×844 | /04 Markets · Complete/Screen grid |
| [7:5975](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-5975) | Рынки · доступные предложения | 390×844 | /04 Markets · Complete/Screen grid |
| [7:5382](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-5382) | Сетка и геометрия | 390×844 | /01–03 Foundations, Components & Entry · Complete/Screen grid |
| [7:5415](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-5415) | Навигация и выбор | 390×844 | /01–03 Foundations, Components & Entry · Complete/Screen grid |
| [7:5466](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-5466) | Строки продукта | 390×844 | /01–03 Foundations, Components & Entry · Complete/Screen grid |
| [7:5499](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-5499) | Обратная связь | 390×844 | /01–03 Foundations, Components & Entry · Complete/Screen grid |
| [7:5539](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-5539) | Системные состояния | 390×844 | /01–03 Foundations, Components & Entry · Complete/Screen grid |
| [7:5571](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-5571) | Как работает P2P | 390×844 | /01–03 Foundations, Components & Entry · Complete/Screen grid |
| [7:5599](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-5599) | Комиссия BetTON | 390×844 | /01–03 Foundations, Components & Entry · Complete/Screen grid |
| [7:5627](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-5627) | Готово к рынку | 390×844 | /01–03 Foundations, Components & Entry · Complete/Screen grid |
| [7:41](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-41) | Цвет и контраст | 390×844 | /01 Foundations/Screen grid |
| [7:57](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-57) | Типографика | 390×844 | /01 Foundations/Screen grid |
| [7:82](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-82) | Кнопки и icon buttons | 390×844 | /02 Components & States/Screen grid |
| [7:108](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-108) | Inputs & Search | 390×844 | /02 Components & States/Screen grid |
| [7:141](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-141) | BetTON | 390×844 | /03 Entry/Screen grid |
| [7:159](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-159) | Добро пожаловать | 390×844 | /03 Entry/Screen grid |
| [7:187](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-187) | Рынки | 390×844 | /04 Markets/Screen grid |
| [7:234](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-234) | Категории | 390×844 | /04 Markets/Screen grid |
| [7:287](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-287) | BTC выше $150k? | 390×844 | /05 Market Detail/Screen grid |
| [7:315](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-315) | График рынка | 390×844 | /05 Market Detail/Screen grid |
| [7:351](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-351) | Quick Trade · ДА | 390×844 | /06 Quick Trade/Screen grid |
| [7:373](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-373) | Частичное исполнение | 390×844 | /06 Quick Trade/Screen grid |
| [7:404](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-404) | Своя цена · ДА | 390×844 | /07 Own Price/Screen grid |
| [7:426](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-426) | Предпросмотр ордера | 390×844 | /07 Own Price/Screen grid |
| [7:454](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-454) | Портфель | 390×844 | /08 Portfolio & Activity/Screen grid |
| [7:499](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-499) | Позиции | 390×844 | /08 Portfolio & Activity/Screen grid |
| [7:549](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-549) | Создать рынок · 1/3 | 390×844 | /09 Create Market/Screen grid |
| [7:568](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-568) | Ошибки формы | 390×844 | /09 Create Market/Screen grid |
| [7:596](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-596) | На модерации | 390×844 | /10 Create Results/Screen grid |
| [7:615](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-615) | Одобрен | 390×844 | /10 Create Results/Screen grid |
| [7:643](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-643) | Уведомления | 390×844 | /11 Notifications/Screen grid |
| [7:680](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-680) | Детали события | 390×844 | /11 Notifications/Screen grid |
| [7:708](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-708) | Профиль | 390×844 | /12 Profile & My Markets/Screen grid |
| [7:748](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-748) | Публичный автор | 390×844 | /12 Profile & My Markets/Screen grid |
| [7:777](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-777) | Wallet · Deposit | 390×844 | /13 Wallet & Help/Screen grid |
| [7:801](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-801) | Wallet · Withdraw | 390×844 | /13 Wallet & Help/Screen grid |
| [7:834](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-834) | Очередь модерации | 390×844 | /14 Moderation/Screen grid |
| [7:858](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-858) | Review рынка | 390×844 | /14 Moderation/Screen grid |
| [7:887](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-887) | Загрузка | 390×844 | /15 System & Edge States/Screen grid |
| [7:905](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-905) | Пусто | 390×844 | /15 System & Edge States/Screen grid |
| [7:932](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-932) | State picker | 390×844 | /16 Extra Product Patterns/Screen grid |
| [7:958](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=7-958) | Поделиться рынком | 390×844 | /16 Extra Product Patterns/Screen grid |
| [12:7511](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-7511) | Markets Feed · A | 390×720 | /SUPERSEDED · Purple Direction B/BetTON color direction comparison/Color direction board/01 · Markets Feed/Screen pair |
| [12:7576](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-7576) | Markets Feed · B | 390×720 | /SUPERSEDED · Purple Direction B/BetTON color direction comparison/Color direction board/01 · Markets Feed/Screen pair |
| [12:7651](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-7651) | Market Detail Overview · A | 390×720 | /SUPERSEDED · Purple Direction B/BetTON color direction comparison/Color direction board/02 · Market Detail Overview/Screen pair |
| [12:7680](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-7680) | Market Detail Overview · B | 390×720 | /SUPERSEDED · Purple Direction B/BetTON color direction comparison/Color direction board/02 · Market Detail Overview/Screen pair |
| [12:7719](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-7719) | Quick Trade entry / execution preview · A | 390×720 | /SUPERSEDED · Purple Direction B/BetTON color direction comparison/Color direction board/03 · Quick Trade entry / execution preview/Screen pair |
| [12:7747](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-7747) | Quick Trade entry / execution preview · B | 390×720 | /SUPERSEDED · Purple Direction B/BetTON color direction comparison/Color direction board/03 · Quick Trade entry / execution preview/Screen pair |
| [12:7785](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-7785) | Own Price order entry · A | 390×720 | /SUPERSEDED · Purple Direction B/BetTON color direction comparison/Color direction board/04 · Own Price order entry/Screen pair |
| [12:7814](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-7814) | Own Price order entry · B | 390×720 | /SUPERSEDED · Purple Direction B/BetTON color direction comparison/Color direction board/04 · Own Price order entry/Screen pair |
| [12:7853](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-7853) | Portfolio Overview · A | 390×720 | /SUPERSEDED · Purple Direction B/BetTON color direction comparison/Color direction board/05 · Portfolio Overview/Screen pair |
| [12:7911](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-7911) | Portfolio Overview · B | 390×720 | /SUPERSEDED · Purple Direction B/BetTON color direction comparison/Color direction board/05 · Portfolio Overview/Screen pair |
| [12:7979](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-7979) | Create Market · A | 390×720 | /SUPERSEDED · Purple Direction B/BetTON color direction comparison/Color direction board/06 · Create Market/Screen pair |
| [12:8010](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-8010) | Create Market · B | 390×720 | /SUPERSEDED · Purple Direction B/BetTON color direction comparison/Color direction board/06 · Create Market/Screen pair |
| [12:8051](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-8051) | Notifications · A | 390×720 | /SUPERSEDED · Purple Direction B/BetTON color direction comparison/Color direction board/07 · Notifications/Screen pair |
| [12:8110](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-8110) | Notifications · B | 390×720 | /SUPERSEDED · Purple Direction B/BetTON color direction comparison/Color direction board/07 · Notifications/Screen pair |
| [12:8179](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-8179) | Profile · A | 390×720 | /SUPERSEDED · Purple Direction B/BetTON color direction comparison/Color direction board/08 · Profile/Screen pair |
| [12:8230](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=12-8230) | Profile · B | 390×720 | /SUPERSEDED · Purple Direction B/BetTON color direction comparison/Color direction board/08 · Profile/Screen pair |

### 24 — ARCHIVE · GUARANTOR UX v2 · заменён UX v3 · [271:2](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=271-2)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [271:3](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=271-3) | BETTON GUARANTOR v2 / REVIEW BOARD | 2570×7328 |  |
| [275:15637](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-15637) | PROTOTYPE / 01.01 Create | 390×844 |  |
| [275:15657](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-15657) | PROTOTYPE / 01.02 Question | 390×844 |  |
| [275:15733](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-15733) | PROTOTYPE / 01.03 01.03 / Условия события | 390×844 |  |
| [275:15756](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-15756) | PROTOTYPE / 01.04 01.04 / Источник и сроки | 390×844 |  |
| [275:15778](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-15778) | PROTOTYPE / 01.05 01.05 / Проверьте событие | 390×844 |  |
| [275:15801](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-15801) | PROTOTYPE / 02.01 02.01 / Выбрать гаранта | 390×844 |  |
| [275:15822](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-15822) | PROTOTYPE / 02.02 02.02 / Список гарантов | 390×844 |  |
| [275:15848](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-15848) | PROTOTYPE / 02.03 02.03 / Профиль Анны | 390×844 |  |
| [275:15875](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-15875) | PROTOTYPE / 02.04 02.04 / Приглашение отправлено | 390×844 |  |
| [275:15894](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-15894) | PROTOTYPE / 02.05 02.05 / Новое приглашение | 390×844 |  |
| [275:15915](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-15915) | PROTOTYPE / 03.01 03.01 / Обсуждение пари | 390×844 |  |
| [275:15941](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-15941) | PROTOTYPE / 03.02 03.02 / Переписка по условиям | 390×844 |  |
| [275:15965](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-15965) | PROTOTYPE / 03.03 03.03 / Новая версия условий | 390×844 |  |
| [275:15993](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-15993) | PROTOTYPE / 03.04 03.04 / Принятие правил | 390×844 |  |
| [275:16015](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16015) | PROTOTYPE / 03.05 03.05 / Продлить обсуждение | 390×844 |  |
| [275:16035](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16035) | PROTOTYPE / 04.01 04.01 / Мой тариф гаранта | 390×844 |  |
| [275:16064](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16064) | PROTOTYPE / 04.02 04.02 / Варианты тарифа | 390×844 |  |
| [275:16087](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16087) | PROTOTYPE / 04.03 04.03 / Изменить стоимость | 390×844 |  |
| [275:16112](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16112) | PROTOTYPE / 04.04 04.04 / Ответ на новую цену | 390×844 |  |
| [275:16136](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16136) | PROTOTYPE / 04.05 04.05 / Последняя цена | 390×844 |  |
| [275:16156](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16156) | PROTOTYPE / 05.01 05.01 / Пари согласовано | 390×844 |  |
| [275:16177](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16177) | PROTOTYPE / 05.02 05.02 / Условия перед ставкой | 390×844 |  |
| [275:16200](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16200) | PROTOTYPE / 05.03 05.03 / Предложения игроков | 390×844 |  |
| [275:16220](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16220) | PROTOTYPE / 05.04 05.04 / Предложить результат | 390×844 |  |
| [275:16245](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16245) | PROTOTYPE / 05.05 05.05 / Результат и возражение | 390×844 |  |
| [275:16265](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16265) | PROTOTYPE / 06.01 06.01 / Без гаранта | 390×844 |  |
| [275:16282](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16282) | PROTOTYPE / 06.02 06.02 / Ошибка в обязательном поле | 390×844 |  |
| [275:16307](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16307) | PROTOTYPE / 06.03 06.03 / Гарант не ответил | 390×844 |  |
| [275:16327](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16327) | PROTOTYPE / 06.04 06.04 / Исход не подтверждён | 390×844 |  |
| [275:16345](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16345) | PROTOTYPE / 06.05 06.05 / Профиль и темы | 390×844 |  |
| [275:16366](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16366) | PROTOTYPE / 07.01 07.01 / Передано администратору | 390×844 |  |
| [275:16388](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16388) | PROTOTYPE / 07.02 07.02 / Пари рассчитано | 390×844 |  |
| [275:16410](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16410) | PROTOTYPE / 07.03 07.03 / Оценить гаранта | 390×844 |  |
| [275:16432](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16432) | PROTOTYPE / 07.04 07.04 / Время обсуждения вышло | 390×844 |  |
| [275:16454](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=275-16454) | PROTOTYPE / 07.05 07.05 / Цена не согласована | 390×844 |  |
| [276:16477](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=276-16477) | PROTOTYPE / 02.06 Профиль Дмитрия | 390×844 |  |
| [278:1842](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=278-1842) | PROTOTYPE / 05.06 Разместить предложение | 390×844 |  |
| [278:1891](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=278-1891) | PROTOTYPE / 05.07 Мои предложения | 390×844 |  |
| [278:1935](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=278-1935) | PROTOTYPE / 07.06 Пари отменено | 390×844 |  |
| [278:1979](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=278-1979) | PROTOTYPE / 07.07 Отзыв сохранён | 390×844 |  |
| [278:2018](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=278-2018) | PROTOTYPE / 02.07 Гарант отказался | 390×844 |  |
| [279:16829](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=279-16829) | PROTOTYPE / PUBLIC.2 PROTOTYPE / 01.02 Question | 390×844 |  |
| [279:16855](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=279-16855) | PROTOTYPE / PUBLIC.3 PROTOTYPE / 01.03 01.03 / Условия события | 390×844 |  |
| [279:16878](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=279-16878) | PROTOTYPE / PUBLIC.4 PROTOTYPE / 01.04 01.04 / Источник и сроки | 390×844 |  |
| [279:16900](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=279-16900) | PROTOTYPE / PUBLIC.5 PROTOTYPE / 01.05 01.05 / Проверьте событие | 390×844 |  |
| [279:16923](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=279-16923) | PROTOTYPE / PUBLIC.6 PROTOTYPE / 02.07 Гарант отказался | 390×844 |  |
| [279:17077](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=279-17077) | PROTOTYPE / 05.08 Заявка отменена | 390×844 |  |

### 25 — ONBOARDING · BETTON CONCEPT · [277:1842](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=277-1842)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [277:1843](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=277-1843) | ONBOARDING / V1 · PREVIOUS REVIEW (preserved) | 2142×908 |  |
| [286:17](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=286-17) | ONBOARDING / V2 · ILLUSTRATED · REVIEW | 2142×908 |  |
| [304:2145](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=304-2145) | BETTON / EVENT TYPES · THREE DETAIL SCREENS | 1320×923 | /EVENT TYPES / Public · Private · Guarantor (interactive) |
| [291:17](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=291-17) | 01 / BetTON · Illustrated onboarding | 390×844 |  |
| [291:66](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=291-66) | 02 / BetTON · Illustrated onboarding | 390×844 |  |
| [291:109](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=291-109) | 03 / BetTON · Illustrated onboarding | 390×844 |  |
| [291:149](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=291-149) | 04 / BetTON · Illustrated onboarding | 390×844 |  |
| [291:184](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=291-184) | 05 / BetTON · Illustrated onboarding | 390×844 |  |
| [304:2146](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=304-2146) | DETAIL 1 / Публичное событие | 390×844 |  |
| [304:2190](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=304-2190) | DETAIL 2 / Частное событие | 390×844 |  |
| [304:2231](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=304-2231) | DETAIL 3 / Частное с гарантом | 390×844 |  |
| [279:2](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=279-2) | 01 / Onboarding | 390×844 | /ONBOARDING / V1 · PREVIOUS REVIEW (preserved) |
| [279:44](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=279-44) | 02 / Onboarding | 390×844 | /ONBOARDING / V1 · PREVIOUS REVIEW (preserved) |
| [279:95](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=279-95) | 03 / Onboarding | 390×844 | /ONBOARDING / V1 · PREVIOUS REVIEW (preserved) |
| [279:142](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=279-142) | 04 / Onboarding | 390×844 | /ONBOARDING / V1 · PREVIOUS REVIEW (preserved) |
| [279:177](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=279-177) | 05 / Onboarding | 390×844 | /ONBOARDING / V1 · PREVIOUS REVIEW (preserved) |

### 26 — GUARANTOR · UX v3 · [328:2](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-2)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [328:19](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-19) | G3 / create | 390×844 |  |
| [328:47](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-47) | G3 / question | 390×844 |  |
| [328:76](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-76) | G3 / rules | 390×844 |  |
| [328:106](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-106) | G3 / summary | 390×844 |  |
| [328:133](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-133) | G3 / directory | 390×844 |  |
| [328:169](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-169) | G3 / selectedAnna | 390×844 |  |
| [328:203](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-203) | G3 / selectedDmitry | 390×844 |  |
| [328:235](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=328-235) | G3 / profileAnna | 390×844 |  |
| [330:46](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-46) | G3 / profileDmitry | 390×844 |  |
| [330:77](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-77) | G3 / profileAlex | 390×844 |  |
| [330:107](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-107) | G3 / waitingAnna | 390×844 |  |
| [330:136](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-136) | G3 / waitingDmitry | 390×844 |  |
| [330:165](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-165) | G3 / guarantorInvite | 390×844 |  |
| [330:192](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-192) | G3 / chatCreator | 390×844 |  |
| [330:230](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-230) | G3 / chatGuarantor | 390×844 |  |
| [330:270](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-270) | G3 / offerCreator | 390×844 |  |
| [330:309](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-309) | G3 / lastOffer | 390×844 |  |
| [330:350](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=330-350) | G3 / priceEditor | 390×844 |  |
| [331:85](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-85) | G3 / agreed | 390×844 |  |
| [331:116](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-116) | G3 / event | 390×844 |  |
| [331:149](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-149) | G3 / termsConsent | 390×844 |  |
| [331:180](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-180) | G3 / protocol | 390×844 |  |
| [331:211](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-211) | G3 / decision | 390×844 |  |
| [331:243](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-243) | G3 / result | 390×844 |  |
| [331:276](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-276) | G3 / cancelled | 390×844 |  |
| [331:300](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-300) | G3 / review | 390×844 |  |
| [331:331](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-331) | G3 / reviewDone | 390×844 |  |
| [331:349](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-349) | G3 / noAnswer | 390×844 |  |
| [331:366](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-366) | G3 / declined | 390×844 |  |
| [331:383](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-383) | G3 / expired | 390×844 |  |
| [331:402](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=331-402) | G3 / extend | 390×844 |  |
| [332:108](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-108) | G3 / myProfile | 390×844 |  |
| [332:140](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-140) | G3 / tariffFixed | 390×844 |  |
| [332:165](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-165) | G3 / tariffPercent | 390×844 |  |
| [332:193](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-193) | G3 / tariffCombo | 390×844 |  |
| [332:225](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-225) | G3 / availabilityOff | 390×844 |  |
| [332:248](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-248) | G3 / history | 390×844 |  |
| [332:277](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-277) | G3 / rulesPublic | 390×844 |  |
| [332:299](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-299) | G3 / rulesPrivate | 390×844 |  |
| [332:321](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-321) | G3 / rulesGua | 390×844 |  |
| [332:344](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-344) | G3 / publicSummary | 390×844 |  |
| [332:367](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-367) | G3 / privateSummary | 390×844 |  |
| [332:387](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-387) | G3 / editRules | 390×844 |  |
| [332:413](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-413) | G3 / creatorConfirmed | 390×844 |  |
| [332:441](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-441) | G3 / publicProfile | 390×844 |  |
| [332:474](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=332-474) | G3 / evidence | 390×844 |  |
| [333:136](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-136) | G3 / terms | 390×844 |  |
| [333:165](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-165) | G3 / decisionConfirm | 390×844 |  |
| [333:187](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-187) | G3 / reviewSelected | 390×844 |  |
| [333:209](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-209) | G3 / myEvents | 390×844 |  |
| [333:236](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-236) | G3 / shared | 390×844 |  |
| [333:253](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-253) | G3 / trade | 390×844 |  |
| [333:284](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-284) | G3 / tradePlaced | 390×844 |  |
| [333:301](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-301) | G3 / priceDeclined | 390×844 |  |
| [333:318](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-318) | G3 / tariffSaved | 390×844 |  |
| [333:334](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-334) | G3 / publicSent | 390×844 |  |
| [333:351](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=333-351) | G3 / privateCreated | 390×844 |  |
| [334:148](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=334-148) | G3 / priceFixed | 390×844 |  |
| [334:173](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=334-173) | G3 / priceCombo | 390×844 |  |
| [335:156](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=335-156) | G3 / chatSent | 390×844 |  |
| [335:194](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=335-194) | G3 / chatGuarantorSent | 390×844 |  |
| [335:234](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=335-234) | G3 / chatExtended | 390×844 |  |
| [335:272](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=335-272) | G3 / chatUpdated | 390×844 |  |
| [335:310](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=335-310) | G3 / chatDmitry | 390×844 |  |
| [335:345](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=335-345) | G3 / cancelHistory | 390×844 |  |
| [337:198](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=337-198) | G3 / noHistory | 390×844 |  |
| [337:214](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=337-214) | G3 / resultPending | 390×844 |  |
| [342:206](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=342-206) | G3 / offerCreatorSent | 390×844 |  |
| [342:242](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=342-242) | G3 / lastOfferSent | 390×844 |  |
| [348:223](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=348-223) | G3 / chooseWinner | 390×844 |  |
| [375:17002](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=375-17002) | G3 / publicQuestion | 390×844 |  |
| [375:17030](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=375-17030) | G3 / publicRules | 390×844 |  |
| [375:17068](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=375-17068) | G3 / privateQuestion | 390×844 |  |
| [375:17096](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=375-17096) | G3 / privateRules | 390×844 |  |
| [413:364](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=413-364) | Создание / Тип выбран / Публичное | 390×844 |  |
| [413:392](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=413-392) | Создание / Тип выбран / Без гаранта | 390×844 |  |
| [413:420](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=413-420) | Создание / Тип выбран / С гарантом | 390×844 |  |
| [413:17760](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=413-17760) | Ошибка / Публичное · Вопрос и исходы | 390×844 |  |
| [413:17800](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=413-17800) | Ошибка / Публичное · Условия и сроки | 390×844 |  |
| [413:17876](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=413-17876) | Ошибка / Частное · Вопрос и исходы | 390×844 |  |
| [413:17910](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=413-17910) | Ошибка / Частное · Условия и сроки | 390×844 |  |
| [413:17951](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=413-17951) | Ошибка / С гарантом · Вопрос и исходы | 390×844 |  |
| [413:17985](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=413-17985) | Ошибка / С гарантом · Условия и сроки | 390×844 |  |
| [413:18026](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=413-18026) | QA / Проверка ошибок формы | 390×844 |  |
| [415:516](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-516) | Частное без гаранта / privateLink | 390×844 |  |
| [415:549](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-549) | Частное без гаранта / privateCopied | 390×844 |  |
| [415:582](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-582) | Частное без гаранта / privateConsent | 390×844 |  |
| [415:615](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-615) | Частное без гаранта / privateTrade | 390×844 |  |
| [415:648](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=415-648) | Частное без гаранта / privatePlaced | 390×844 |  |
| [418:1113](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=418-1113) | QA Desktop / Публичное создание · 1440 × 1000 | 1440×1000 |  |
| [418:1186](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=418-1186) | QA Dark A / Частное с гарантом | 390×844 |  |
| [439:601](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=439-601) | QA / Публичное · Источники и сроки · После прокрутки | 390×844 |  |
| [463:683](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=463-683) | UX v3 / Гарант / Ожидание обеспечения | 390×844 |  |
| [463:702](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=463-702) | UX v3 / Модерация / Исправленная редакция готова | 390×844 |  |

### 27 — ADMIN CENTER · DESKTOP v1 · [421:2](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-2)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [421:3](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-3) | ADMIN / 1 · Обзор | 1440×900 |  |
| [421:29](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-29) | ADMIN / 2 · Пользователи | 1440×900 |  |
| [421:55](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-55) | ADMIN / 3 · Карточка пользователя | 1440×900 |  |
| [421:81](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-81) | ADMIN / 4 · Карточка события | 1440×900 |  |
| [421:107](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-107) | ADMIN / 5 · Денежный журнал | 1440×900 |  |
| [421:133](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=421-133) | ADMIN / 6 · Аудит и ошибки | 1440×900 |  |
| [428:2](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-2) | ADMIN / 07 · Состояние системы | 1440×900 |  |
| [428:98](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-98) | ADMIN / 08 · Ошибки и трассировки | 1440×900 |  |
| [428:194](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-194) | ADMIN / 09 · Карточка инцидента | 1440×900 |  |
| [428:290](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-290) | ADMIN / 10 · Безопасность | 1440×900 |  |
| [428:386](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-386) | ADMIN / 11 · Резервные копии | 1440×900 |  |
| [428:482](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-482) | ADMIN / 12 · Центр оповещений | 1440×900 |  |
| [428:578](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-578) | ADMIN / 13 · Сверка TON | 1440×900 |  |
| [428:674](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-674) | ADMIN / 14 · TON / блокчейн | 1440×900 |  |
| [428:770](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=428-770) | ADMIN / 15 · Доступы и роли | 1440×900 |  |

### BETTON — VISUAL V1 · [479:2](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=479-2)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [487:2](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=487-2) | FEED-01 · Главная | 390×844 |  |
| [487:3](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=487-3) | EVENT-01 · Событие · Полное полотно | 390×2789 |  |
| [487:4](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=487-4) | MY-BETS-01 · Мои ставки | 390×844 |  |
| [487:5](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=487-5) | GUARANTOR-PICK-01 · Выбор гаранта | 390×844 |  |
| [493:351](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=493-351) | GUARANTOR-01 · Частное пари · Согласование свёрнуто | 390×844 |  |
| [493:352](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=493-352) | GUARANTOR-01 · Частное пари · Согласование / Чат | 390×844 |  |
| [493:353](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=493-353) | GUARANTOR-01 · Частное пари · Согласование / Условия | 390×844 |  |
| [493:354](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=493-354) | GUARANTOR-01 · Частное пари · Согласование / История | 390×844 |  |
| [493:355](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=493-355) | DRAWER-01 · Боковое меню | 390×844 |  |
| [498:556](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-556) | FEED-01 · Главная · QA 320 | 320×844 |  |
| [498:779](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-779) | FEED-01 · Главная · QA 360 | 360×844 |  |
| [498:1002](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-1002) | FEED-01 · Главная · QA 430 | 430×844 |  |
| [498:1225](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-1225) | EVENT-01 · Полное полотно · QA 320 | 320×3322 |  |
| [498:1454](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-1454) | EVENT-01 · Полное полотно · QA 360 | 360×3017 |  |
| [498:1683](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-1683) | EVENT-01 · Полное полотно · QA 430 | 430×2770 |  |
| [498:1912](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-1912) | MY-BETS-01 · Мои ставки · QA 320 | 320×844 |  |
| [498:2121](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-2121) | MY-BETS-01 · Мои ставки · QA 360 | 360×844 |  |
| [498:2330](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-2330) | MY-BETS-01 · Мои ставки · QA 430 | 430×844 |  |
| [498:2539](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-2539) | GUARANTOR-PICK-01 · Выбор гаранта · QA 320 | 320×844 |  |
| [498:2680](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-2680) | GUARANTOR-PICK-01 · Выбор гаранта · QA 360 | 360×844 |  |
| [498:2821](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-2821) | GUARANTOR-PICK-01 · Выбор гаранта · QA 430 | 430×844 |  |
| [498:2962](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-2962) | DRAWER-01 · Боковое меню · QA 320 | 320×844 |  |
| [498:3287](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-3287) | DRAWER-01 · Боковое меню · QA 360 | 360×844 |  |
| [498:3612](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-3612) | DRAWER-01 · Боковое меню · QA 430 | 430×844 |  |
| [498:3937](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-3937) | GUARANTOR-01 · Частное пари · Согласование свёрнуто · QA 320 | 320×844 |  |
| [498:4040](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-4040) | GUARANTOR-01 · Частное пари · Согласование свёрнуто · QA 360 | 360×844 |  |
| [498:4143](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-4143) | GUARANTOR-01 · Частное пари · Согласование свёрнуто · QA 430 | 430×844 |  |
| [498:4246](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-4246) | GUARANTOR-01 · Частное пари · Согласование / Чат · QA 320 | 320×844 |  |
| [498:4323](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-4323) | GUARANTOR-01 · Частное пари · Согласование / Чат · QA 360 | 360×844 |  |
| [498:4400](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-4400) | GUARANTOR-01 · Частное пари · Согласование / Чат · QA 430 | 430×844 |  |
| [498:4477](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-4477) | GUARANTOR-01 · Частное пари · Согласование / Условия · QA 320 | 320×844 |  |
| [498:4568](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-4568) | GUARANTOR-01 · Частное пари · Согласование / Условия · QA 360 | 360×844 |  |
| [498:4659](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-4659) | GUARANTOR-01 · Частное пари · Согласование / Условия · QA 430 | 430×844 |  |
| [498:4750](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-4750) | GUARANTOR-01 · Частное пари · Согласование / История · QA 320 | 320×844 |  |
| [498:4844](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-4844) | GUARANTOR-01 · Частное пари · Согласование / История · QA 360 | 360×844 |  |
| [498:4938](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=498-4938) | GUARANTOR-01 · Частное пари · Согласование / История · QA 430 | 430×844 |  |
| [500:2176](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-2176) | FEED-01 · Образец списка · Полная высота | 390×1223 |  |
| [500:2628](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-2628) | MY-BETS-01 · Мои ставки · Полная прокрутка | 390×1066 |  |
| [500:3343](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-3343) | STATE · Длинное название · 320 | 320×844 |  |
| [500:3566](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-3566) | STATE · Нет событий · 390 | 390×844 |  |
| [512:2746](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=512-2746) | FEED-01 · Original PNG · import blocked | 390×693 |  |
| [500:2399](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-2399) | EVENT-01 · График · 390 | 390×844 | /EVENT-01 · Переключение вкладок · 390 px |
| [566:23541](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=566-23541) | EVENT-01 · Предложения · 390 | 390×844 | /EVENT-01 · Переключение вкладок · 390 px |
| [566:24121](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=566-24121) | EVENT-01 · Информация · 390 | 390×844 | /EVENT-01 · Переключение вкладок · 390 px |
| [566:24602](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=566-24602) | EVENT-01 · Обсуждение · 390 | 390×844 | /EVENT-01 · Переключение вкладок · 390 px |
| [567:5709](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=567-5709) | EVENT-01 · График · 320 | 320×844 | /EVENT-01 · Переключение вкладок · 320 px |
| [567:24450](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=567-24450) | EVENT-01 · Предложения · 320 | 320×844 | /EVENT-01 · Переключение вкладок · 320 px |
| [567:25041](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=567-25041) | EVENT-01 · Информация · 320 | 320×844 | /EVENT-01 · Переключение вкладок · 320 px |
| [567:25632](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=567-25632) | EVENT-01 · Обсуждение · 320 | 320×844 | /EVENT-01 · Переключение вкладок · 320 px |
| [578:6024](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=578-6024) | EVENT-01 / Выбрано предложение из стакана | 390×844 | /EVENT-01 / Ставка — основные состояния / 390 |
| [578:24819](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=578-24819) | EVENT-01 / Быстрая ставка | 390×844 | /EVENT-01 / Ставка — основные состояния / 390 |
| [578:25471](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=578-25471) | EVENT-01 / Свой коэффициент | 390×844 | /EVENT-01 / Ставка — основные состояния / 390 |
| [578:26116](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=578-26116) | EVENT-01 / Подтверждение ставки | 390×844 | /EVENT-01 / Ставка — основные состояния / 390 |
| [580:6876](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=580-6876) | EVENT-01 / Ограничение доступного объёма | 390×844 | /EVENT-01 / Граничные состояния |
| [580:26958](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=580-26958) | EVENT-01 / Заявка ожидает совпадения | 390×844 | /EVENT-01 / Граничные состояния |
| [581:29341](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=581-29341) | EVENT-01 / Обсуждение — ввод и клавиатура | 390×844 | /EVENT-01 / Граничные состояния |
| [582:10375](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=582-10375) | EVENT-01 · График · 390 / выбран стакан 1.70 | 390×844 | /EVENT-01 / Выбранная ставка сохраняется при смене вкладки |
| [582:10898](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=582-10898) | EVENT-01 · Предложения · 390 / выбран стакан 1.70 | 390×844 | /EVENT-01 / Выбранная ставка сохраняется при смене вкладки |
| [582:11505](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=582-11505) | EVENT-01 · Информация · 390 / выбран стакан 1.70 | 390×844 | /EVENT-01 / Выбранная ставка сохраняется при смене вкладки |
| [582:12025](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=582-12025) | EVENT-01 · Обсуждение · 390 / выбран стакан 1.70 | 390×844 | /EVENT-01 / Выбранная ставка сохраняется при смене вкладки |
| [580:25670](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=580-25670) | EVENT-01 / Подтверждение быстрой ставки | 390×844 | /EVENT-01 / Ветви подтверждения и цены |
| [580:26317](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=580-26317) | EVENT-01 / Подтверждение своей заявки | 390×844 | /EVENT-01 / Ветви подтверждения и цены |
| [580:27602](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=580-27602) | EVENT-01 / Предложение 1.68 · Team Spirit | 390×844 | /EVENT-01 / Ветви подтверждения и цены |
| [580:28247](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=580-28247) | EVENT-01 / Подтверждение 1.68 | 390×844 | /EVENT-01 / Ветви подтверждения и цены |
| [580:28894](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=580-28894) | EVENT-01 / Предложение 1.67 · Team Spirit | 390×844 | /EVENT-01 / Ветви подтверждения и цены |
| [580:29539](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=580-29539) | EVENT-01 / Подтверждение 1.67 | 390×844 | /EVENT-01 / Ветви подтверждения и цены |
| [580:30186](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=580-30186) | EVENT-01 / Предложение 2.20 · Team Liquid | 390×844 | /EVENT-01 / Ветви подтверждения и цены |
| [580:30872](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=580-30872) | EVENT-01 / Подтверждение 2.20 | 390×844 | /EVENT-01 / Ветви подтверждения и цены |
| [580:31560](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=580-31560) | EVENT-01 / Предложение 2.22 · Team Liquid | 390×844 | /EVENT-01 / Ветви подтверждения и цены |
| [580:32246](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=580-32246) | EVENT-01 / Подтверждение 2.22 | 390×844 | /EVENT-01 / Ветви подтверждения и цены |
| [580:32934](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=580-32934) | EVENT-01 / Предложение 2.25 · Team Liquid | 390×844 | /EVENT-01 / Ветви подтверждения и цены |
| [580:33620](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=580-33620) | EVENT-01 / Подтверждение 2.25 | 390×844 | /EVENT-01 / Ветви подтверждения и цены |
| [581:9903](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=581-9903) | EVENT-01 / Способ размещения ставки | 390×844 | /EVENT-01 / Ветви подтверждения и цены |
| [581:28706](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=581-28706) | EVENT-01 / Результат исполнения · демо | 390×844 | /EVENT-01 / Ветви подтверждения и цены |
| [585:11429](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-11429) | EVENT-01 · График · 390 / QA 430 | 430×844 | /EVENT-01 / Вкладки / QA 430 |
| [585:11902](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-11902) | EVENT-01 · Предложения · 390 / QA 430 | 430×844 | /EVENT-01 / Вкладки / QA 430 |
| [585:12459](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-12459) | EVENT-01 · Информация · 390 / QA 430 | 430×844 | /EVENT-01 / Вкладки / QA 430 |
| [585:12929](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-12929) | EVENT-01 · Обсуждение · 390 / QA 430 | 430×844 | /EVENT-01 / Вкладки / QA 430 |
| [585:13399](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-13399) | EVENT-01 / Выбрано предложение из стакана / QA 320 | 320×844 | /EVENT-01 / Формы и клавиатура / QA 320 |
| [585:32155](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-32155) | EVENT-01 / Быстрая ставка / QA 320 | 320×844 | /EVENT-01 / Формы и клавиатура / QA 320 |
| [585:32768](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-32768) | EVENT-01 / Свой коэффициент / QA 320 | 320×844 | /EVENT-01 / Формы и клавиатура / QA 320 |
| [585:33374](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-33374) | EVENT-01 / Подтверждение ставки / QA 320 | 320×844 | /EVENT-01 / Формы и клавиатура / QA 320 |
| [585:33982](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-33982) | EVENT-01 / Ограничение доступного объёма / QA 320 | 320×844 | /EVENT-01 / Формы и клавиатура / QA 320 |
| [585:34587](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-34587) | EVENT-01 / Подтверждение быстрой ставки / QA 320 | 320×844 | /EVENT-01 / Формы и клавиатура / QA 320 |
| [585:35195](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-35195) | EVENT-01 / Подтверждение своей заявки / QA 320 | 320×844 | /EVENT-01 / Формы и клавиатура / QA 320 |
| [585:35797](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-35797) | EVENT-01 / Заявка ожидает совпадения / QA 320 | 320×844 | /EVENT-01 / Формы и клавиатура / QA 320 |
| [585:36402](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-36402) | EVENT-01 / Способ размещения ставки / QA 320 | 320×844 | /EVENT-01 / Формы и клавиатура / QA 320 |
| [586:15722](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=586-15722) | EVENT-01 / Обсуждение — ввод и клавиатура / QA 320 | 320×844 | /EVENT-01 / Формы и клавиатура / QA 320 |
| [585:36996](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-36996) | EVENT-01 / Выбрано предложение из стакана / QA 430 | 430×844 | /EVENT-01 / Формы и клавиатура / QA 430 |
| [585:37602](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-37602) | EVENT-01 / Быстрая ставка / QA 430 | 430×844 | /EVENT-01 / Формы и клавиатура / QA 430 |
| [585:38215](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-38215) | EVENT-01 / Свой коэффициент / QA 430 | 430×844 | /EVENT-01 / Формы и клавиатура / QA 430 |
| [585:38821](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-38821) | EVENT-01 / Подтверждение ставки / QA 430 | 430×844 | /EVENT-01 / Формы и клавиатура / QA 430 |
| [585:39429](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-39429) | EVENT-01 / Ограничение доступного объёма / QA 430 | 430×844 | /EVENT-01 / Формы и клавиатура / QA 430 |
| [585:40034](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-40034) | EVENT-01 / Подтверждение быстрой ставки / QA 430 | 430×844 | /EVENT-01 / Формы и клавиатура / QA 430 |
| [585:40642](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-40642) | EVENT-01 / Подтверждение своей заявки / QA 430 | 430×844 | /EVENT-01 / Формы и клавиатура / QA 430 |
| [585:41244](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-41244) | EVENT-01 / Заявка ожидает совпадения / QA 430 | 430×844 | /EVENT-01 / Формы и клавиатура / QA 430 |
| [585:41849](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=585-41849) | EVENT-01 / Способ размещения ставки / QA 430 | 430×844 | /EVENT-01 / Формы и клавиатура / QA 430 |
| [586:16246](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=586-16246) | EVENT-01 / Обсуждение — ввод и клавиатура / QA 430 | 430×844 | /EVENT-01 / Формы и клавиатура / QA 430 |
| [584:29114](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=584-29114) | EVENT-01 · График · 390 / полный UX раздела | 390×1260 | /EVENT-01 / Полное содержимое каждой вкладки + общие действия |
| [584:29587](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=584-29587) | EVENT-01 · Предложения · 390 / полный UX раздела | 390×1492 | /EVENT-01 / Полное содержимое каждой вкладки + общие действия |
| [584:30144](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=584-30144) | EVENT-01 · Информация · 390 / полный UX раздела | 390×1497 | /EVENT-01 / Полное содержимое каждой вкладки + общие действия |
| [584:30614](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=584-30614) | EVENT-01 · Обсуждение · 390 / полный UX раздела | 390×1131 | /EVENT-01 / Полное содержимое каждой вкладки + общие действия |
| [591:15890](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=591-15890) | EVENT-01 / Способ размещения ставки | 390×844 | /EVENT-01 / Второй исход / Team Liquid |
| [591:16584](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=591-16584) | EVENT-01 / Быстрая ставка | 390×844 | /EVENT-01 / Второй исход / Team Liquid |
| [591:17277](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=591-17277) | EVENT-01 / Свой коэффициент | 390×844 | /EVENT-01 / Второй исход / Team Liquid |
| [591:17963](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=591-17963) | EVENT-01 / Подтверждение быстрой ставки | 390×844 | /EVENT-01 / Второй исход / Team Liquid |
| [591:18651](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=591-18651) | EVENT-01 / Подтверждение своей заявки | 390×844 | /EVENT-01 / Второй исход / Team Liquid |
| [591:19333](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=591-19333) | EVENT-01 / Заявка ожидает совпадения | 390×844 | /EVENT-01 / Второй исход / Team Liquid |
| [607:16909](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=607-16909) | EVENT-01 / Быстрая ставка / Подробности | 390×844 | /EVENT-01 / Подробности исполнения |
| [607:17534](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=607-17534) | EVENT-01 / Быстрая ставка / QA 320 / Подробности | 320×844 | /EVENT-01 / Подробности исполнения |
| [607:18159](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=607-18159) | EVENT-01 / Быстрая ставка / QA 430 / Подробности | 430×844 | /EVENT-01 / Подробности исполнения |
| [607:18784](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=607-18784) | EVENT-01 / Быстрая ставка / Подробности | 390×844 | /EVENT-01 / Подробности исполнения |
| [608:17739](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=608-17739) | EVENT-01 / Быстрая ставка — доступна часть | 390×844 | /EVENT-01 / Частичное исполнение — проверка |
| [608:18368](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=608-18368) | EVENT-01 / Подтверждение — частичная быстрая ставка | 390×844 | /EVENT-01 / Частичное исполнение — проверка |
| [608:18979](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=608-18979) | EVENT-01 / Частично исполнено — остаток возвращён | 390×844 | /EVENT-01 / Частичное исполнение — проверка |
| [608:19558](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=608-19558) | EVENT-01 / Своя заявка — исполнено 40, в резерве 60 | 390×844 | /EVENT-01 / Частичное исполнение — проверка |
| [620:18529](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=620-18529) | EVENT-01 / Нехватка — свой минимум / пример 1.67 | 390×844 | /EVENT-01 / Частичное исполнение — проверка |
| [620:19123](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=620-19123) | EVENT-01 / Уменьшено до доступных 9700 TON | 390×844 | /EVENT-01 / Частичное исполнение — проверка |
| [620:19722](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=620-19722) | EVENT-01 / Ожидающий остаток отменён | 390×844 | /EVENT-01 / Частичное исполнение — проверка |
| [500:2837](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-2837) | GUARANTOR-PICK-01 · Выбор гаранта · Полная прокрутка | 390×798 | /GUARANTOR-PICK-01 · Сравнение с оригиналом |
| [500:2978](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-2978) | GUARANTOR-01 · Частное пари · Согласование свёрнуто · Полное полотно | 390×961 | /GUARANTOR-01 · Единая страница · Согласование внутри |
| [500:3081](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-3081) | GUARANTOR-01 · Частное пари · Согласование / Чат · Полное полотно | 390×1581 | /GUARANTOR-01 · Единая страница · Согласование внутри |
| [500:3158](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-3158) | GUARANTOR-01 · Частное пари · Согласование / Условия · Полное полотно | 390×1597 | /GUARANTOR-01 · Единая страница · Согласование внутри |
| [500:3249](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=500-3249) | GUARANTOR-01 · Частное пари · Согласование / История · Полное полотно | 390×1531 | /GUARANTOR-01 · Единая страница · Согласование внутри |
| [720:27261](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=720-27261) | CREATE-01 · Создание события | 390×844 | /CREATE-01 · Создание события · 390 / 320 / 430 |
| [720:27345](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=720-27345) | CREATE-01 · Создание события · QA 320 | 320×844 | /CREATE-01 · Создание события · 390 / 320 / 430 |
| [720:27429](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=720-27429) | CREATE-01 · Создание события · QA 430 | 430×844 | /CREATE-01 · Создание события · 390 / 320 / 430 |
| [728:22341](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=728-22341) | CREATE-02 · Ввод / Частное с гарантом · 320 | 320×844 | /CREATE-02 · Вопрос и исходы · Основной / QA / Ввод |
| [728:22265](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=728-22265) | CREATE-02 · QA 320 | 320×844 | /CREATE · Публичное событие · V3 / основной поток |
| [728:22303](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=728-22303) | CREATE-02 · QA 430 | 430×844 | /CREATE · Публичное событие · V3 / основной поток |
| [737:22410](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=737-22410) | CREATE-03 · Публичное · Условия и сроки · QA 320 | 320×850 | /CREATE · Публичное событие · V3 / основной поток |
| [737:22464](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=737-22464) | CREATE-03 · Публичное · Условия и сроки · QA 430 | 430×844 | /CREATE · Публичное событие · V3 / основной поток |
| [737:22564](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=737-22564) | CREATE-04 · Публичное · Проверка · QA 320 | 320×844 | /CREATE · Публичное событие · V3 / основной поток |
| [737:22610](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=737-22610) | CREATE-04 · Публичное · Проверка · QA 430 | 430×844 | /CREATE · Публичное событие · V3 / основной поток |
| [737:22680](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=737-22680) | CREATE-03 · Публичное · Условия и сроки · Полное содержимое · Viewport 390×844 | 390×844 | /CREATE · Публичное событие · V3 / основной поток |
| [738:23116](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=738-23116) | CREATE-02 · Категория · 390 | 390×844 | /CREATE · Публичное событие · V3 / основной поток |
| [738:23177](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=738-23177) | CREATE-02 · Категория · 320 | 320×844 | /CREATE · Публичное событие · V3 / основной поток |
| [738:23238](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=738-23238) | CREATE-03 · Календарь · 390 | 390×844 | /CREATE · Публичное событие · V3 / основной поток |
| [738:23366](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=738-23366) | CREATE-03 · Календарь · 320 | 320×844 | /CREATE · Публичное событие · V3 / основной поток |
| [738:23494](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=738-23494) | CREATE-02 · Публичное · Ввод / 320 | 320×844 | /CREATE · Публичное событие · V3 / основной поток |
| [740:22661](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=740-22661) | Публичное событие · Основной путь · 390 px | 1672×890 | /CREATE · Публичное событие · V3 / основной поток |
| [744:23054](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23054) | CREATE-02 · Частное без гаранта · Вопрос и исходы · QA 320 | 320×844 | /CREATE · Частное без гаранта · V3 |
| [744:23097](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23097) | CREATE-03 · Частное без гаранта · Условия пари · QA 320 | 320×844 | /CREATE · Частное без гаранта · V3 |
| [744:23183](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23183) | CREATE-04 · Частное без гаранта · Проверка · QA 320 | 320×844 | /CREATE · Частное без гаранта · V3 |
| [744:23238](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23238) | CREATE-04 · Частное без гаранта · Событие создано · QA 320 | 320×844 | /CREATE · Частное без гаранта · V3 |
| [744:23265](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23265) | CREATE-02 · Частное без гаранта · Вопрос и исходы · QA 430 | 430×844 | /CREATE · Частное без гаранта · V3 |
| [744:23308](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23308) | CREATE-03 · Частное без гаранта · Условия пари · QA 430 | 430×844 | /CREATE · Частное без гаранта · V3 |
| [744:23394](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23394) | CREATE-04 · Частное без гаранта · Проверка · QA 430 | 430×844 | /CREATE · Частное без гаранта · V3 |
| [744:23449](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23449) | CREATE-04 · Частное без гаранта · Событие создано · QA 430 | 430×844 | /CREATE · Частное без гаранта · V3 |
| [744:23476](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23476) | CREATE · Частное без гаранта · Пригласить участников | 390×844 | /CREATE · Частное без гаранта · V3 |
| [744:23528](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23528) | CREATE · Частное без гаранта · Ссылка скопирована | 390×844 | /CREATE · Частное без гаранта · V3 |
| [744:23556](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23556) | CREATE-02 · Частное без гаранта · Ввод / 320 | 320×844 | /CREATE · Частное без гаранта · V3 |
| [744:23677](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23677) | CREATE · Приглашение участников · QA 320 | 320×844 | /CREATE · Частное без гаранта · V3 |
| [744:22843](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-22843) | CREATE-02 · Частное без гаранта · Вопрос и исходы | 390×844 | /CREATE · Частное без гаранта · V3/Частное без гаранта · Основной путь · 390 px |
| [744:22886](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-22886) | CREATE-03 · Частное без гаранта · Условия пари | 390×844 | /CREATE · Частное без гаранта · V3/Частное без гаранта · Основной путь · 390 px |
| [744:22972](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-22972) | CREATE-04 · Частное без гаранта · Проверка | 390×844 | /CREATE · Частное без гаранта · V3/Частное без гаранта · Основной путь · 390 px |
| [744:23027](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=744-23027) | CREATE-04 · Частное без гаранта · Событие создано | 390×844 | /CREATE · Частное без гаранта · V3/Частное без гаранта · Основной путь · 390 px |
| [747:22918](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=747-22918) | CREATE · Ссылка скопирована · QA 320 | 320×844 | /CREATE · Частное без гаранта · V3 |
| [747:22941](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=747-22941) | CREATE · Пригласить участников · QA 430 | 430×844 | /CREATE · Частное без гаранта · V3 |
| [747:22955](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=747-22955) | CREATE · Ссылка скопирована · QA 430 | 430×844 | /CREATE · Частное без гаранта · V3 |
| [750:22946](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-22946) | CREATE-02 · Частное с гарантом · Вопрос и исходы | 390×844 | /CREATE · Частное с гарантом · V3/Частное с гарантом · Основные состояния · 390 px |
| [750:22992](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-22992) | CREATE-03 · Частное с гарантом · Условия и сроки · Полное содержимое | 390×1058 | /CREATE · Частное с гарантом · V3/Частное с гарантом · Основные состояния · 390 px |
| [750:23049](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-23049) | CREATE-04 · Частное с гарантом · Проверка | 390×844 | /CREATE · Частное с гарантом · V3/Частное с гарантом · Основные состояния · 390 px |
| [750:23876](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-23876) | CREATE · Гарант · Принял приглашение | 390×844 | /CREATE · Частное с гарантом · V3/Частное с гарантом · Основные состояния · 390 px |
| [750:24027](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-24027) | CREATE · Гарант · Отклонил приглашение | 390×844 | /CREATE · Частное с гарантом · V3/Частное с гарантом · Основные состояния · 390 px |
| [751:23338](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=751-23338) | CREATE · Пригласить гаранта? | 390×844 | /CREATE · Частное с гарантом · V3/Частное с гарантом · Основные состояния · 390 px |
| [751:23546](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=751-23546) | CREATE · Приглашение отправлено | 390×844 | /CREATE · Частное с гарантом · V3/Частное с гарантом · Основные состояния · 390 px |
| [752:24356](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=752-24356) | CREATE · Частное с гарантом · Ожидаем ответ · Полное содержимое | 390×871 | /CREATE · Частное с гарантом · V3/Частное с гарантом · Основные состояния · 390 px |
| [750:23095](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-23095) | CREATE-02 · Частное с гарантом · Вопрос и исходы · QA 320 | 320×844 | /CREATE · Частное с гарантом · V3 |
| [750:23138](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-23138) | CREATE-03 · Частное с гарантом · Условия и сроки · QA 320 | 320×1058 | /CREATE · Частное с гарантом · V3 |
| [750:23195](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-23195) | CREATE-04 · Частное с гарантом · Проверка · QA 320 | 320×844 | /CREATE · Частное с гарантом · V3 |
| [750:23241](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-23241) | CREATE-02 · Частное с гарантом · Вопрос и исходы · QA 430 | 430×844 | /CREATE · Частное с гарантом · V3 |
| [750:23284](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-23284) | CREATE-03 · Частное с гарантом · Условия и сроки · QA 430 | 430×1058 | /CREATE · Частное с гарантом · V3 |
| [750:23341](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-23341) | CREATE-04 · Частное с гарантом · Проверка · QA 430 | 430×844 | /CREATE · Частное с гарантом · V3 |
| [750:23550](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-23550) | CREATE · Частное с гарантом · Ожидаем ответ · QA 320 | 320×844 | /CREATE · Частное с гарантом · V3 |
| [750:23713](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-23713) | CREATE · Частное с гарантом · Ожидаем ответ · QA 430 | 430×844 | /CREATE · Частное с гарантом · V3 |
| [750:24178](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-24178) | CREATE-03 · Частное с гарантом · Viewport 390×844 | 390×844 | /CREATE · Частное с гарантом · V3 |
| [751:23745](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=751-23745) | CREATE · Пригласить гаранта? · QA 320 | 320×844 | /CREATE · Частное с гарантом · V3 |
| [751:23957](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=751-23957) | CREATE · Приглашение отправлено · QA 320 | 320×844 | /CREATE · Частное с гарантом · V3 |
| [751:24160](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=751-24160) | CREATE · Пригласить гаранта? · QA 430 | 430×844 | /CREATE · Частное с гарантом · V3 |
| [751:24368](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=751-24368) | CREATE · Приглашение отправлено · QA 430 | 430×844 | /CREATE · Частное с гарантом · V3 |
| [751:24567](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=751-24567) | CREATE-03 · Предполагаемое завершение · Календарь 390 | 390×844 | /CREATE · Частное с гарантом · V3 |
| [751:24721](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=751-24721) | CREATE-03 · Предполагаемое завершение · Календарь 320 | 320×844 | /CREATE · Частное с гарантом · V3 |
| [751:24875](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=751-24875) | CREATE-02 · Частное с гарантом · Ввод / 320 | 320×844 | /CREATE · Частное с гарантом · V3 |
| [752:24504](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=752-24504) | CREATE · Частное с гарантом · Ожидаем ответ · QA 320 · Полное содержимое | 320×977 | /CREATE · Частное с гарантом · V3 |
| [753:24318](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=753-24318) | CREATE · Гарант · Приглашение принято · QA 320 | 320×844 | /CREATE · Частное с гарантом · V3 |
| [753:24470](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=753-24470) | CREATE · Гарант · Отказ · QA 320 | 320×844 | /CREATE · Частное с гарантом · V3 |
| [753:24622](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=753-24622) | CREATE · Гарант · Приглашение принято · QA 430 | 430×844 | /CREATE · Частное с гарантом · V3 |
| [753:24774](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=753-24774) | CREATE · Гарант · Отказ · QA 430 | 430×844 | /CREATE · Частное с гарантом · V3 |
| [750:23387](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=750-23387) | CREATE · Частное с гарантом · Ожидаем ответ | 390×844 | /CREATE · Частное с гарантом · V3 |
| [757:24496](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=757-24496) | CREATE-03 · Предполагаемое завершение · Календарь 430 | 430×844 | /CREATE · Частное с гарантом · V3 |
| [757:24660](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=757-24660) | CREATE-03 · Начало события · Календарь 390 | 390×844 | /CREATE · Частное с гарантом · V3 |
| [757:24898](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=757-24898) | CREATE-03 · Начало события · Календарь 320 | 320×844 | /CREATE · Частное с гарантом · V3 |
| [757:25144](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=757-25144) | CREATE-03 · Начало события · Календарь 430 | 430×844 | /CREATE · Частное с гарантом · V3 |
| [728:22227](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=728-22227) | CREATE-02 · Вопрос и исходы | 390×844 | /CREATE · Публичное событие · V3 / основной поток/Публичное событие · Основной путь · 390 px |
| [737:22356](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=737-22356) | CREATE-03 · Публичное · Условия и сроки · Полное содержимое | 390×850 | /CREATE · Публичное событие · V3 / основной поток/Публичное событие · Основной путь · 390 px |
| [737:22518](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=737-22518) | CREATE-04 · Публичное · Проверка | 390×844 | /CREATE · Публичное событие · V3 / основной поток/Публичное событие · Основной путь · 390 px |
| [737:22656](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=737-22656) | CREATE-04 · Публичное · Заявка на модерации | 390×844 | /CREATE · Публичное событие · V3 / основной поток/Публичное событие · Основной путь · 390 px |

### BETTON — COMPONENTS · [479:3](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=479-3)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [497:27](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=497-27) | BetTON V1 / Foundations and states | 1120×1632 |  |

### BETTON — REFERENCES · [479:4](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=479-4)

| Node ID | Название | Размер | Контекст |
|---|---|---|---|
| [479:59](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=479-59) | ПРИНЯТА · Главная | 390×739 |  |
| [479:62](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=479-62) | ПРИНЯТА · 2 части = одна страница | 390×631 |  |
| [479:65](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=479-65) | ПРИНЯТА · исправить метрики и вкладки | 390×739 |  |
| [479:68](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=479-68) | ПРИНЯТА · «Условия» → «О себе» | 390×739 |  |
| [479:71](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=479-71) | ПРИНЯТА · левое меню | 390×631 |  |
| [479:74](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=479-74) | ТОЛЬКО компактная шапка | 390×739 |  |
| [479:77](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=479-77) | ПРИНЯТА · основа частного пари | 390×739 |  |
| [479:80](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA?node-id=479-80) | ОТКЛОНЕНО · не копировать 2 колонки | 390×739 |  |

### Исходные изображения, а не редактируемые макеты

МАКЕТЫ ГЕНЕРАЦИИ `662:2`: v1 PNG в слоях `662:3`–`662:12`; новые CREATE V3 в `731:2`–`731:7`. Эти изображения — исходные референсы, а не функциональные экраны. На REFERENCES `479:4` есть подписанные обзорные контейнеры; источники оригинальных байтов — Library и их MANIFEST. Профильные исходники находятся в отдельной папке Library и в приложенном комплекте не заменяются четвёртой концепцией.
