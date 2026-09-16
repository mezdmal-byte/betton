import { describe, expect, it } from 'vitest'
import {
  mapApiCategoryToLabel,
  mapCreator,
  mapMarketOut,
  mapUiCategoryToApi,
  mapUiSortToApi,
} from './adapters'
import type { MarketOut } from './types'

const now = new Date('2026-09-16T12:00:00.000Z')

function market(overrides: Partial<MarketOut> = {}): MarketOut {
  return {
    id: 42,
    question: 'Спартак обыграет Зенит?',
    description: 'По официальному протоколу.',
    creator_id: 7,
    category: 'sport',
    outcomes: ['Да', 'Нет'],
    status: 'open',
    accepting_bets: true,
    close_at: '2026-09-16T16:00:00.000Z',
    mechanism: 'p2p',
    best_offers: [
      { odds: 1.82, available: 320 },
      { odds: 2.18, available: 190 },
    ],
    creator: { id: 7, display_name: 'Ира', telegram_username: 'ira' },
    activity: { volume: 40, volume_nano: 40_000_000_000, unique_participants: 3, fills: 2 },
    ...overrides,
  }
}

describe('sort mapping', () => {
  it('maps UI tabs to backend sort modes', () => {
    expect(mapUiSortToApi('new')).toBe('new')
    expect(mapUiSortToApi('popular')).toBe('popular')
    expect(mapUiSortToApi('closing')).toBe('closing')
  })
})

describe('category mapping', () => {
  it('maps UI pills to backend category query', () => {
    expect(mapUiCategoryToApi('all')).toBeUndefined()
    expect(mapUiCategoryToApi('sport')).toBe('sport')
    expect(mapUiCategoryToApi('politics')).toBe('politics')
    expect(mapUiCategoryToApi('other')).toBe('unique')
  })

  it('maps backend categories onto frozen UI labels', () => {
    expect(mapApiCategoryToLabel('sport')).toBe('Спорт')
    expect(mapApiCategoryToLabel('politics')).toBe('Политика')
    expect(mapApiCategoryToLabel('unique')).toBe('Другое')
  })
})

describe('MarketOut → UI market', () => {
  it('maps generic outcome labels, creator, and activity from nano volume', () => {
    const view = mapMarketOut(
      market({
        outcomes: ['Спартак', 'ЦСКА'],
        creator: { id: 9, display_name: 'Нина', telegram_username: 'nina' },
      }),
      now,
    )
    expect(view.id).toBe('42')
    expect(view.category).toBe('Спорт')
    expect(view.outcomeA.label).toBe('Спартак')
    expect(view.outcomeB.label).toBe('ЦСКА')
    expect(view.creator).toEqual({ handle: 'nina', displayName: 'Нина', initials: 'НИ' })
    expect(view.volumeTon).toBe(40)
    expect(view.participants).toBe(3)
    expect(view.creator.handle).not.toBe('vasya')
    expect(view.creator.handle).not.toBe('petya')
  })

  it('maps best offer to odds and liquidity', () => {
    const view = mapMarketOut(market(), now)
    expect(view.outcomeA).toEqual({ label: 'Да', odds: 1.82, liquidityTon: 320 })
    expect(view.outcomeB).toEqual({ label: 'Нет', odds: 2.18, liquidityTon: 190 })
  })

  it('maps missing best offer to no liquidity instead of fake odds', () => {
    const view = mapMarketOut(
      market({
        best_offers: [null, { odds: 2.2, available: 10 }],
      }),
      now,
    )
    expect(view.outcomeA).toEqual({ label: 'Да', odds: null, liquidityTon: null })
    expect(view.outcomeB).toEqual({ label: 'Нет', odds: 2.2, liquidityTon: 10 })
  })

  it('treats a zero available offer as no liquidity', () => {
    const view = mapMarketOut(
      market({
        best_offers: [{ odds: 1.5, available: 0 }, null],
      }),
      now,
    )
    expect(view.outcomeA.odds).toBeNull()
    expect(view.outcomeA.liquidityTon).toBeNull()
  })

  it('does not invent offers when best_offers is absent', () => {
    const view = mapMarketOut(market({ best_offers: null }), now)
    expect(view.outcomeA).toEqual({ label: 'Да', odds: null, liquidityTon: null })
    expect(view.outcomeB).toEqual({ label: 'Нет', odds: null, liquidityTon: null })
  })
})

describe('creator fallback', () => {
  it('does not hardcode fixture handles when creator is missing', () => {
    expect(mapCreator(null)).toEqual({
      handle: 'creator',
      displayName: 'Автор',
      initials: 'АВ',
    })
  })
})
