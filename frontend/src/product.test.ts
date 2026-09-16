import { describe, expect, it } from 'vitest'
import { backendVisibilityOrUnavailable, mapOrderBookLevels, mapTradesToChartPoints, mapUiStatusToApi } from './api/adapters'
import { translate } from './i18n'
import { queryKeys } from './api/query'

describe('extra status filters', () => {
  it('maps the filter sheet onto backend statuses and resets the feed key', () => {
    expect(['all', 'open', 'closed', 'resolved', 'cancelled'].map(mapUiStatusToApi)).toEqual([
      null,
      'open',
      'closed',
      'resolved',
      'cancelled',
    ])
    const openKey = queryKeys.markets({ sort: 'new', category: 'all', q: '', status: 'open' })
    const closedKey = queryKeys.markets({ sort: 'new', category: 'all', q: '', status: 'closed' })
    expect(openKey).not.toEqual(closedKey)
  })
})

describe('wallet unavailable copy', () => {
  it('keeps honest chain-disconnected wording', () => {
    expect(translate('ru', 'wallet.addressPending')).toContain('блокчейн')
    expect(translate('ru', 'wallet.depositNote')).toContain('тестовый баланс')
    expect(translate('ru', 'wallet.withdrawNote')).toContain('блокчейн')
    expect(translate('en', 'wallet.unavailable')).toMatch(/blockchain/i)
  })
})

describe('help and public profile copy', () => {
  it('explains P2P, fees, and creator share only as detail', () => {
    expect(translate('ru', 'help.lead')).toContain('P2P')
    expect(translate('ru', 'help.book')).toContain('букмекера')
    expect(translate('ru', 'help.quick')).toContain('Быстрая ставка')
    expect(translate('ru', 'help.creatorShare')).toContain('75%')
    expect(translate('ru', 'account.fee')).toBe('Сервисный сбор — 1% только с чистой прибыли победителя.')
    expect(translate('ru', 'profile.public')).toBe('Публичный профиль')
    expect(translate('zh', 'help.title')).toBeTruthy()
  })
})

describe('create visibility mapping', () => {
  it('maps the two real choices onto public/unlisted', () => {
    expect(backendVisibilityOrUnavailable('public')).toEqual({ value: 'public', unsupported: false })
    expect(backendVisibilityOrUnavailable('unlisted')).toEqual({ value: 'unlisted', unsupported: false })
    expect(backendVisibilityOrUnavailable('private').unsupported).toBe(true)
    expect(translate('ru', 'create.unlisted')).toContain('по ссылке')
  })
})

describe('orderbook and trade history adapters', () => {
  it('renders stored book levels and does not invent chart points', () => {
    expect(mapOrderBookLevels([])).toEqual([])
    expect(mapOrderBookLevels([{ odds: 1.8, available: 40 }])).toEqual([{ odds: 1.8, availableTon: 40 }])
    expect(mapTradesToChartPoints(undefined, 0)).toEqual([])
    expect(mapTradesToChartPoints([], 1)).toEqual([])
  })
})
