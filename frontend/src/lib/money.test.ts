import { describe, expect, it } from 'vitest'
import { moneyJsonValue } from './money'
import { closeAtToIso, formatCloseAtLabel, fromDatetimeLocalValue, toDatetimeLocalValue } from './datetime'

describe('moneyJsonValue', () => {
  it('keeps whole TON and 9-decimal nano without float dust', () => {
    expect(moneyJsonValue(100)).toBe('100')
    expect(moneyJsonValue(0.01)).toBe('0.01')
    expect(moneyJsonValue(10.5)).toBe('10.5')
  })
})

describe('close-at conversion', () => {
  it('round-trips a local datetime-local value to ISO for POST /markets', () => {
    const parsed = fromDatetimeLocalValue('2026-09-20T20:00')
    expect(parsed).not.toBeNull()
    expect(toDatetimeLocalValue(parsed as Date)).toBe('2026-09-20T20:00')
    expect(closeAtToIso(parsed as Date)).toContain('T')
    expect(formatCloseAtLabel(parsed as Date)).toContain('2026')
  })
})
