export type VisibilityId = 'public' | 'unlisted' | 'private'

export type PortfolioTab = 'positions' | 'orders' | 'history'

export type PositionFixture = {
  id: string
  question: string
  outcomeLabel: string
  amountTon: number
  avgOdds: number
  potentialPayoutTon: number
}

export type OrderFixture = {
  id: string
  question: string
  outcomeLabel: string
  odds: number
  remainingTon: number
  status: string
}

export type HistoryFixture = {
  id: string
  question: string
  action: string
  amountTon: number
  time: string
}

export type AccountFixture = {
  displayName: string
  handle: string
  initials: string
  availableTon: number
  inPositionsTon: number
  inOrdersTon: number
  creatorIncomeTon: number
  eventsCreated: number
  createdVolumeTon: number
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
