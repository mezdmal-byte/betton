export type VisibilityId = 'public' | 'unlisted' | 'private'

export type PortfolioTab = 'positions' | 'orders' | 'history'

export type PositionFixture = {
  id: string
  marketId: number
  question: string
  outcomeLabel: string
  amountTon: number
  avgOdds: number
  potentialPayoutTon: number
}

export type OrderFixture = {
  id: string
  marketId: number
  question: string
  outcomeLabel: string
  odds: number
  remainingTon: number
  amountTon: number
  filledTon: number
  status: string
  canCancel: boolean
}

export type HistoryFixture = {
  id: string
  question: string
  action: string
  actionKey?: string
  amountTon: number
  time: string
  createdAt?: string
}

export type SettlementFixture = {
  id: string
  marketId: number
  question: string
  winningOutcome: string
  chosenOutcomes: string[]
  stakesTotalTon: number
  payoutTon: number
  tipTon: number
  creditedTon: number
  resultTon: number
  settlementKind?: string | null
  cancellationReason?: string | null
  resolvedAt?: string
}

export type AccountFixture = {
  displayName: string
  handle: string
  initials: string
  availableTon: number
  inPositionsTon: number
  inOrdersTon: number
  creatorIncomeTon: number
  eventsCreated: number | null
  activeMarkets?: number | null
  createdVolumeTon: number | null
  isAdmin: boolean
  photoUrl?: string
}

export type CreateMarketDraft = {
  question: string
  category: string
  outcomeA: string
  outcomeB: string
  closeAt: string
  visibility: VisibilityId
  description: string
}
