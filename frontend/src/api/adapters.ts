import type { AccountFixture } from '../types/account'
import type { HistoryFixture, OrderFixture, PositionFixture } from '../types/account'
import type { CreatorFixture, MarketFixture, MarketStatus, OrderBookLevel, OutcomeFixture, ChartPoint, RecentTrade } from '../types/market'
import { translate, type Locale } from '../i18n'
import { moneyJsonValue, nanoToTon } from '../lib/money'
import { formatTimeLeft, isClosingSoon } from '../lib/time'
import type {
  AccountOut,
  BestOfferDto,
  CreateMarketBody,
  CreatorBriefDto,
  CreatorStatsOut,
  MarketOut,
  MarketTradeOut,
  OrderOut,
  OrderPreviewOut,
  OrderbookLevelDto,
  OrderbookOut,
  PositionOut,
  TransactionOut,
  UserOut,
} from './types'

export const UI_SORT_TO_API = {
  new: 'new',
  popular: 'popular',
  closing: 'closing',
} as const

export const UI_CATEGORY_TO_API: Record<string, string | undefined> = {
  all: undefined,
  sport: 'sport',
  politics: 'politics',
  crypto: 'crypto',
  other: 'unique',
}

export const UI_STATUS_TO_API: Record<string, MarketOut['status'] | null> = {
  all: null,
  open: 'open',
  closed: 'closed',
  resolved: 'resolved',
  cancelled: 'cancelled',
}

export const API_CATEGORY_TO_LABEL: Record<string, string> = {
  sport: 'Спорт',
  politics: 'Политика',
  crypto: 'Крипто',
  unique: 'Другое',
}

const FALLBACK_OUTCOMES = ['Да', 'Нет'] as const

export function mapUiSortToApi(sort: string): string {
  return UI_SORT_TO_API[sort as keyof typeof UI_SORT_TO_API] ?? 'new'
}

export function mapUiCategoryToApi(category: string): string | undefined {
  if (category in UI_CATEGORY_TO_API) return UI_CATEGORY_TO_API[category]
  return undefined
}

export function mapUiStatusToApi(status: string | null | undefined): MarketOut['status'] | null | undefined {
  if (status == null) return undefined
  if (status in UI_STATUS_TO_API) return UI_STATUS_TO_API[status]
  return undefined
}

export function mapApiCategoryToLabel(category: string | null | undefined): string {
  if (!category) return API_CATEGORY_TO_LABEL.unique
  return API_CATEGORY_TO_LABEL[category] ?? category
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase()
  }
  const compact = name.replace(/[^\p{L}\p{N}]+/gu, '')
  if (compact.length >= 2) return compact.slice(0, 2).toUpperCase()
  if (compact.length === 1) return compact.toUpperCase()
  return '?'
}

export function mapCreator(dto: CreatorBriefDto | null | undefined): CreatorFixture {
  const displayName = dto?.display_name?.trim() || 'Автор'
  const handle = (dto?.telegram_username || '').replace(/^@/, '').trim() || 'creator'
  return {
    ...(dto?.id != null ? { id: dto.id } : {}),
    handle,
    displayName,
    initials: initialsFromName(displayName),
  }
}

function mapOffer(label: string, offer: BestOfferDto | null | undefined): OutcomeFixture {
  if (!offer || offer.odds == null || offer.available == null || !(offer.available > 0)) {
    return { label, odds: null, liquidityTon: null }
  }
  return { label, odds: Number(offer.odds), liquidityTon: Number(offer.available) }
}

function outcomeLabel(outcomes: string[] | undefined, index: number): string {
  const value = outcomes?.[index]
  if (typeof value === 'string' && value.trim()) return value
  return FALLBACK_OUTCOMES[index] ?? FALLBACK_OUTCOMES[0]
}

