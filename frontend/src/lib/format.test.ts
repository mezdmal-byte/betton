import { describe, expect, it } from 'vitest'
import { formatTon, formatTonFull } from './format'

describe('formatTon', () => {
  it('keeps compact K formatting for large values', () => {
    expect(formatTon(320)).toBe('320 TON')
    expect(formatTon(1000)).toBe('1K TON')
    expect(formatTon(1500)).toBe('1.5K TON')
    expect(formatTon(1240)).toBe('1.2K TON')
  })

  it('does not round a positive amount down to 0 TON', () => {
    expect(formatTon(1.5)).toBe('1.5 TON')
    expect(formatTon(0.25)).toBe('0.25 TON')
    expect(formatTon(0.0125)).toBe('0.0125 TON')
    expect(formatTon(0.00005)).toBe('<0.0001 TON')
  })

  it('still renders exact zero as 0 TON', () => {
    expect(formatTon(0)).toBe('0 TON')
  })
})

describe('formatTonFull', () => {
  it('keeps whole-TON grouping and does not hide tiny positives', () => {
    expect(formatTonFull(1240)).toBe('1 240 TON')
    expect(formatTonFull(0.25)).toBe('0.25 TON')
    expect(formatTonFull(0.00005)).toBe('<0.0001 TON')
  })
})
