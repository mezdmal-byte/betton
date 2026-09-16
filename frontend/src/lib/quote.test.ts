import { describe, expect, it } from 'vitest'
import { marketCancelled, marketResolved, marketYesNo } from '../fixtures/markets'
import {
  marketIsLocked,
  marketIsTradable,
  marketOutcomeQuoteState,
} from './quote'

describe('closed and locked markets', () => {
  const closed = { ...marketYesNo, status: 'closed' as const }

  it('treats closed as locked and not tradable', () => {
    expect(marketIsLocked(closed)).toBe(true)
    expect(marketIsTradable(closed)).toBe(false)
    expect(marketIsTradable(marketYesNo)).toBe(true)
  })

  it('does not give closed outcomes a selected or tradable appearance', () => {
    expect(marketOutcomeQuoteState(closed, 'a', 'a')).toBe('disabled')
    expect(marketOutcomeQuoteState(closed, 'b', 'a')).toBe('disabled')
  })

  it('keeps cancelled disabled and resolved as winner/loser', () => {
    expect(marketOutcomeQuoteState(marketCancelled, 'a', 'a')).toBe('disabled')
    expect(marketOutcomeQuoteState(marketResolved, 'a', 'a')).toBe('winner')
    expect(marketOutcomeQuoteState(marketResolved, 'b', 'a')).toBe('resolved-loser')
  })
})