function mapStatus(dto: MarketOut, now: Date): MarketStatus {
  if (dto.status === 'pending') return 'pending'
  if (dto.status === 'rejected') return 'rejected'
  if (dto.status === 'cancelled') return 'cancelled'
  if (dto.status === 'resolved') return 'resolved'
  if (dto.status === 'closed') return 'closed'
  if (dto.status === 'open' && dto.accepting_bets !== false && isClosingSoon(dto.close_at, now)) {
    return 'closing'
  }
  return 'open'
}

function mapResolvedSide(dto: MarketOut): MarketFixture['resolvedSide'] {
  if (dto.status !== 'resolved' || !dto.winning_outcome) return undefined
  const winner = dto.winning_outcome
  if (winner === dto.outcomes?.[0]) return 'a'
  if (winner === dto.outcomes?.[1]) return 'b'
  return undefined
}

export function mapMarketOut(dto: MarketOut, now: Date = new Date(), locale: Locale = 'ru'): MarketFixture {
  const timeLeft = formatTimeLeft(dto.close_at, now, dto.status, locale)
  const status = mapStatus(dto, now)
  const closedLabel = translate(locale, 'status.closedOne')
  let closeLabel = translate(locale, 'time.closesIn', { time: timeLeft })
  if (dto.status === 'resolved') closeLabel = translate(locale, 'status.resolvedOne')
  else if (dto.status === 'cancelled') closeLabel = translate(locale, 'status.cancelledOne')
  else if (dto.status === 'pending') closeLabel = translate(locale, 'status.pending')
  else if (dto.status === 'rejected') closeLabel = translate(locale, 'status.rejected')
  else if (dto.status === 'closed' || timeLeft === closedLabel || timeLeft === translate(locale, 'time.ended')) {
    closeLabel = closedLabel
  }

  const volumeNano = dto.activity?.volume_nano
  const volumeTon =
    volumeNano != null ? nanoToTon(volumeNano) : Number(dto.activity?.volume ?? 0)

  const p2p = (dto.mechanism ?? 'p2p') === 'p2p'
  const offers = p2p ? (dto.best_offers ?? [null, null]) : [null, null]

  return {
    id: String(dto.id),
    category: mapApiCategoryToLabel(dto.category),
    categoryKey: dto.category,
    timeLeft: timeLeft || '—',
    question: dto.question,
    creator: mapCreator(dto.creator),
    creatorId: dto.creator?.id ?? dto.creator_id,
    volumeTon,
    participants: dto.activity?.unique_participants ?? 0,
    status,
    resolvedSide: mapResolvedSide(dto),
    outcomeA: mapOffer(outcomeLabel(dto.outcomes, 0), offers[0]),
    outcomeB: mapOffer(outcomeLabel(dto.outcomes, 1), offers[1]),
    description: dto.description || '',
    resolution: dto.cancellation_reason
      ? `${translate(locale, 'status.cancelledOne')}. ${dto.cancellation_reason}`
      : dto.rejection_reason
        ? `${translate(locale, 'status.rejected')}. ${dto.rejection_reason}`
        : dto.winning_outcome
          ? `${translate(locale, 'status.resolvedOne')}: ${dto.winning_outcome}`
          : '',
    closeLabel,
    mechanism: dto.mechanism ?? 'p2p',
    visibility: dto.visibility,
    shareToken: dto.share_token ?? null,
    acceptingBets: dto.accepting_bets,
    rejectionReason: dto.rejection_reason ?? null,
  }
}

export function mapUserIdentity(dto: Pick<UserOut, 'display_name' | 'telegram_username' | 'username' | 'photo_url'> & {
  is_admin?: boolean
}) {
  const displayName =
    dto.display_name?.trim() ||
    (dto.telegram_username ? `@${dto.telegram_username.replace(/^@/, '')}` : '') ||
    dto.username ||
    'Игрок'
  const handle = (dto.telegram_username || dto.username || '').replace(/^@/, '')
  return {
    displayName,
    handle,
    initials: initialsFromName(dto.display_name?.trim() || handle || displayName),
    photoUrl: dto.photo_url || undefined,
    isAdmin: Boolean(dto.is_admin),
  }
}

