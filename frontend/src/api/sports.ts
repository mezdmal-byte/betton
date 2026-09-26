import { apiRequest } from './client'
import type { Cs2MatchesOut } from './types'

export async function getUpcomingCs2Matches(limit = 40): Promise<Cs2MatchesOut> {
  const params = new URLSearchParams({ limit: String(limit) })
  const { data } = await apiRequest<Cs2MatchesOut>(`/sports/cs2/matches/upcoming?${params.toString()}`)
  return {
    configured: Boolean(data?.configured),
    provider: data?.provider || 'pandascore',
    items: Array.isArray(data?.items) ? data.items : [],
  }
}
