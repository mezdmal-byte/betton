export type OutcomeSide = 'a' | 'b'

export type MarketStatus = 'open' | 'closing' | 'closed' | 'resolved' | 'cancelled'

export type OutcomeQuoteState =
  | 'default'
  | 'selected'
  | 'pressed'
  | 'disabled'
  | 'loading'
  | 'no-liquidity'
  | 'winner'
  | 'resolved-loser'

export type OutcomeFixture = {
  label: string
  odds: number | null
  liquidityTon: number | null
}

export type CreatorFixture = {
  handle: string
  displayName: string
  initials: string
}

export type MarketFixture = {
  id: string
  category: string
  timeLeft: string
  question: string
  creator: CreatorFixture
  volumeTon: number
  participants: number
  status: MarketStatus
  resolvedSide?: OutcomeSide
  outcomeA: OutcomeFixture
  outcomeB: OutcomeFixture
  description: string
  resolution: string
  closeLabel: string
}

export type OrderBookLevel = {
  odds: number
  availableTon: number
}

export type RecentTrade = {
  odds: number
  amountTon: number
  timeAgo: string
}

export type ChartPoint = {
  t: number
  odds: number
  volume: number
}

export type UserFixture = {
  displayName: string
  handle: string
  initials: string
  availableTon: number
  photoUrl?: string
}
