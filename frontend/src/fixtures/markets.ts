import type {
  ChartPoint,
  MarketFixture,
  OrderBookLevel,
  RecentTrade,
  UserFixture,
} from '../types/market'

export const currentUser: UserFixture = {
  displayName: 'Вася',
  handle: 'vasya',
  initials: 'ВА',
  availableTon: 1240,
}

export const marketYesNo: MarketFixture = {
  id: 'spartak-zenit',
  category: 'Спорт',
  timeLeft: '2 ч',
  question: 'Спартак обыграет Зенит?',
  creator: { handle: 'vasya', displayName: 'Вася', initials: 'ВА' },
  volumeTon: 1800,
  participants: 42,
  status: 'open',
  outcomeA: { label: 'Да', odds: 1.82, liquidityTon: 320 },
  outcomeB: { label: 'Нет', odds: 2.18, liquidityTon: 190 },
  description:
    'Победит команда, забившая больше голов в основное время. Ничья считается исходом «Нет».',
  resolution: 'Резолюция — по официальному протоколу матча РПЛ.',
  closeLabel: 'Закроется через 2 ч',
}

export const marketTeams: MarketFixture = {
  id: 'spartak-cska',
  category: 'Спорт',
  timeLeft: '1 д',
  question: 'Кто выиграет матч?',
  creator: { handle: 'petya', displayName: 'Петя', initials: 'ПЕ' },
  volumeTon: 920,
  participants: 28,
  status: 'open',
  outcomeA: { label: 'Спартак', odds: 1.72, liquidityTon: 540 },
  outcomeB: { label: 'ЦСКА', odds: 2.2, liquidityTon: 380 },
  description: 'Победитель матча в основное время. Овертайм не учитывается.',
  resolution: 'Резолюция — по официальному протоколу.',
  closeLabel: 'Закроется завтра',
}

export const marketAboveBelow: MarketFixture = {
  id: 'btc-100k',
  category: 'Другое',
  timeLeft: '12 д',
  question: 'BTC будет выше $100k?',
  creator: { handle: 'nina', displayName: 'Нина', initials: 'НИ' },
  volumeTon: 640,
  participants: 19,
  status: 'open',
  outcomeA: { label: 'Выше', odds: 1.55, liquidityTon: 210 },
  outcomeB: { label: 'Ниже', odds: 2.8, liquidityTon: 95 },
  description: 'Исход «Выше» — если цена BTC на Binance превышает $100,000 на момент закрытия.',
  resolution: 'Резолюция — по цене BTC/USDT на момент close_at.',
  closeLabel: 'Закроется через 12 д',
}

export const marketLongLabels: MarketFixture = {
  id: 'btc-labels',
  category: 'Другое',
  timeLeft: '18 д',
  question: 'Какая сторона будет у BTC к закрытию рынка?',
  creator: { handle: 'kenji', displayName: 'Kenji', initials: 'KE' },
  volumeTon: 410,
  participants: 11,
  status: 'open',
  outcomeA: { label: 'BTC > $100k', odds: 1.61, liquidityTon: 180 },
  outcomeB: { label: 'BTC ≤ $100k', odds: 2.45, liquidityTon: 70 },
  description: 'Граница включена в исход «BTC ≤ $100k».',
  resolution: 'Резолюция — по цене BTC/USDT на момент close_at.',
  closeLabel: 'Закроется через 18 д',
}

export const marketNoLiquidity: MarketFixture = {
  id: 'rpl-empty',
  category: 'Спорт',
  timeLeft: '3 д',
  question: 'Спартак обыграет Зенит в ближайшем туре РПЛ?',
  creator: { handle: 'ira', displayName: 'Ира', initials: 'ИР' },
  volumeTon: 0,
  participants: 0,
  status: 'open',
  outcomeA: { label: 'Да', odds: null, liquidityTon: null },
  outcomeB: { label: 'Нет', odds: null, liquidityTon: null },
  description: 'Пока нет встречных заявок. Можно выставить свою цену.',
  resolution: 'Резолюция — по официальному протоколу матча РПЛ.',
  closeLabel: 'Закроется через 3 д',
}

export const marketPartialLiquidity: MarketFixture = {
  id: 'partial-cska',
  category: 'Спорт',
  timeLeft: '6 ч',
  question: 'ЦСКА забьёт первой в домашнем матче?',
  creator: { handle: 'masha', displayName: 'Маша', initials: 'МА' },
  volumeTon: 40,
  participants: 3,
  status: 'open',
  outcomeA: { label: 'Да', odds: 1.6, liquidityTon: 40 },
  outcomeB: { label: 'Нет', odds: null, liquidityTon: null },
  description: 'Ликвидность есть только на одной стороне.',
  resolution: 'Резолюция — по первому забитому голу в протоколе.',
  closeLabel: 'Закроется через 6 ч',
}

export const marketLongQuestion: MarketFixture = {
  id: 'long-question',
  category: 'Спорт',
  timeLeft: '4 д',
  question:
    '«Спартак» обыграет «Зенит» в ближайшем туре Российской премьер-лиги, если учитывать только основное время и не учитывать послематчевые пенальти?',
  creator: {
    handle: 'aleksandr.aleksandrovich',
    displayName: 'Александр Александрович',
    initials: 'АА',
  },
  volumeTon: 275,
  participants: 8,
  status: 'open',
  outcomeA: { label: 'Да, в основное время', odds: 1.94, liquidityTon: 110 },
  outcomeB: { label: 'Нет, не обыграет или ничья', odds: 1.88, liquidityTon: 95 },
  description: 'Длинный вопрос и длинные названия исходов — карточка не должна ломаться.',
  resolution: 'Резолюция — по официальному протоколу матча РПЛ.',
  closeLabel: 'Закроется через 4 д',
}

