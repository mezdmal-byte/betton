# Независимая проверка гарантов — 26.10.2026

Base PR #24: **39074415f80aed64bd4880d183a79e4b2d620bb6**, актуален при начале. Прочитан PR #26 research.md на **2911827fcf2effd12ce9aca2589cfa551e85d621**. Эта ветка меняет только новый pytest-файл и этот отчёт. PR #25/#26, backend, UI/Figma, SIM, Render, production не изменяются.

## Источники и уже существующее покрытие

В закреплённой base редакции изучены `app/services/{guarantors,ux_v3_governance,guarantor_funding,guarantor_rewards,p2p_service,p2p_ledger}.py`, `app/{guarantor_routes,ux_v3_routes,money}.py`, money sections BETTON_BIBLE. [Код PR24](https://github.com/mezdmal-byte/betton/tree/39074415f80aed64bd4880d183a79e4b2d620bb6).

`tests/test_guarantor_funding.py`, `test_guarantor_rewards.py`, `test_guarantors.py`, `test_ux_v3_events.py` уже проверяют четыре тарифа/оба исхода, частичные fills, нескольких победителей, opposing positions/netting, 20%, малые nano/rounding, недостаточный фонд, rollback reward, повторную выплату/две concurrent decisions, privacy/revocation, expiry/refunds. Эти сценарии не переписаны; включены в целевую регрессию.

## G1 — подтверждённый дефект старого приглашения

**P1, высокая уверенность. Workflow/replay defect, не доказана потеря денег или обход личности.**

`guarantors.transition`, ветки acknowledge/decline, не сверяют req.revision. `ux_v3_governance.transition_v3 invite` увеличивает revision.

Реальный HTTP reproducer: создать case → acknowledge r1 → decline r1 → снова пригласить **того же** гаранта (r2) → доставить старый acknowledge/decline r1. Ответ **200**, новое приглашение меняется на review/needs_guarantor. `test_known_defect_stale_invitation_action_mutates_new_invitation` параметризован двумя действиями. Snapshot подтверждает отсутствие изменений balance_nano/pot/reserves/journal/settlements, но изменение workflow.

**Passing этого теста подтверждает наличие дефекта**, а не выполнение требования безопасности. Тест честно утверждает наблюдаемое неправильное поведение. Нет skip/xfail. После исправления заменить ожидание на 409/no mutation; старый characterization должен перестать проходить.

Минимальный план (НЕ реализован): обязательная версия/поколение приглашения для acknowledge/decline, проверка под market lock до изменений; проверить также extend. Согласовать старых клиентов, не подставлять новую версию в отложенный клик. Если нужен replay результата, scoped operation receipt вместо нового действия. Файлы: CaseAction в guarantor_routes.py, transition в guarantors.py, API callers. Новая persisted таблица потребует миграции только при выборе receipt/generation модели. Не менять денежные записи. Acceptance: старый r1 после same/different guarantor reinvite отклонён, текущий r2 работает, concurrent timeout/reinvite не теряет новое назначение.

## G2 — ошибка HTTP может сопровождаться законным возвратом

**Подтверждённый контракт, важное условие UI; не классифицирован как бухгалтерский дефект.**

transition вызывает expire до действия. На точной границе ends_at+24h expiry коммитит отмену/возвраты; поздний propose отвечает 409. Поэтому «409 значит ничего не изменилось» неверно.

Новый boundary test проверяет ends_at−1µs (409/no change), ends_at и +24h−1µs (settlement), ровно +24h (409, cancelled, pot=0, без tip/reward, journal fully_verified). Повтор позднего запроса не меняет полный snapshot. Первоначальное предположение об отсутствии изменений на любом 409 отвергнуто тестом/кодом; это не объявлено дефектом ради отчёта.

Codex должен refetch case/account/orders/history после ошибки или неизвестного ответа и показывать фактическую отмену. Не считать отсутствие HTTP success доказательством отсутствия финансовой операции.

## Новые тесты и результаты

`tests/test_guarantor_security_followup.py`: **22 case**:

- 6 invalid reward: NaN, Infinity, negative, subnano, percent>100, лишняя точность процента; нет изменения версии/денег;
- 1 concurrent counteroffer: один 200/один409, одна новая версия, одна подпись; stale confirm не меняет snapshot;
- 4 точные границы decision window с реальными P2P исполнениями;
- 4 nonassigned actor actions с действительной private share-ссылкой;
- 1 outsider с private link не читает и не пишет negotiation;
- 2 reproducer G1 (observed defect, НЕ security pass);
- 2 запрета смены тарифа после accept;
- 2 запрета отмены creator/bettor в действительном decision window.

Snapshot включает все user balances, market status/pot, case state/revision/creator confirmation/reward, orders/reserves, counts journal/settlements. Используется существующий conftest с новой temp SQLite; PG — отдельный локальный CI PostgreSQL16 container. Никакой существующей финансовой базы.

Целевой локальный запуск нового файла + четырёх прежних suites: **88 passed**, включая **20 новых контрактных проверок и 2 воспроизведения дефекта**. Полный pytest и PG16 CI: актуальные результаты/точный HEAD опубликованы в описании отдельного PR. До фактического PG выполнения SQLite не подтверждает PG locks. Не запускали новое большое исследование UI или production.

## Карта прототипа #26 к backend

Все HTTP требуют Telegram tma auth. Private access — viewer/share policy сервера. Demo-role не является авторизацией. Prefix `case` ниже = `/markets/{mid}/guarantor`.

| Действие | Реальный API | Права / состояние | Ошибки → результат |
|---|---|---|---|
| Создать | POST /ux-v3/events event_type=guarantor, request_id | Автор; полный EventInput, одобренный доступный гарант | 401/422/409; invited. В #26 форма сокращена |
| Выбрать профиль | GET /guarantors | Auth | Реальные profile/availability, не synthetic список #26 |
| Первое приглашение | Внутри create | Создатель | Не второй POST после создания |
| Заменить гаранта | POST case action=invite,guarantor_id | Автор, needs_guarantor | 403/409; invited/new revision/reward cleared |
| Отклик | POST case acknowledge | Назначенный гарант, invited | review, deadline +5min; G1 stale не блокируется |
| Отказ | POST case decline | Назначенный гарант, invited/review | needs_guarantor; G1 |
| Встречный тариф | POST /ux-v3/events/{mid}/reward action=propose,expected_revision,mode,fixed_ton,percent | Автор/гарант, review | 403/409/422; revision++, creator confirmation reset, accepted_by=[actor] |
| Принять тариф | тот же reward action=accept | Автор/гарант, текущая версия | Добавляет signer, НЕ открывает пари |
| Изменить правила | PUT /ux-v3/events/{mid}/terms expected_revision,event | Только автор, review, тот же гарант | revision++, reward cleared; старые подтверждения недействительны |
| Подтвердить автором | POST case confirm,revision | Только автор, review | 403/409; creator_confirmed current, reward signer added |
| Принять пари гарантом | POST case accept,revision | Назначенный approved гарант, автор подтвердил ту же версию | 403/409; reward-engine → collecting, НЕ автоматически secured |
| Написать | POST case message,text | Только автор/гарант UX v3 | 403/422/429; сообщение не равно подписи; нет обещания exactly-once chat |
| Читать | GET case | Private access; messages только parties | 401/403/404; share link не раскрывает переговоры |
| Продлить | POST case extend | Автор/гарант, review | Только после второго согласия +5min; stale extend требует отдельного теста |
| Сформировать обеспечение | POST /markets/{mid}/orders + consent/request_id; GET case | Допущенные участники, гарант не ставит | Реальные fills обоих исходов → active; Demo-кнопки #26 API не имеют |
| Частичное исполнение | Те же orders/owned orders/book | Обычный P2P | Остаток в резерве; quote не гарантирует исполнение |
| Завершить событие | Серверные ends_at/clock | Не клиентская команда | Demo «событие завершилось» не API |
| Решить | POST case propose,revision,outcome,text | Только гарант active; ends_at ≤ now < ends_at+24h | 403/409/422; сразу settled/settlement. Legacy dispute не переносить в UX v3 |
| Отменить | POST case cancel,revision,text | Назначенный approved гарант после события в пределах24h, причина | 403/409/422; refunds, без reward. Автор не получает это право |
| Истёк срок | Внутренний process_due/expire | Worker/сервер | Недостаточный фонд к close_at / нет решения за24h → cancelled; нет API «истечь сейчас» |
| Выплаты / возвраты | Внутри settle/void; GET /users/{uid}/settlements, account/orders | Владелец истории | Не отдельная клиентская выплата. 194 TON #26 — фиксированный пример, не quote |
| Неизвестный ответ | Refetch case/terms/revisions; owned lookup для order request_id | Текущая auth | Не создавать новый key; универсального receipt lookup для invitation actions нет |
| Stale условия | GET /ux-v3/events/{mid}/terms и /revisions | Private access | Показать новую редакцию, не auto-confirm; G2 — refetch даже на409 |

## Что передать Codex и что осталось

1. **P1:** G1 требует отдельно согласованного server/API fix; до него не обещать безопасный replay приглашения.
2. **P1:** карту API, G2 refetch semantics, различение tariff accept/creator confirm/guarantor accept/collecting/active можно передать для интеграции UI сейчас. Не подключать demo controllers к деньгам.
3. **P2:** отдельные проверки ack-vs-reinvite/invite-vs-timeout, stale extend, duplicate-chat semantics, полная матрица межкомандных гонок. Existing settlement/worker races не доказывают их автоматически.
4. Не проверены production, исторические данные, настоящий Telegram WebView/сеть. Новая проверка не доказывает отсутствие всех денежных дефектов. Серверные исправления не сделаны, merge не выполнен.
