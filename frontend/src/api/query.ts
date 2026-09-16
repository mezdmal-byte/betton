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
  markets: (input: { sort: string; category: string; q: string }) =>
    ['markets', input.sort, input.category, input.q] as const,
  market: (marketId: number | string) => ['markets', String(marketId)] as const,
  marketShare: (token: string) => ['markets', 'share', token] as const,
  orderbook: (marketId: number | string) => ['markets', String(marketId), 'orderbook'] as const,
}
