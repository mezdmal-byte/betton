import { hasExecutableQuote } from './quote'
import type { OutcomeFixture } from '../types/market'

/** Protocol minimum odds from parse_terms. Quick Trade uses this floor for preview and place. */
export const IOC_MIN_ACCEPTABLE_ODDS = 1.00001

export const QUICK_TRADE_INITIAL_AMOUNT = 0

export function iocExecutionOdds(minAcceptableOdds?: number | null): number {
  const raw =
    minAcceptableOdds == null || !Number.isFinite(minAcceptableOdds)
      ? IOC_MIN_ACCEPTABLE_ODDS
      : Number(minAcceptableOdds)
  const floored = Math.floor(raw * 1e6) / 1e6
  return Math.min(10000, Math.max(IOC_MIN_ACCEPTABLE_ODDS, floored))
}

export function amountInputValue(amount: number): string {
  return amount > 0 ? String(amount) : ''
}

export function topExecutableTon(outcome: Pick<OutcomeFixture, 'odds' | 'liquidityTon'>): number {
  if (!hasExecutableQuote(outcome.odds, outcome.liquidityTon)) return 0
  return Number(outcome.liquidityTon)
}

export function formatMaxPreset(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '0'
  if (Math.abs(amount - Math.round(amount)) < 1e-9) return String(Math.round(amount))
  return amount.toFixed(2).replace(/\.?0+$/, '')
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
