import { describe, expect, it } from 'vitest'
import { QUICK_TRADE_AMOUNT_PRESETS } from './constants'
import {
  amountInputValue,
  formatMaxPreset,
  iocAcceptedOdds,
  iocDiscoveryOdds,
  iocExecutionOdds,
  IOC_MIN_ACCEPTABLE_ODDS,
  normalizeQuickTradeMaxAmount,
  presetExceedsBalance,
  QUICK_TRADE_INITIAL_AMOUNT,
  quickTradeCtaDisabled,
  shouldRequestQuickTradePreview,
  topExecutableTon,
} from './quickTrade'

describe('Quick Trade amount and Max', () => {
  it('opens with a blank amount, not a hardcoded 100', () => {
    expect(QUICK_TRADE_INITIAL_AMOUNT).toBe(0)
    expect(amountInputValue(0)).toBe('')
    expect(amountInputValue(100)).toBe('100')
    expect([...QUICK_TRADE_AMOUNT_PRESETS]).toEqual([10, 50, 100])
  })

  it('does not request preview when amount is blank or 0', () => {
    expect(shouldRequestQuickTradePreview({ amount: 0, executable: true, userId: 1, marketId: 7 })).toBe(
      false,
    )
    expect(shouldRequestQuickTradePreview({ amount: 100, executable: true, userId: 1, marketId: 7 })).toBe(
      true,
    )
    expect(shouldRequestQuickTradePreview({ amount: 100, executable: false, userId: 1, marketId: 7 })).toBe(
      false,
    )
  })

  it('disables CTA when amount is 0', () => {
    expect(
      quickTradeCtaDisabled({ amount: 0, executable: true, matchedTon: null }),
    ).toBe(true)
    expect(
      quickTradeCtaDisabled({ amount: 100, executable: true, matchedTon: 100 }),
    ).toBe(false)
  })

  it('Max is the top executable level, not balance or full book depth', () => {
    expect(topExecutableTon({ odds: 2, liquidityTon: 66 })).toBe(66)
    expect(topExecutableTon({ odds: null, liquidityTon: null })).toBe(0)
    expect(formatMaxPreset(66)).toBe('66')
    expect(presetExceedsBalance(66, 50)).toBe(true)
    expect(presetExceedsBalance(66, 100)).toBe(false)
    expect(presetExceedsBalance(100, 80)).toBe(true)
  })

  it('never rounds Max above executable liquidity and hides nano-level dust', () => {
    expect(normalizeQuickTradeMaxAmount(3750.00507143)).toBe(3750.005)
    expect(formatMaxPreset(3750.005)).toBe('3750.005')
    expect(normalizeQuickTradeMaxAmount(0.00507143)).toBe(0.005)
  })
})

describe('IOC execution floor', () => {
  it('uses the protocol minimum only for discovery preview, not as a place lock', () => {
    expect(iocDiscoveryOdds()).toBe(IOC_MIN_ACCEPTABLE_ODDS)
    expect(iocExecutionOdds()).toBe(IOC_MIN_ACCEPTABLE_ODDS)
    expect(iocExecutionOdds(null)).toBe(IOC_MIN_ACCEPTABLE_ODDS)
  })

  it('locks the displayed worst odds without snapping to 1e-6', () => {
    expect(iocAcceptedOdds(1.99)).toBe(1.99)
    expect(iocAcceptedOdds(1.990000258303547)).toBe(1.990000258303547)
    expect(iocAcceptedOdds(null)).toBeNull()
    expect(iocAcceptedOdds(0)).toBeNull()
  })

  it('keeps a higher min-acceptable floor for a future slippage control', () => {
    expect(iocExecutionOdds(1.99)).toBe(1.99)
    expect(iocExecutionOdds(1)).toBe(IOC_MIN_ACCEPTABLE_ODDS)
  })
})
