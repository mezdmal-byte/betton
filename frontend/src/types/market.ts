export type OutcomeSide = 'a' | 'b'

export type MarketStatus = 'open' | 'closing' | 'closed' | 'resolved' | 'cancelled' | 'pending' | 'rejected'

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
  id?: number
  handle: string
  displayName: string
  initials: string
  photoUrl?: string
}

export type MarketFixture = {
  id: string
  category: string
  categoryKey?: string
  timeLeft: string
  question: string
  creator: CreatorFixture
  creatorId?: number
  volumeTon: number
  participants: number
  status: MarketStatus
  resolvedSide?: OutcomeSide
  outcomeA: OutcomeFixture
  outcomeB: OutcomeFixture
  description: string
  resolution: string
  closeLabel: string
  closeAtLabel?: string
  mechanism?: string
  visibility?: string
  shareToken?: string | null
  acceptingBets?: boolean
  rejectionReason?: string | null
}

export type OrderBookLevel = {
  odds: number
  availableTon: number
}

export type RecentTrade = {
  id?: number
  odds: number
  amountTon: number
  timeAgo: string
  createdAt?: string
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
