import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '../api/query'

export function invalidateAfterTrade(
  queryClient: QueryClient,
  input: { userId?: number; marketId?: number | string },
): void {
  if (input.userId != null) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.account(input.userId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.positions(input.userId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.orders(input.userId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.transactions(input.userId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.settlements(input.userId) })
  }
  if (input.marketId != null) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.market(input.marketId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.orderbook(input.marketId) })
  }
  void queryClient.invalidateQueries({ queryKey: ['markets'] })
}

export function confirmCancelOrder(): boolean {
  if (typeof window === 'undefined') return false
  return window.confirm('Отменить остаток заявки? Средства вернутся на доступный баланс.')
}
