import type { AccountFixture } from '../types/account'
import type { CreatorFixture, MarketFixture, MarketStatus, OutcomeFixture } from '../types/market'
import { nanoToTon } from '../lib/money'
import { formatTimeLeft, isClosingSoon } from '../lib/time'
import type { AccountOut, BestOfferDto, CreatorBriefDto, MarketOut, UserOut } from './types'

export const UI_SORT_TO_API = {
  new: 'new',
  popular: 'popular',
  closing: 'closing',
} as const

export const UI_CATEGORY_TO_API: Record<string, string | undefined> = {
  all: undefined,
  sport: 'sport',
  politics: 'politics',
  other: 'unique',
}

export const API_CATEGORY_TO_LABEL: Record<string, string> = {
  sport: 'Спорт',
  politics: 'Политика',
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
  if (dto.status === 'cancelled') return 'cancelled'
  if (dto.status === 'resolved') return 'resolved'
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

export function mapMarketOut(dto: MarketOut, now: Date = new Date()): MarketFixture {
  const timeLeft = formatTimeLeft(dto.close_at, now, dto.status)
  const status = mapStatus(dto, now)
  const offers = dto.best_offers ?? [null, null]
  let closeLabel = `Закроется через ${timeLeft}`
  if (dto.status === 'resolved') closeLabel = 'Завершено'
  else if (dto.status === 'cancelled') closeLabel = 'Отменено'
  else if (timeLeft === 'закрыто' || dto.status === 'closed' || dto.accepting_bets === false) {
    closeLabel = 'Приём завершён'
  }

  const volumeNano = dto.activity?.volume_nano
  const volumeTon =
    volumeNano != null ? nanoToTon(volumeNano) : Number(dto.activity?.volume ?? 0)

  return {
    id: String(dto.id),
    category: mapApiCategoryToLabel(dto.category),
    timeLeft: timeLeft || '—',
    question: dto.question,
    creator: mapCreator(dto.creator),
    volumeTon,
    participants: dto.activity?.unique_participants ?? 0,
    status,
    resolvedSide: mapResolvedSide(dto),
    outcomeA: mapOffer(outcomeLabel(dto.outcomes, 0), offers[0]),
    outcomeB: mapOffer(outcomeLabel(dto.outcomes, 1), offers[1]),
    description: dto.description || '',
    resolution: dto.cancellation_reason
      ? `Отмена. ${dto.cancellation_reason}`
      : dto.winning_outcome
        ? `Исход: ${dto.winning_outcome}`
        : '',
    closeLabel,
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
    eventsCreated: 0,
    createdVolumeTon: 0,
  }
}
