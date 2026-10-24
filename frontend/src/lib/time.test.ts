import { describe, expect, it } from 'vitest'
import { parseDate } from './time'

describe('backend UTC timestamps', () => {
  it('interprets naive SQLAlchemy datetime as UTC and preserves explicit offsets', () => {
    expect(parseDate('2030-04-01T12:30:00')?.toISOString()).toBe('2030-04-01T12:30:00.000Z')
    expect(parseDate('2030-04-01T15:30:00+03:00')?.toISOString()).toBe('2030-04-01T12:30:00.000Z')
    expect(parseDate('not a date')).toBeNull()
  })
})
