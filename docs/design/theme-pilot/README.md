# BetTON — Figma theme pilot

Изолированный React UI pilot для визуальной проверки **Dark A** и
**Light C — Porcelain & Cobalt**. Четыре экрана, общие компоненты,
фиксированные демонстрационные данные. Это не production implementation.

Ветка: `feature/figma-theme-pilot`.
Основание: `feature/react-full-preview` на commit
`3b6bbe2d0a0dba5d786d37f93f11caf2fd3015c2`.

## Запуск

Из корня отдельного checkout репозитория:

```bash
git switch feature/figma-theme-pilot
cd frontend
npm ci
npm run dev:theme-pilot
```

Открыть:

- [Dark A](http://localhost:4173/prototypes/figma-theme-pilot.html?theme=dark)
- [Light C](http://localhost:4173/prototypes/figma-theme-pilot.html?theme=light)

Переключатель **Dark / Light** находится в служебной строке сверху.
Переключение меняет semantic tokens и URL без перезагрузки страницы.
Параметр `compare=1` скрывает только служебный переключатель для сравнения
с исходными кадрами. Он не меняет компоненты, контент или размеры экранов.

Прямые состояния: `screen=markets`, `screen=detail`, `screen=quick`,
`screen=portfolio`. Основной fixture: `market=ton`.
Например:
[Light Quick Trade](http://localhost:4173/prototypes/figma-theme-pilot.html?theme=light&screen=quick).

Основной размер: **390 × 844 CSS px**, DPR 1. На широком экране показан
390px preview; на мобильном его ширина следует viewport в пределах 430px.

Сборка pilot отдельно от существующего приложения:

```bash
npm run build:theme-pilot
npm run preview:theme-pilot
```

Собранная версия:
[localhost:4174/prototypes/figma-theme-pilot.html](http://localhost:4174/prototypes/figma-theme-pilot.html).
Результат сборки находится в `frontend/dist-theme-pilot/`.
Обычные `npm run dev` / `npm run build` и существующие preview entry points
сохраняют свои настройки.

## Figma source of truth

Все восемь кадров прочитаны через design context со снимками и измерениями.
Figma не изменялась.

| Экран | Dark A | Light C | Browser screenshots |
| --- | --- | --- | --- |
| Markets | [57:8](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA/Untitled?node-id=57-8) | [57:27](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA/Untitled?node-id=57-27) | [Dark](screenshots/dark-markets.png) · [Light](screenshots/light-markets.png) |
| Market Detail | [58:178](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA/Untitled?node-id=58-178) | [58:217](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA/Untitled?node-id=58-217) | [Dark](screenshots/dark-detail.png) · [Light](screenshots/light-detail.png) |
| Quick Trade | [58:292](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA/Untitled?node-id=58-292) | [58:327](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA/Untitled?node-id=58-327) | [Dark](screenshots/dark-quick.png) · [Light](screenshots/light-quick.png) |
| Portfolio | [58:712](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA/Untitled?node-id=58-712) | [58:743](https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA/Untitled?node-id=58-743) | [Dark](screenshots/dark-portfolio.png) · [Light](screenshots/light-portfolio.png) |

Оригинальные снимки: [figma/](figma/).
Наложения 50% Figma / 50% browser: [comparisons/](comparisons/).
Переключатель в обычном режиме: [developer-toggle.png](screenshots/developer-toggle.png).

## Компоненты и изоляция

`ThemeProvider` управляет `data-theme` на корневом элементе.
Все цвета централизованы в `tokens.css`. Размеры, отступы, контент,
компоненты и логика навигации общие для A/C.

Повторно используются `AppShell`, `TopBar`, `BottomNav`, `MarketRow`,
`ProbabilityDisplay`, `HistoryChart`, `Button`, `SegmentedControl`, `Metric`,
`Card`, `AmountInput`, `ThemeToggle`; утилита `cx` взята из существующего проекта.
Новые компоненты живут только в pilot: их геометрия отличается от прежней
production component system, которую эта задача не меняет.

Работают:

- Markets → рынок → Market Detail;
- основной рынок TON → Купить ДА → Quick Trade → Назад к рынку;
- Markets / Portfolio и переход из позиции в основной рынок;
- Create / Notifications / Profile → `Not included in UI pilot`;
- фильтр «Скоро» на фиксированных данных;
- browser Back, прямые URL, обновление страницы и мгновенная смена темы.

Входной HTML, Vite config и build output независимы. Конфигурация pilot
не содержит API proxy. В коде нет импортов production API, auth, Telegram SDK,
денежных расчётов или записи данных. Новые npm dependencies не добавлялись.

## Проверка

```bash
cd frontend
npx playwright install chromium
npm run check:theme-pilot
```

Освободить порт 4173 перед проверкой: скрипт сам поднимает и останавливает Vite.
При необходимости установленный Chromium можно выбрать через
`PILOT_BROWSER_PATH`. `PILOT_SINGLE_PROCESS=1` предусмотрен только для
ограниченной среды исполнения проверок.

Проверено в Chromium 140.0.7339.16:

- **24 состояния = 4 экрана × 2 темы × 3 ширины (360, 390, 430 px)**,
  высота 844px;
- одинаковая геометрия A/C, отсутствие горизонтального переполнения;
- theme toggle без reload, URL theme, все обязательные переходы;
- три placeholder destination, browser Back / refresh;
- отсутствие ошибок страницы/консоли, API и внешних запросов;
- отдельная сборка pilot и обычная сборка существующего frontend.

Фактические проверки и размеры: [verification.json](verification.json).
Скриншоты сняты при DPR 1 с выключенным LCD subpixel rendering и font hinting,
чтобы сравнение не зависело от Linux-настроек шрифтов.
Просмотрены все восемь пар Figma / React и наложения; исправлены переносы,
шрифт, цвет графика Light C, цвета навигационных и служебных иконок.

[pixel-difference.json](pixel-difference.json) — диагностическая метрика,
не процент «точности». Для каждого RGB-канала считается абсолютная разница;
средняя берётся по всем каналам и пикселям. Вторая метрика — доля пикселей,
у которых хотя бы один канал отличается больше чем на 32 из 255.
Прозрачные углы Figma предварительно накладываются на фон соответствующей темы.
Добавленная кнопка Back и системная строка включены в подсчёт.

## Оставшиеся отличия и ограничения

- В Quick Trade добавлена кнопка **«Назад к рынку»** под основным действием.
  В сравнительных кадрах её нет; она нужна для запрошенного возврата.
- Служебный theme toggle отсутствует в Figma; скрывается через `compare=1`.
- Остались небольшие различия сглаживания, дробного позиционирования букв
  и символов системной строки. Это не заявляется как pixel-perfect результат.
- Плашка «ДА · 67%» шириной **45px** сохранена вместе с обрезанием текста,
  присутствующим в обоих исходных Quick Trade кадрах. Дизайн не исправлялся.
- Сумма `25,00 TON` — readonly fixture; quote не пересчитывается.
  Баланс Quick Trade `142,80 TON` и баланс Portfolio `248.60 TON` сохранены
  из соответствующих исходных кадров. Они не изображают синхронизированный счёт.
- Покупка, NO-flow, подтверждение/успех, Own Price, поиск, расширенные фильтры,
  полный список позиций/ордеров, sharing и остальные экраны не реализованы.
  Неподдерживаемые действия показывают сообщение; «Проверить покупку» явно
  сообщает, что покупка не отправляется.
- Реальные Telegram WebView, iOS Safari, safe-area Telegram SDK,
  авторизация и backend не проверялись и не подключались.

Ничего не merged в main и не deployed. Полная реализация приложения требует
отдельного подтверждения.

## Изменённые файлы

| Путь от корня репозитория | Изменение |
| --- | --- |
| `frontend/package.json` | Четыре отдельные команды pilot; зависимости прежние |
| `frontend/.gitignore` | Игнорирование отдельного build output |
| `frontend/prototypes/figma-theme-pilot.html` | Новый независимый HTML entry |
| `frontend/vite.pilot.config.ts` | Независимые dev/preview/build без API proxy |
| `frontend/tsconfig.pilot.json` | Отдельная проверка TypeScript |
| `frontend/src/prototypes/figma-theme-pilot/main.tsx` | React root |
| `frontend/src/prototypes/figma-theme-pilot/Pilot.tsx` | Четыре экрана и навигация |
| `frontend/src/prototypes/figma-theme-pilot/components.tsx` | Общие компоненты |
| `frontend/src/prototypes/figma-theme-pilot/ThemeProvider.tsx` | Смена темы и URL |
| `frontend/src/prototypes/figma-theme-pilot/fixture.ts` | Фиксированные данные |
| `frontend/src/prototypes/figma-theme-pilot/tokens.css` | Семантические темы A/C |
| `frontend/src/prototypes/figma-theme-pilot/Pilot.module.css` | Общая геометрия и стили |
| `frontend/src/prototypes/figma-theme-pilot/assets/` | 9 оригинальных SVG, 5 WOFF2, лицензия и provenance README |
| `frontend/scripts/check-theme-pilot.mjs` | Воспроизводимая браузерная проверка и capture |
| `docs/design/theme-pilot/` | Этот отчёт, JSON результатов, Figma/browser PNG и наложения |
