import { hasExecutableQuote } from './quote'
import type { OutcomeFixture } from '../types/market'

/** Protocol minimum odds from parse_terms. Discovery preview may walk from this floor. */
export const IOC_MIN_ACCEPTABLE_ODDS = 1.00001

export const QUICK_TRADE_INITIAL_AMOUNT = 0
const QUICK_TRADE_MAX_DECIMALS = 4

export function iocExecutionOdds(minAcceptableOdds?: number | null): number {
  const raw =
    minAcceptableOdds == null || !Number.isFinite(minAcceptableOdds)
      ? IOC_MIN_ACCEPTABLE_ODDS
      : Number(minAcceptableOdds)
  const floored = Math.floor(raw * 1e6) / 1e6
  return Math.min(10000, Math.max(IOC_MIN_ACCEPTABLE_ODDS, floored))
}

/** Wide floor so backend can compute the multi-level discovery plan. */
export function iocDiscoveryOdds(): number {
  return iocExecutionOdds()
}

/**
 * Lock the displayed backend worst odds for this confirmation.
 * Keep full precision so the same book tick still matches after parse_terms.
 */
export function iocAcceptedOdds(displayedWorstOdds: number | null | undefined): number | null {
  if (displayedWorstOdds == null || !Number.isFinite(Number(displayedWorstOdds))) return null
  const value = Number(displayedWorstOdds)
  if (value < IOC_MIN_ACCEPTABLE_ODDS || value > 10000) return null
  return value
}

export function amountInputValue(amount: number): string {
  return amount > 0 ? String(amount) : ''
}

/**
 * User-facing Max must never round above executable top-level liquidity.
 * Keep enough precision for small TON amounts without exposing nano-level dust in the UI.
 */
export function normalizeQuickTradeMaxAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0
  const factor = 10 ** QUICK_TRADE_MAX_DECIMALS
  return Math.floor((amount + Number.EPSILON) * factor) / factor
}

export function topExecutableTon(outcome: Pick<OutcomeFixture, 'odds' | 'liquidityTon'>): number {
  if (!hasExecutableQuote(outcome.odds, outcome.liquidityTon)) return 0
  return normalizeQuickTradeMaxAmount(Number(outcome.liquidityTon))
}

export function formatMaxPreset(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '0'
  const fixed = amount.toFixed(QUICK_TRADE_MAX_DECIMALS)
  return fixed.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '')
}

export function presetExceedsBalance(preset: number, availableTon: number | null | undefined): boolean {
  return availableTon != null && Number.isFinite(availableTon) && preset > availableTon
}

export function shouldRequestQuickTradePreview(input: {
  amount: number
  executable: boolean
  userId?: number
  marketId: number
}): boolean {
  return (
    Boolean(input.userId) &&
    Number.isFinite(input.marketId) &&
    input.amount > 0 &&
    input.executable
  )
}

export function quickTradeCtaDisabled(input: {
  amount: number
  executable: boolean
  quotesLoading?: boolean
  insufficient?: boolean
  matchedTon?: number | null
  demoMode?: boolean
  state?: string
}): boolean {
  if (input.demoMode) return true
  if (input.state === 'stale-quote' || input.state === 'no-liquidity') return false
  if (input.quotesLoading) return true
  if (input.amount <= 0) return true
  if (!input.executable) return true
  if (input.insufficient) return true
  if (input.state === 'processing' || input.state === 'success') return true
  if (input.matchedTon != null && input.matchedTon <= 0) return true
  return false
}
