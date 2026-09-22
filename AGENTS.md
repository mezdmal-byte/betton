# BetTON agent context

Короткий рабочий контекст. Не заменяет продуктовую библию и не дублирует её.

## Источники

1. Продуктовый source of truth: `docs/BETTON_BIBLE.md`
2. Технический handoff: `docs/HANDOFF.md`
3. Design process: `docs/design/DESIGN_PIPELINE.md`
4. Impeccable adapter context: `PRODUCT.md` + `DESIGN.md`

Продуктовые решения брать из библии. Где лежит код, как устроены API и как запускать preview — из handoff. `PRODUCT.md` и `DESIGN.md` существуют как адаптеры для design skills и не имеют права переопределять библию.

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
- Текущий React visual style не финальный.
- Figma sprint Tape / Issue / Instrument от 2026-09-22 — отвергнутый exploration, не направление для продолжения и не источник визуальной истины.

Backend остаётся источником истины для денег, matching, settlement, комиссий и доступа. Frontend вызывает контракты, а не пересчитывает их сам.

## Дизайн

BetTON — product UI. Для ключевых рабочих экранов режим Impeccable = **Operate**: scanability, consistency, native expectations and real usage outrank decorative expression.

Роли skills:

- `design-taste-frontend` — вспомогательный reference/anti-slop skill. Использовать для design read, разбора конкретных референсов, типографики и борьбы с LLM-defaults. **Не использовать как основной архитектор multi-step product UI** и не переносить его default stack в BetTON.
- **Impeccable** — основной design/redesign skill для product UI. В начале design-сессии запускать его `context` один раз. Для нового visual world читать `reference/new-work.md`; перед UI-edit читать `reference/craft-floor.md`. Использовать его реальные режимы (`shape`, `critique`, `bolder`, `typeset`, `layout`, `delight`, `polish`) по назначению, а не заменять их одним self-review.
- `emil-design-eng` — interaction/component/motion craft: responsive press states, easing, sheets, gestures, perceived quality, reduced motion.
- `prototype` (Emil Kowalski) — основной инструмент divergence. Один high-leverage surface за запуск, 3 действительно разных варианта в изолированном live prototype с picker. Production code во время exploration не менять.
- Figma — фиксация **выбранного** visual direction: exact measurements, tokens, states and handoff. Не использовать Figma как место, где модель впервые придумывает девять экранов из текстового research.
- Browser / screenshots / Playwright — глаза design loop. Дизайн нельзя принимать только по текстовому описанию агента.

Стек production preview уже есть: React, TypeScript, Vite, CSS Modules. Не подменять его дефолтным стеком skill (Next.js, Tailwind, новая библиотека компонентов).

Установленный hook `.cursor/hooks.json` оставить. Срабатывание детектора не повод менять денежную логику.

## Design exploration protocol

До выбора визуального направления:

1. Product Guardian фиксирует product constraints для **одной** поверхности.
2. Art Director собирает небольшой board из конкретных визуальных референсов/screenshots и выписывает применимый DNA. Названий брендов без визуального доказательства недостаточно.
3. `prototype` создаёт 3 полноразмерных, интерактивных варианта одной поверхности в изолированном route/harness; не side-by-side thumbnails.
4. Impeccable делает bounded visual pass: inspect screenshot → один пакет исправлений → максимум один confirm pass.
5. Emil design engineering проверяет interaction/motion детали там, где они реально нужны.
6. Human выбирает направление. До этого не расширять его на Detail/Trade/весь продукт.
7. Выбранный вариант фиксируется в Figma и только затем идёт в production React.

Не создавать снова 9 экранов до выбора сильного Feed.

## BetTON subagents

Один subagent не забирает чужую стадию. Результат передаётся следующему.

- Product question / constraints → `betton-product-guardian`
- References / design direction / prototype exploration → `betton-art-director`
- Approved design → production React → `betton-ui-engineer`
- Figma ↔ React comparison / final visual QA → `betton-visual-qa`

`betton-art-director` обязан использовать design skills по правилам выше; его собственный текстовый self-review не заменяет Impeccable/browser verification.

Роли и запреты лежат в `.cursor/agents/`.

## Design → code

После human selection — один production screen за раз:

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

Пока не просят, не удалять и не изменять локальные untracked QA и скрипты: `frontend/qa-pass11/`, локальные launcher/fix-скрипты в корне и `bot/main.py.before-v2-start-fix.bak`.

Project design skills under `.agents/` and `.cursor/` are part of the harness and may be changed only by an explicit harness/design-skill task.
