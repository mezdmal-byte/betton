import { apiRequest, parseTotalCount } from './client'
import { mapUiCategoryToApi, mapUiSortToApi } from './adapters'
import type { MarketOut, MarketsPage, MarketsQuery, OrderbookOut } from './types'

export const FEED_PAGE_SIZE = 20

export type FeedQuery = {
  sort?: string
  category?: string
  q?: string
  status?: MarketsQuery['status']
  limit?: number
  offset?: number
}

export function buildMarketsQuery(input: FeedQuery): string {
  const params = new URLSearchParams()
  const category = mapUiCategoryToApi(input.category ?? 'all')
  if (category) params.set('category', category)
  const status = input.status === undefined ? 'open' : input.status
  if (status) params.set('status', status)
  const q = (input.q ?? '').trim()
  if (q) params.set('q', q)
  params.set('sort', mapUiSortToApi(input.sort ?? 'new'))
  const limit = input.limit ?? FEED_PAGE_SIZE
  params.set('limit', String(limit))
  params.set('offset', String(input.offset ?? 0))
  return params.toString()
}

export async function listMarkets(input: FeedQuery = {}): Promise<MarketsPage> {
  const limit = input.limit ?? FEED_PAGE_SIZE
  const offset = input.offset ?? 0
  const query = buildMarketsQuery({ ...input, limit, offset })
  const { data, headers } = await apiRequest<MarketOut[]>(`/markets?${query}`)
  const items = Array.isArray(data) ? data : []
  return {
    items,
    total: parseTotalCount(headers, items.length),
    limit,
    offset,
  }
}

export async function getMarket(marketId: number | string, shareToken?: string | null): Promise<MarketOut> {
  const { data } = await apiRequest<MarketOut>(`/markets/${marketId}`, { shareToken })
  return data
}

export async function getMarketByShare(shareToken: string): Promise<MarketOut> {
  const token = shareToken.trim()
  const { data } = await apiRequest<MarketOut>(`/markets/share/${encodeURIComponent(token)}`)
  return data
}

export async function getOrderbook(
  marketId: number | string,
  shareToken?: string | null,
): Promise<OrderbookOut> {
  const { data } = await apiRequest<OrderbookOut>(`/markets/${marketId}/orderbook`, { shareToken })
  return data
}