export function mapAccountOut(dto: AccountOut): AccountFixture & { photoUrl?: string; availableNano: number } {
  const identity = mapUserIdentity(dto)
  return {
    displayName: identity.displayName,
    handle: identity.handle,
    initials: identity.initials,
    photoUrl: identity.photoUrl,
    isAdmin: identity.isAdmin,
    availableTon: nanoToTon(dto.balance_nano),
    availableNano: dto.balance_nano,
    inPositionsTon: nanoToTon(dto.in_positions_nano),
    inOrdersTon: nanoToTon(dto.reserved_nano),
    creatorIncomeTon: nanoToTon(dto.creator_earnings_nano ?? 0),
    eventsCreated: null,
    createdVolumeTon: null,
  }
}

export function executableOutcomeFromLevels(
  label: string,
  levels: OrderbookLevelDto[] | null | undefined,
): OutcomeFixture {
  const top = Array.isArray(levels) && levels.length > 0 ? levels[0] : undefined
  if (!top) return { label, odds: null, liquidityTon: null }
  return mapOffer(label, { odds: top.odds, available: top.available })
}

export function applyPersonalizedExecutableQuotes(
  market: MarketFixture,
  book: Partial<Pick<OrderbookOut, 'available_to_me' | 'sides'>>,
): MarketFixture {
  const mine = book.available_to_me
  return {
    ...market,
    outcomeA: executableOutcomeFromLevels(market.outcomeA.label, mine?.[0]),
    outcomeB: executableOutcomeFromLevels(market.outcomeB.label, mine?.[1]),
  }
}

const TX_ACTION: Record<string, string> = {
  reserve: 'Заявка создана',
  fill: 'Исполнено',
  refund: 'Возврат остатка',
  cancel: 'Отмена',
  win: 'Выигрыш',
  loss: 'Проигрыш',
  fee: 'Сервисный сбор',
  void: 'Возврат события',
  credit: 'Зачисление',
  deposit: 'Пополнение',
  withdraw: 'Вывод',
}

export function mapTopCreator(dto: CreatorStatsOut): {
  id: number
  displayName: string
  handle: string
  initials: string
  photoUrl?: string
  volumeTon: number
} {
  const handle = (dto.telegram_username || '').replace(/^@/, '').trim()
  const displayName = dto.display_name
  return {
    id: dto.id,
    displayName,
    handle: handle || displayName,
    initials: initialsFromName(displayName || handle),
    photoUrl: dto.photo_url || undefined,
    volumeTon: dto.volume_nano != null ? nanoToTon(dto.volume_nano) : Number(dto.volume ?? 0),
  }
}

export function mapCreatorStats(
  dto: CreatorStatsOut | null | undefined,
): Pick<AccountFixture, 'eventsCreated' | 'createdVolumeTon'> {
  if (!dto) return { eventsCreated: null, createdVolumeTon: null }
  return {
    eventsCreated: dto.markets_created,
    createdVolumeTon: dto.volume_nano != null ? nanoToTon(dto.volume_nano) : dto.volume,
  }
}

export function mapOrderBookLevels(levels: OrderbookLevelDto[] | null | undefined): OrderBookLevel[] {
  if (!Array.isArray(levels)) return []
  return levels
    .filter((level) => level && Number(level.available) > 0)
    .map((level) => ({ odds: Number(level.odds), availableTon: Number(level.available) }))
}

export function mapOrderPreview(dto: OrderPreviewOut) {
  const requested = dto.requested ?? { matched: 0, remaining: 0, payout: 0 }
  const fills = Array.isArray(requested.fills) ? requested.fills : []
  return {
    matchedTon: Number(requested.matched || 0),
    remainingTon: Number(requested.remaining || 0),
    payoutTon: Number(requested.payout || 0),
    averageOdds: requested.average_odds ?? null,
    worstOdds: requested.worst_odds ?? null,
    fills: fills
      .filter((leg) => leg && Number(leg.matched) > 0)
      .map((leg) => ({ odds: Number(leg.odds), matchedTon: Number(leg.matched) })),
    availableMatchedTon: Number(dto.available?.matched || 0),
    availableWorstOdds: dto.available?.worst_odds ?? null,
    limitOdds: Number(dto.limit_odds),
  }
}