export const marketHighVolume: MarketFixture = {
  id: 'cska-hockey',
  category: 'Спорт',
  timeLeft: '9 ч',
  question: 'ЦСКА в хоккее забросит больше двух шайб?',
  creator: { handle: 'omar', displayName: 'Omar', initials: 'OM' },
  volumeTon: 4050,
  participants: 318,
  status: 'open',
  outcomeA: { label: 'Да', odds: 1.75, liquidityTon: 1500 },
  outcomeB: { label: 'Нет', odds: 2.15, liquidityTon: 980 },
  description: 'Тотал больше двух шайб ЦСКА за матч, включая овертайм.',
  resolution: 'Резолюция — по официальному протоколу КХЛ.',
  closeLabel: 'Закроется через 9 ч',
}

export const marketClosing: MarketFixture = {
  id: 'medvedev-atp',
  category: 'Спорт',
  timeLeft: '14 мин',
  question: 'Медведев выйдет в финал турнира ATP?',
  creator: { handle: 'lin', displayName: 'Lin Wei', initials: 'LW' },
  volumeTon: 860,
  participants: 54,
  status: 'closing',
  outcomeA: { label: 'Да', odds: 1.48, liquidityTon: 220 },
  outcomeB: { label: 'Нет', odds: 2.7, liquidityTon: 160 },
  description: 'Исход определяется по факту выхода в финал заявленного турнира.',
  resolution: 'Резолюция — по сетке ATP.',
  closeLabel: 'Закроется через 14 мин',
}

export const marketResolved: MarketFixture = {
  id: 'rublev-resolved',
  category: 'Спорт',
  timeLeft: 'Итог',
  question: 'Рублёв возьмёт сет у топ-10 соперника?',
  creator: { handle: 'vasya', displayName: 'Вася', initials: 'ВА' },
  volumeTon: 510,
  participants: 22,
  status: 'resolved',
  resolvedSide: 'a',
  outcomeA: { label: 'Да', odds: 1.0, liquidityTon: 0 },
  outcomeB: { label: 'Нет', odds: 0, liquidityTon: 0 },
  description: 'Событие разрешено. Победил исход «Да».',
  resolution: 'Резолюция подтверждена по протоколу матча.',
  closeLabel: 'Завершено',
}

export const marketCancelled: MarketFixture = {
  id: 'mancity-cancelled',
  category: 'Спорт',
  timeLeft: 'Отмена',
  question: 'Манчестер Сити станет чемпионом АПЛ?',
  creator: { handle: 'petya', displayName: 'Петя', initials: 'ПЕ' },
  volumeTon: 0,
  participants: 6,
  status: 'cancelled',
  outcomeA: { label: 'Да', odds: null, liquidityTon: null },
  outcomeB: { label: 'Нет', odds: null, liquidityTon: null },
  description: 'Событие отменено. Средства возвращены без сервисного сбора.',
  resolution: 'Отмена. Возврат ставок и неисполненных заявок.',
  closeLabel: 'Отменено',
}

export const marketPolitics: MarketFixture = {
  id: 'trump-harris',
  category: 'Политика',
  timeLeft: '48 д',
  question: 'Кто станет президентом США?',
  creator: { handle: 'nina', displayName: 'Нина', initials: 'НИ' },
  volumeTon: 2200,
  participants: 96,
  status: 'open',
  outcomeA: { label: 'Trump', odds: 1.45, liquidityTon: 800 },
  outcomeB: { label: 'Harris', odds: 2.9, liquidityTon: 260 },
  description: 'Исход — победитель всеобщих выборов, официально объявленный комиссией.',
  resolution: 'Резолюция — по официальному результату выборов.',
  closeLabel: 'Закроется через 48 д',
}

export const feedMarkets: MarketFixture[] = [
  marketYesNo,
  marketTeams,
  marketAboveBelow,
  marketNoLiquidity,
  marketHighVolume,
  marketLongQuestion,
  marketClosing,
  marketPolitics,
]

export const chartSpartak: ChartPoint[] = [
  { t: 0, odds: 1.7, volume: 40 },
  { t: 1, odds: 1.7, volume: 18 },
  { t: 2, odds: 1.78, volume: 86 },
  { t: 3, odds: 1.78, volume: 24 },
  { t: 4, odds: 1.9, volume: 120 },
  { t: 5, odds: 1.9, volume: 36 },
  { t: 6, odds: 1.85, volume: 64 },
  { t: 7, odds: 1.82, volume: 90 },
]

export const orderBookA: OrderBookLevel[] = [
  { odds: 1.82, availableTon: 320 },
  { odds: 1.9, availableTon: 140 },
  { odds: 2.0, availableTon: 80 },
  { odds: 2.2, availableTon: 40 },
]

export const orderBookB: OrderBookLevel[] = [
  { odds: 2.18, availableTon: 190 },
  { odds: 2.3, availableTon: 90 },
  { odds: 2.5, availableTon: 55 },
  { odds: 2.8, availableTon: 20 },
]

export const recentTrades: RecentTrade[] = [
  { odds: 1.8, amountTon: 50, timeAgo: '2 мин' },
  { odds: 1.85, amountTon: 25, timeAgo: '8 мин' },
  { odds: 1.78, amountTon: 100, timeAgo: '14 мин' },
]
