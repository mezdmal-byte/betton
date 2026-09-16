export type MarketCategoryDto = 'sport' | 'politics' | 'unique' | string

export type MarketStatusDto =
  | 'pending'
  | 'rejected'
  | 'open'
  | 'closed'
  | 'resolved'
  | 'cancelled'

export type BestOfferDto = {
  odds: number
  available: number
}

export type CreatorBriefDto = {
  id: number
  display_name: string
  telegram_username?: string | null
}

export type MarketActivityDto = {
  volume?: number
  volume_nano?: number
  fills?: number
  unique_participants?: number
}

export type MarketOut = {
  id: number
  question: string
  description: string
  creator_id: number
  category: MarketCategoryDto
  outcomes: string[]
  status: MarketStatusDto
  winning_outcome?: string | null
  close_at?: string | null
  accepting_bets?: boolean
  mechanism?: string
  best_offers?: Array<BestOfferDto | null> | null
  creator?: CreatorBriefDto | null
  activity?: MarketActivityDto | null
  visibility?: string
  share_token?: string | null
  cancellation_reason?: string | null
}

export type UserOut = {
  id: number
  username: string
  telegram_id?: number | null
  balance: number
  is_admin?: boolean
  telegram_username?: string | null
  display_name?: string | null
  photo_url?: string | null
}

export type AccountOut = {
  id: number
  username: string
  telegram_id?: number | null
  telegram_username?: string | null
  display_name?: string | null
  photo_url?: string | null
  is_admin?: boolean
  balance: number
  balance_nano: number
  reserved: number
  reserved_nano: number
  in_positions: number
  in_positions_nano: number
  creator_earnings?: number
  creator_earnings_nano?: number
}

export type OrderbookLevelDto = {
  odds: number
  available: number
}

export type OrderbookOut = {
  sides: OrderbookLevelDto[][]
  queued: number[]
  last_prices?: number[] | null
  forming?: boolean
  available_to_me?: OrderbookLevelDto[][]
}

export type MarketsQuery = {
  category?: string
  status?: MarketStatusDto | null
  q?: string
  sort?: string
  limit?: number
  offset?: number
}

export type MarketsPage = {
  items: MarketOut[]
  total: number
  limit: number
  offset: number
}
