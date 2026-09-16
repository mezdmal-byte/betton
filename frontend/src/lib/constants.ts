export const FEE_COPY =
  'Сервисный сбор — 1% только с чистой прибыли победителя.'

export const CREATOR_SHARE_COMPACT = 'Вознаграждение автору: 75% сервисного сбора'

export const CREATOR_SHARE_DETAIL =
  'Автор события получает 75% сервисного сбора, начисленного с выигрыша другого пользователя. 25% получает платформа. Общий сервисный сбор для победителя не меняется — 1% от чистой прибыли.'

export const AMOUNT_PRESETS = [10, 50, 100, 500] as const

export const COPY = {
  authExpiredTitle: 'Сессия закончилась',
  authExpiredBody: 'Чтобы безопасно продолжить работу, откройте BetTON заново через Telegram.',
  openInTelegramTitle: 'Откройте BetTON через Telegram',
  openInTelegramBody: 'Публичная лента доступна без входа. Баланс и профиль появятся после открытия через Telegram.',
  historyUnavailable: 'История цены пока недоступна',
  marketsLoadingTitle: 'Загрузка',
  marketsLoadingBody: 'Обновляем данные.',
  marketsEmptyTitle: 'Пока нет событий',
  marketsEmptyBody: 'Попробуйте другой фильтр или загляните позже.',
  marketsErrorTitle: 'Не удалось загрузить',
  marketsErrorBody: 'Проверьте соединение и попробуйте снова.',
  marketNotFoundTitle: 'Событие недоступно',
  marketNotFoundBody: 'Проверьте ссылку или вернитесь к ленте.',
  marketForbiddenTitle: 'Нет доступа',
  marketForbiddenBody: 'Это событие недоступно для просмотра.',
  demoTradeLabel: 'Ставки пока недоступны',
  loadMore: 'Показать ещё',
} as const
