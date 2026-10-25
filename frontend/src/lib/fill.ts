import type { OrderBookLevel } from '../types/market'

export function splitFill(amount: number, available: number | null | undefined) {
  const liquidity = Math.max(available ?? 0, 0)
  const stake = Math.max(amount, 0)
  const matched = Math.min(stake, liquidity)
  const rest = Math.max(stake - matched, 0)
  return { matched, rest }
}

export function availableAtOdds(book: OrderBookLevel[], odds: number): number {
  return book
    .filter((level) => level.odds <= odds + 1e-9)
    .reduce((sum, level) => sum + level.availableTon, 0)
}
