import { apiRequest } from './client'
import type { MarketOut } from './types'

export async function listModerationQueue(): Promise<MarketOut[]> {
  const { data } = await apiRequest<MarketOut[]>('/moderation/markets')
  return Array.isArray(data) ? data : []
}

export async function approveMarket(marketId: number | string): Promise<MarketOut> {
  const { data } = await apiRequest<MarketOut>(`/markets/${marketId}/approve`, {
    method: 'POST',
    jsonBody: {},
  })
  return data
}

export async function rejectMarket(marketId: number | string, reason: string): Promise<MarketOut> {
  const { data } = await apiRequest<MarketOut>(`/markets/${marketId}/reject`, {
    method: 'POST',
    jsonBody: { reason },
  })
  return data
}

export async function closeMarket(marketId: number | string): Promise<MarketOut> {
  const { data } = await apiRequest<MarketOut>(`/markets/${marketId}/close`, {
    method: 'POST',
    jsonBody: {},
  })
  return data
}

export async function resolveMarket(marketId: number | string, winningOutcome: string | number): Promise<MarketOut> {
  const { data } = await apiRequest<MarketOut>(`/markets/${marketId}/resolve`, {
    method: 'POST',
    jsonBody: { winning_outcome: winningOutcome },
  })
  return data
}

export async function voidMarket(marketId: number | string, reason: string): Promise<MarketOut> {
  const { data } = await apiRequest<MarketOut>(`/markets/${marketId}/cancel`, {
    method: 'POST',
    jsonBody: { reason },
  })
  return data
}