export function mapPlaceResult(dto: OrderOut) {
  return {
    id: dto.id,
    filledTon: Number(dto.filled || 0),
    remainingTon: Number(dto.remaining || 0),
    refundedTon: Number(dto.refunded || 0),
    requestedTon: Number(dto.amount || 0),
    status: dto.status,
    requestId: dto.request_id,
  }
}

export const IOC_REQUOTE_MESSAGE = 'Предложение уже изменилось. Обновите коэффициент.'

export type IocPlacementKind = 'empty' | 'partial' | 'full'

export type IocPlacementResult = {
  kind: IocPlacementKind
  filledTon: number
  refundedTon: number
  requestedTon: number
  status: string
}

export function classifyIocPlacement(
  order: Pick<OrderOut, 'filled' | 'refunded' | 'amount' | 'status'>,
): IocPlacementResult {
  const filledTon = Number(order.filled || 0)
  const refundedTon = Number(order.refunded || 0)
  const requestedTon = Number(order.amount || 0)
  let kind: IocPlacementKind = 'full'
  if (filledTon <= 0) {
    kind = 'empty'
  } else if (filledTon < requestedTon) {
    kind = 'partial'
  }
  return {
    kind,
    filledTon,
    refundedTon,
    requestedTon,
    status: order.status,
  }
}

export function mapOpenOrder(dto: OrderOut): OrderFixture | null {
  if (dto.status !== 'open') return null
  const filled = Number(dto.filled || 0)
  const remaining = Number(dto.remaining || 0)
  return {
    id: String(dto.id),
    marketId: dto.market_id,
    question: dto.question || `Событие #${dto.market_id}`,
    outcomeLabel: dto.outcome_name || `Исход ${Number(dto.outcome) + 1}`,
    odds: Number(dto.odds),
    remainingTon: remaining,
    amountTon: Number(dto.amount || 0),
    filledTon: filled,
    status: filled > 0 && remaining > 0 ? 'Частично исполнена' : 'Активна',
    canCancel: true,
  }
}

export function mapPositions(dto: PositionOut): PositionFixture[] {
  const names = dto.market?.outcomes?.length ? dto.market.outcomes : [...FALLBACK_OUTCOMES]
  const shares = dto.shares?.length ? dto.shares : [dto.shares_yes || 0, dto.shares_no || 0]
  const costs = dto.costs?.length ? dto.costs : [dto.cost_yes || 0, dto.cost_no || 0]
  const rows: PositionFixture[] = []
  for (let i = 0; i < names.length; i += 1) {
    const staked = Number(costs[i] || 0)
    if (staked <= 0) continue
    const payout = Number(shares[i] || 0)
    rows.push({
      id: `${dto.market_id}-${i}`,
      marketId: dto.market_id,
      question: dto.market?.question || `Событие #${dto.market_id}`,
      outcomeLabel: names[i] || FALLBACK_OUTCOMES[i] || 'Исход',
      amountTon: staked,
      avgOdds: payout > 0 && staked > 0 ? payout / staked : 0,
      potentialPayoutTon: payout,
    })
  }
  return rows
}

export function mapTransaction(dto: TransactionOut): HistoryFixture {
  return {
    id: dto.id,
    question: dto.question || (dto.market_id ? `Событие #${dto.market_id}` : 'Операция'),
    action: TX_ACTION[dto.type] || dto.type,
    actionKey: dto.type,
    amountTon: Number(dto.display_amount),
    createdAt: dto.created_at ?? undefined,
    time: dto.created_at ?? '—',
  }
}

