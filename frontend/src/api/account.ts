import { apiRequest } from './client'
import type { AccountOut, CreatorProfileOut, CreatorStatsOut, HealthOut, MarketOut, UserOut } from './types'

export async function authTelegram(): Promise<UserOut> {
  const { data } = await apiRequest<UserOut>('/auth/telegram', {
    method: 'POST',
    jsonBody: {},
  })
  return data
}

export async function getAccount(userId: number): Promise<AccountOut> {
  const { data } = await apiRequest<AccountOut>(`/users/${userId}/account`)
  return data
}

export async function listCreatedMarkets(userId: number): Promise<MarketOut[]> {
  const { data } = await apiRequest<MarketOut[]>(`/users/${userId}/markets`)
  return Array.isArray(data) ? data : []
}

export async function getCreatorProfile(userId: number): Promise<CreatorProfileOut> {
  const { data } = await apiRequest<CreatorProfileOut>(`/creators/${userId}`)
  return data
}

export async function getHealth(): Promise<HealthOut> {
  const { data } = await apiRequest<HealthOut>('/health')
  return data
}

export async function listTopCreators(limit = 5): Promise<CreatorStatsOut[]> {
  const { data } = await apiRequest<CreatorStatsOut[]>(`/creators/top?limit=${limit}`)
  return Array.isArray(data) ? data : []
}
