// Frozen visual fixtures, not executable quotes or account state.
export type Market = {
  id: string
  category: string
  creator?: string
  question: string
  detailQuestion: string
  context: string
  meta: string
  probability: number
  movement: string
  trend: 'up' | 'down' | 'none'
  liquidity: string
  volume: string
  close: string
  criteria: string
}

export const MARKETS: Market[] = [
  {
    id: 'ton', category: 'КРИПТО', creator: '@northstar',
    question: 'TON войдёт в топ‑5 криптовалют до конца 2026?',
    detailQuestion: 'TON войдёт в топ-5 криптовалют до конца 2026?',
    context: '@northstar · Крипто · до 31 дек 2026',
    meta: 'Ликвидность 184 TON · объём 1 240 TON · до 31 дек',
    probability: 67, movement: '+3,2 п.п.', trend: 'up',
    liquidity: '184 TON', volume: '1 240 TON', close: '31 дек',
    criteria: 'CoinMarketCap: TON занимает позицию 1–5 по капитализации на 31.12.2026, 23:59 UTC.',
  },
  {
    id: 'macro', category: 'МАКРО',
    question: 'Ключевая ставка будет ниже 12% в декабре?',
    detailQuestion: 'Ключевая ставка будет ниже 12% в декабре?',
    context: 'Макро · до 20 дек 2026',
    meta: 'Ликвидность 96 TON · объём 535 TON · до 20 дек',
    probability: 71, movement: '▲ 4%', trend: 'up',
    liquidity: '96 TON', volume: '535 TON', close: '20 дек',
    criteria: 'Демонстрационный рынок. Критерии этого рынка не включены в UI pilot.',
  },
  {
    id: 'ai', category: 'ТЕХНОЛОГИИ',
    question: 'OpenAI выпустит GPT‑6 до мая 2027?',
    detailQuestion: 'OpenAI выпустит GPT‑6 до мая 2027?',
    context: '@signal · Технологии · до 1 мая 2027',
    meta: 'Ликвидность 51 TON · @signal · до 1 мая',
    probability: 18, movement: '▼ 2%', trend: 'down',
    liquidity: '51 TON', volume: '—', close: '1 мая',
    criteria: 'Демонстрационный рынок. Критерии этого рынка не включены в UI pilot.',
  },
  {
    id: 'album', category: 'КУЛЬТУРА',
    question: 'Новый альбом выйдет до пятницы?',
    detailQuestion: 'Новый альбом выйдет до пятницы?',
    context: 'Культура · закрытие через 6ч',
    meta: 'Ликвидность 22 TON · закрытие через 6ч',
    probability: 42, movement: '—', trend: 'none',
    liquidity: '22 TON', volume: '—', close: 'через 6ч',
    criteria: 'Демонстрационный рынок. Критерии этого рынка не включены в UI pilot.',
  },
]

export const TRADE_DETAILS = [
  ['Вероятность по сделкам', '67%'],
  ['Доступно в стакане', '184 TON'],
  ['Средний коэффициент', '1,49×'],
  ['Худший коэффициент', '1,48×'],
  ['Исполнится сейчас', '25,00 TON'],
  ['Выплата до комиссии', '37,25 TON'],
] as const

export const SCREENS = ['markets', 'detail', 'quick', 'portfolio', 'create', 'notifications', 'profile'] as const
export type Screen = typeof SCREENS[number]
