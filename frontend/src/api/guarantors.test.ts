import { describe, expect, it } from 'vitest'
import { deadlineLabel, displayTime, remainingSeconds } from './guarantors'

describe('guarantor deadlines', () => {
  it('treats server-naive dates as UTC and never shows negative time', () => {
    const now = Date.parse('2026-10-08T12:00:00Z')
    expect(remainingSeconds('2026-10-08T12:01:00', now)).toBe(60)
    expect(deadlineLabel('2026-10-08T12:01:03Z', now)).toBe('Осталось 1 мин 3 с')
    expect(remainingSeconds('2026-10-08T11:59:00', now)).toBe(0)
  })
  it('formats dates for the Russian interface, not US AM/PM', () => {
    expect(displayTime('2026-10-08T12:00:00')).not.toMatch(/AM|PM|\//)
    expect(displayTime('2026-10-08T12:00:00')).toMatch(/08\.10\.(20)?26/)
  })
})
