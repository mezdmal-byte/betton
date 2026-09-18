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
  rejection_reason?: string | null
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

export type OrderKind = 'limit' | 'ioc'

export type OrderPreviewFill = {
  odds: number
  matched: number
}

export type OrderPreviewStats = {
  matched: number
  remaining: number
  payout: number
  average_odds?: number | null
  worst_odds?: number | null
  fills?: OrderPreviewFill[]
}

export type OrderPreviewOut = {
  limit_odds: number
  kind?: OrderKind
  requested: OrderPreviewStats
  available: OrderPreviewStats
}

export type OrderPlaceBody = {
  outcome: number
  money: string | number
  odds: string | number
  kind: OrderKind
  request_id: string
}

export type OrderPreviewBody = {
  outcome: number
  money: string | number
  odds: string | number
  kind?: OrderKind
}

export type OrderOut = {
  id: number
  market_id: number
  outcome: number
  odds: number
  amount: number
  remaining: number
  filled: number
  refunded: number
  kind: string
  status: string
  request_id: string
  created_at?: string | null
  question?: string
  outcome_name?: string
}

export type PositionOut = {
  market_id: number
  shares: number[]
  costs: number[]
  shares_yes?: number
  shares_no?: number
  cost_yes?: number
  cost_no?: number
  claimed: boolean
  tip_paid: number
  market: MarketOut
}

export type TransactionOut = {
  id: string
  type: string
  market_id?: number | null
  question?: string
  created_at?: string | null
  amount_nano: number
  amount: number
  display_nano: number
  display_amount: number
  informational?: boolean
}

export type SettlementOut = {
  market_id: number
  question: string
  winning_outcome: string
  chosen_outcomes: string[]
  stakes_total: number
  payout: number
  tip: number
  credited: number
  result: number
  resolved_at?: string | null
  settlement_kind?: string | null
  cancellation_reason?: string | null
}

export type CreatorStatsOut = {
  id: number
  display_name: string
  telegram_username?: string | null
  photo_url?: string | null
  rank?: number | null
  markets_created: number
  volume: number
  volume_nano: number
  fills: number
  unique_participants: number
  active_markets: number
  completed_markets: number
}

export type CreatorProfileOut = {
  creator: CreatorStatsOut
  markets: MarketOut[]
}

export type CreateMarketBody = {
  mechanism: 'p2p'
  question: string
  description: string
  category: string
  outcomes: string[]
  close_at: string
  visibility: 'public' | 'unlisted'
}

export type MarketTradeOut = {
  id: number
  created_at?: string | null
  maker_outcome: number
  taker_outcome: number
  maker_odds: number
  taker_odds: number
  maker_stake: number
  taker_stake: number
  maker_stake_nano: number
  taker_stake_nano: number
}

export type HealthOut = {
  status: string
  webapp?: string
  bot_username?: string
}