export function mapUiCategoryToCreateApi(category: string): 'sport' | 'politics' | 'crypto' | 'unique' {
  if (category === 'sport' || category === 'politics' || category === 'crypto') return category
  return 'unique'
}

export function buildCreateMarketPayload(input: {
  question: string
  category: string
  outcomeA: string
  outcomeB: string
  closeAt: Date
  visibility: 'public' | 'unlisted'
  description: string
}): CreateMarketBody {
  const outcomeA = input.outcomeA.trim() || 'Да'
  const outcomeB = input.outcomeB.trim() || 'Нет'
  return {
    mechanism: 'p2p',
    question: input.question.trim(),
    description: input.description.trim(),
    category: mapUiCategoryToCreateApi(input.category),
    outcomes: [outcomeA, outcomeB],
    close_at: input.closeAt.toISOString(),
    visibility: input.visibility,
  }
}

export function backendVisibilityOrUnavailable(
  visibility: string,
): { value: 'public' | 'unlisted'; unsupported: boolean } {
  if (visibility === 'unlisted') return { value: 'unlisted', unsupported: false }
  if (visibility === 'public') return { value: 'public', unsupported: false }
  return { value: 'public', unsupported: true }
}

export function isAdminAccount(account: { is_admin?: boolean; isAdmin?: boolean } | null | undefined): boolean {
  if (!account) return false
  return Boolean(account.is_admin || account.isAdmin)
}

export function moneyForOrder(amount: number): string {
  return moneyJsonValue(amount)
}

export function oddsForOutcome(trade: MarketTradeOut, outcomeIndex: number): number | null {
  if (trade.maker_outcome === outcomeIndex) return Number(trade.maker_odds)
  if (trade.taker_outcome === outcomeIndex) return Number(trade.taker_odds)
  return null
}

export function stakeForOutcome(trade: MarketTradeOut, outcomeIndex: number): number {
  if (trade.maker_outcome === outcomeIndex) return Number(trade.maker_stake || 0)
  if (trade.taker_outcome === outcomeIndex) return Number(trade.taker_stake || 0)
  return 0
}

export function mapTradesToChartPoints(trades: MarketTradeOut[] | null | undefined, outcomeIndex: number): ChartPoint[] {
  if (!Array.isArray(trades) || trades.length === 0) return []
  return trades
    .map((trade) => {
      const odds = oddsForOutcome(trade, outcomeIndex)
      if (odds == null || !(odds > 0)) return null
      const created = trade.created_at ? Date.parse(trade.created_at) : Number.NaN
      return {
        t: Number.isFinite(created) ? created : trade.id,
        odds,
        volume: stakeForOutcome(trade, outcomeIndex),
      } satisfies ChartPoint
    })
    .filter((point): point is ChartPoint => point != null)
}

export function mapTradesToRecent(trades: MarketTradeOut[] | null | undefined, outcomeIndex: number, now = Date.now()): RecentTrade[] {
  if (!Array.isArray(trades)) return []
  return [...trades].reverse().slice(0, 8).flatMap((trade) => {
    const odds = oddsForOutcome(trade, outcomeIndex)
    if (odds == null) return []
    const created = trade.created_at ? Date.parse(trade.created_at) : Number.NaN
    return [
      {
        id: trade.id,
        odds,
        amountTon: stakeForOutcome(trade, outcomeIndex),
        timeAgo: formatRelativeTime(created, now),
        createdAt: trade.created_at ?? undefined,
      },
    ]
  })
}

function formatRelativeTime(created: number, now: number): string {
  if (!Number.isFinite(created)) return '—'
  const mins = Math.max(0, Math.round((now - created) / 60000))
  if (mins < 1) return '1 мин'
  if (mins < 60) return `${mins} мин`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} ч`
  return `${Math.round(hours / 24)} д`
}

export function hasFakeChartSeries(points: ChartPoint[] | null | undefined): boolean {
  return !Array.isArray(points) || points.length === 0
}
