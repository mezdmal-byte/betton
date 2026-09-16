import { QueryClient } from '@tanstack/react-query'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 15_000,
      },
    },
  })
}

export const queryKeys = {
  session: ['auth', 'telegram'] as const,
  account: (userId: number) => ['users', userId, 'account'] as const,
  positions: (userId: number) => ['users', userId, 'positions'] as const,
  orders: (userId: number) => ['users', userId, 'orders'] as const,
  transactions: (userId: number) => ['users', userId, 'transactions'] as const,
  settlements: (userId: number) => ['users', userId, 'settlements'] as const,
  createdMarkets: (userId: number) => ['users', userId, 'markets'] as const,
  creator: (userId: number) => ['creators', userId] as const,
  moderation: ['moderation', 'markets'] as const,
  health: ['health'] as const,
  markets: (input: { sort: string; category: string; q: string; status?: string | null }) =>
    ['markets', input.sort, input.category, input.q, input.status ?? 'open'] as const,
  market: (marketId: number | string) => ['markets', String(marketId)] as const,
  marketShare: (token: string) => ['markets', 'share', token] as const,
  orderbook: (marketId: number | string) => ['markets', String(marketId), 'orderbook'] as const,
  trades: (marketId: number | string) => ['markets', String(marketId), 'trades'] as const,
  orderPreview: (input: {
    marketId: number | string
    outcome: number
    money: string
    odds: string
  }) =>
    ['markets', String(input.marketId), 'orders', 'quote', input.outcome, input.money, input.odds] as const,
}
