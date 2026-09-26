import { apiRequest } from './client'
import type { Cs2ImportOut, Cs2MatchesOut } from './types'

export async function getUpcomingCs2Matches(limit = 40): Promise<Cs2MatchesOut> {
  const params = new URLSearchParams({ limit: String(limit) })
  const { data } = await apiRequest<Cs2MatchesOut>(`/sports/cs2/matches/upcoming?${params.toString()}`)
  return {
    configured: Boolean(data?.configured),
    provider: data?.provider || 'pandascore',
    items: Array.isArray(data?.items) ? data.items : [],
  }
}


export async function importUpcomingCs2Matches(limit = 40): Promise<Cs2ImportOut> {
  const params = new URLSearchParams({ limit: String(limit) })
  const { data } = await apiRequest<Cs2ImportOut>(`/sports/cs2/import-upcoming?${params.toString()}`, {
    method: 'POST',
  })
  return data
}
