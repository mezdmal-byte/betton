import type { MarketFixture, OutcomeFixture, OutcomeQuoteState, OutcomeSide } from '../types/market'

const PRESERVED_STATES: ReadonlyArray<OutcomeQuoteState> = [
  'loading',
  'disabled',
  'winner',
  'resolved-loser',
]

export function hasExecutableQuote(
  odds?: number | null,
  liquidity?: number | null,
): boolean {
  return odds != null && liquidity != null && liquidity > 0
}

export function outcomeIsExecutable(outcome: OutcomeFixture): boolean {
  return hasExecutableQuote(outcome.odds, outcome.liquidityTon)
}

export function marketIsLocked(market: Pick<MarketFixture, 'status'>): boolean {
  return market.status === 'closed' || market.status === 'cancelled' || market.status === 'resolved'
}

export function marketIsTradable(market: Pick<MarketFixture, 'status'>): boolean {
  return !marketIsLocked(market)
}

export function marketOutcomeQuoteState(
  market: MarketFixture,
  side: OutcomeSide,
  selectedSide: OutcomeSide | null,
): OutcomeQuoteState {
  if (market.status === 'resolved') {
    return market.resolvedSide === side ? 'winner' : 'resolved-loser'
  }
  if (market.status === 'cancelled' || market.status === 'closed') return 'disabled'
  const outcome = side === 'a' ? market.outcomeA : market.outcomeB
  if (!outcomeIsExecutable(outcome)) return 'no-liquidity'
  if (selectedSide === side) return 'selected'
  return 'default'
}

export function resolveOutcomeQuoteState({
  odds = null,
  liquidity = null,
  state = 'default',
  showMetrics = true,
}: {
  odds?: number | null
  liquidity?: number | null
  state?: OutcomeQuoteState
  showMetrics?: boolean
}): OutcomeQuoteState {
  if (PRESERVED_STATES.includes(state)) return state
  if (showMetrics && !hasExecutableQuote(odds, liquidity)) return 'no-liquidity'
  return state
}
