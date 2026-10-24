# React и производительность

Сборка выполнена заново на SHA 1c0f7cb. Данные: evidence/frontend-build.txt и bundle-analysis.json; воспроизведение: `node docs/audit/evidence/inspect-bundle.mjs` из корня после установки frontend dependencies.

| Артефакт | Байты | gzip | Brotli |
|---|---:|---:|---:|
| JavaScript | 706233 | 207954 | 166509 |
| CSS | 136291 | 21235 | 17751 |
| HTML | 489 | 305 | 193 |

Сжатие посчитано node:zlib по содержимому production-артефактов. Это не измерение отдачи Render и не время загрузки телефона. Vite предупреждает о minified JS >500 kB.

## Причина и вклад

ConnectedApp.tsx:1–38 статически импортирует основные экраны. В сборке один JS chunk: создание, модерация, профиль, портфель и онбординг доступны раньше открытия маршрутов. Rollup renderedLength до финальной минификации: react-dom 653699 байт; React 21109; TanStack 126074; lucide 12654; src/screens 250931; src/app 202109; src/i18n 43698. Эти значения НЕ складываются в minified 706233 и не являются сжатыми размерами. Полный список модулей в JSON. График самописный SVG (MarketChart.tsx), большой внешней chart-библиотеки здесь нет.

## План по файлам

| Приоритет | Файл | Изменение после согласования | Проверка эффекта |
|---|---|---|---|
| Желательное | app/ConnectedApp.tsx | lazy imports для создания, модерации, каталога гарантов, профилей и помощи; Suspense + ошибка загрузки chunk | Сравнить стартовый JS и cold/warm переходы; не считать уменьшение entry уменьшением общего JS |
| Желательное | screens/OnboardingScreen.tsx, OnboardingAssets.tsx | Отдельный chunk онбординга; загрузка после проверки флага знакомства | Первое открытие и повторный вход без загрузки иллюстраций |
| Желательное | app/ConnectedApp.tsx:75–96 | Оценить polling двух списков каждые 5 секунд, приостанавливать при скрытом приложении | Network trace и число запросов; одинаковый query key уведомлений уже позволяет общий кеш |
| Желательное | app/ConnectedGuarantors.tsx | Заменить invalidateQueries без фильтра на точные ключи | Сравнить запросы после действия |
| Желательное | app/ConnectedApp.tsx:124–140 | Измерить обход всех DOM-узлов и MutationObserver восстановления скролла | Профиль длинного списка, клавиатура, async обновление и смена вкладки |
| Важное | api/idempotency.ts и connected trade screens | Восстановление неопределённого результата после remount/reload | Потерянный HTTP-ответ, back/reopen, повтор |
| Желательное | vite.config.ts:23–31 | Сверить dev proxy: в перечне нет /ux-v3, /guarantors, /notifications, /chat, /feed | npm dev против backend; production same-origin отдельно |

React Query использует staleTime 15 секунд, retry=false и refetchOnWindowFocus=false. Навигация хранит стеки вкладок в refs; создание сохраняет пользовательский черновик; trade keys и часть форм живут только до unmount. Нельзя утверждать, что все формы/скроллы сохраняются, без E2E.

Не рекомендую менять React, удалять TanStack, повышать warning limit или добавлять memo повсюду. Нет замеров избыточных render на устройстве. Lazy-эксперимент и измерение Web Vitals ещё не выполнены. 156 frontend-тестов прошли; сборка не заменяет проверку интерфейса.
