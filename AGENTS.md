# BetTON agent context

Короткий рабочий контекст. Не заменяет продуктовую библию и не дублирует её.

## Источники

1. Продуктовый source of truth: `docs/BETTON_BIBLE.md`
2. Технический handoff: `docs/HANDOFF.md`

Продуктовые решения брать из библии. Где лежит код, как устроены API и как запускать preview — из handoff.

## Приоритет

1. Безопасность денег, auth и settlement.
2. Подтверждённые продуктовые решения из `docs/BETTON_BIBLE.md` (статус CONFIRMED).
3. UX и дизайн.
4. Локальные косметические улучшения.

UI не имеет права переписывать механику ради внешнего вида.

## Жёсткие границы

- Не менять P2P money, matching, settlement, fees, auth и unlisted rules ради UI.
- Не менять production DB.
- Не merge PR #15 без явного разрешения.
- Не deploy production без явного разрешения.
- Рабочая ветка: `feature/react-full-preview`. Это Draft PR #15, не `main` и не production.
- Текущий визуал не финальный. Нынешний React-стиль и первые Figma-основы — черновик, не утверждённая арт-дирекция.

Backend остаётся источником истины для денег, matching, settlement, комиссий и доступа. Frontend вызывает контракты, а не пересчитывает их сам.

## Дизайн

- `design-taste-frontend` — поиск арт-дирекции и работа с референсами: design read, DNA референсов, три разных направления для Feed, Market Detail и Trade.
- Impeccable — critique, audit и polish уже выбранного интерфейса.
- Не запускать `/impeccable init` автоматически.
- Не создавать второй `PRODUCT.md` вместо `docs/BETTON_BIBLE.md`. Если skill просит PRODUCT.md, читать библию.
- Figma — точный визуальный spec после выбора арт-дирекции: размеры, токены, состояния. Figma не заменяет проверку живого Mini App.
- Экран не готов, пока не проверен реальный React/Telegram результат.

Стек preview уже есть: React, TypeScript, Vite, CSS Modules. Не подменять его дефолтным стеком skill (Next.js, Tailwind, новая библиотека компонентов).

Установленный hook `.cursor/hooks.json` оставить. Срабатывание детектора не повод менять денежную логику и не повод запускать init.

## BetTON subagents

Один subagent не забирает чужую стадию. Результат передаётся следующему.

- Product question / change → `betton-product-guardian`
- Reference research / art direction / Figma concept → `betton-art-director`
- Approved design → React → `betton-ui-engineer`
- Figma ↔ React comparison / final polish → `betton-visual-qa`

Роли и запреты лежат в `.cursor/agents/`. Здесь их не дублировать.

## Design → code

Один экран за раз:

1. Зафиксировать viewport, fixture, тему, локаль и состояние.
2. Зафиксировать один Figma-фрейм этого состояния.
3. Брать exact Figma measurements, не угадывать по скриншоту.
4. Снять screenshot React-экрана и сравнить с Figma.
5. Исправлять до визуального совпадения. «Почти так» не считается готовым.
6. Только потом переходить к следующему экрану.

Порядок правок и критерий приёмки: `docs/BETTON_BIBLE.md`, раздел 6.

## Новые решения

Важное продуктовое решение:

1. Обновить нужный раздел `docs/BETTON_BIBLE.md`.
2. Пометить CONFIRMED, EXPERIMENT или OPEN.
3. Добавить короткую запись в Decision log.

Решение, которое осталось только в чате, считается незафиксированным.

## Не трогать

Пока не просят, не удалять и не изменять локальные untracked QA и скрипты: `.agents/`, `.cursor/`, `skills-lock.json`, `frontend/qa-pass11/`, локальные launcher/fix-скрипты в корне и `bot/main.py.before-v2-start-fix.bak`.
