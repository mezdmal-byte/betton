import type { OutcomeFixture, OutcomeQuoteState } from '../types/market'

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
