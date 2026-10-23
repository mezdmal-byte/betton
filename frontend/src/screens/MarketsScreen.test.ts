import { describe, it, expect } from 'vitest'
import { formatActiveOffers } from './MarketsScreen'

describe('funded active offers metric', () => {
  it('uses exact nanoTON without matched-volume fallback', () => {
    expect(formatActiveOffers()).toBe('—')
    expect(formatActiveOffers('0')).toBe('0 TON')
    expect(formatActiveOffers('110000000001')).toBe('110,000000001 TON')
    expect(formatActiveOffers('9223372036854775807')).toContain('854775807 TON')
  })
})
