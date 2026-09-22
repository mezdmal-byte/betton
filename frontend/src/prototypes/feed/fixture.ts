export type FeedMarket = {
  id: string
  question: string
  probability: number
  volumeTon: number
  availableTon: number
  closeGroup: string
  closeTime: string
  closeOrder: number
  category: string
  creator: string
  trend?: string
}

/** Demo fixture for comparison. Not a backend quote. Amounts are TON, matching the product, not fiat. */
export const FEED_MARKETS: FeedMarket[] = [
  {
    id: 'macro',
    question: 'ЦБ РФ сохранит ключевую ставку на ближайшем заседании?',
    probability: 62,
    volumeTon: 482,
    availableTon: 124,
    closeGroup: '25 окт',
    closeTime: '15:00',
    closeOrder: 3,
    category: 'Макро',
    creator: '@macro_anna',
  },
  {
    id: 'ton',
    question: 'TON выше $8 к концу октября?',
    probability: 41,
    volumeTon: 310,
    availableTon: 89,
    closeGroup: '31 окт',
    closeTime: '23:59',
    closeOrder: 4,
    category: 'Крипто',
    creator: '@ton_watch',
  },
  {
    id: 'dune',
    question: 'Сбор «Дюна 3» в РФ за первую неделю больше 1 млрд ₽?',
    probability: 55,
    volumeTon: 198,
    availableTon: 62,
    closeGroup: '12 ноя',
    closeTime: '12:00',
    closeOrder: 7,
    category: 'Культура',
    creator: '@kino_leo',
  },
  {
    id: 'mayor',
    question: 'Кандидат X победит на выборах мэра демо-города?',
    probability: 71,
    volumeTon: 276,
    availableTon: 91,
    closeGroup: '8 ноя',
    closeTime: '21:00',
    closeOrder: 6,
    category: 'Политика',
    creator: '@polls_ira',
    trend: '+4 п.п. по сделкам (demo fills)',
  },
  {
    id: 'playoff',
    question: 'Команда Y выйдет в плей-офф текущего сезона?',
    probability: 48,
    volumeTon: 143,
    availableTon: 38,
    closeGroup: '20 окт',
    closeTime: '20:00',
    closeOrder: 2,
    category: 'Спорт',
    creator: '@sport_nik',
  },
  {
    id: 'iphone',
    question: 'Новый iPhone выйдет в чёрном матовом корпусе в RU-релизе?',
    probability: 33,
    volumeTon: 94,
    availableTon: 21,
    closeGroup: '5 ноя',
    closeTime: '18:00',
    closeOrder: 5,
    category: 'Техно',
    creator: '@gadgets_m',
  },
  {
    id: 'etf',
    question: 'Приток в Bitcoin ETF за неделю больше $500M?',
    probability: 58,
    volumeTon: 220,
    availableTon: 0,
    closeGroup: '18 окт',
    closeTime: '23:59',
    closeOrder: 1,
    category: 'Крипто',
    creator: '@flow_kate',
  },
]

export const CATEGORIES = ['Все', ...Array.from(new Set(FEED_MARKETS.map((market) => market.category)))]

export function formatTon(value: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(value)} TON`
}

export function liquidityLine(market: FeedMarket): string {
  if (market.availableTon === 0) {
    return `Объём ${formatTon(market.volumeTon)} · нет встречной ликвидности`
  }
  return `Объём ${formatTon(market.volumeTon)} · доступно ${formatTon(market.availableTon)}`
}

export function matchesQuery(market: FeedMarket, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [market.question, market.category, market.creator, market.closeGroup].join(' ').toLowerCase().includes(needle)
}
