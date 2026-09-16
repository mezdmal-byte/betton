import { describe, expect, it } from 'vitest'
import {
  applyPersonalizedExecutableQuotes,
  buildCreateMarketPayload,
  classifyIocPlacement,
  IOC_REQUOTE_MESSAGE,
  backendVisibilityOrUnavailable,
  isAdminAccount,
  mapApiCategoryToLabel,
  mapCreator,
  mapMarketOut,
  mapOpenOrder,
  mapOrderPreview,
  mapPlaceResult,
  mapPositions,
  mapTransaction,
  mapUiCategoryToApi,
  mapUiSortToApi,
  moneyForOrder,
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

  it('maps backend closed to closed, not open/cancelled/resolved', () => {
    const view = mapMarketOut(
      market({
        status: 'closed',
        accepting_bets: false,
        best_offers: [
          { odds: 1.82, available: 320 },
          { odds: 2.18, available: 190 },
        ],
      }),
      now,
    )
    expect(view.status).toBe('closed')
    expect(view.status).not.toBe('open')
    expect(view.status).not.toBe('cancelled')
    expect(view.status).not.toBe('resolved')
    expect(view.timeLeft).toBe('Приём завершён')
    expect(view.closeLabel).toBe('Приём завершён')
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

describe('available_to_me executable quotes', () => {
  const view = mapMarketOut(market(), now)

  it('uses available_to_me, not the larger aggregate book', () => {
    const personalized = applyPersonalizedExecutableQuotes(view, {
      sides: [
        [
          { odds: 1.4, available: 500 },
          { odds: 1.5, available: 200 },
        ],
        [{ odds: 2.5, available: 400 }],
      ],
      available_to_me: [[{ odds: 1.82, available: 40 }], [{ odds: 2.18, available: 10 }]],
    })
    expect(personalized.outcomeA).toEqual({ label: 'Да', odds: 1.82, liquidityTon: 40 })
    expect(personalized.outcomeB).toEqual({ label: 'Нет', odds: 2.18, liquidityTon: 10 })
    expect(personalized.outcomeA.liquidityTon).toBeLessThan(500)
  })

  it('maps empty available_to_me to no liquidity on both sides', () => {
    const personalized = applyPersonalizedExecutableQuotes(view, {
      sides: [[{ odds: 1.4, available: 500 }], [{ odds: 2.5, available: 400 }]],
      available_to_me: [[], []],
    })
    expect(personalized.outcomeA).toEqual({ label: 'Да', odds: null, liquidityTon: null })
    expect(personalized.outcomeB).toEqual({ label: 'Нет', odds: null, liquidityTon: null })
  })

  it('maps available_to_me side A and B independently', () => {
    const personalized = applyPersonalizedExecutableQuotes(view, {
      sides: [[{ odds: 1.4, available: 500 }], [{ odds: 2.5, available: 400 }]],
      available_to_me: [[{ odds: 1.6, available: 12 }], []],
    })
    expect(personalized.outcomeA).toEqual({ label: 'Да', odds: 1.6, liquidityTon: 12 })
    expect(personalized.outcomeB).toEqual({ label: 'Нет', odds: null, liquidityTon: null })
  })

  it('does not fall back to aggregate sides when available_to_me is absent', () => {
    const personalized = applyPersonalizedExecutableQuotes(view, {
      sides: [[{ odds: 1.4, available: 500 }], [{ odds: 2.5, available: 400 }]],
    })
    expect(personalized.outcomeA).toEqual({ label: 'Да', odds: null, liquidityTon: null })
    expect(personalized.outcomeB).toEqual({ label: 'Нет', odds: null, liquidityTon: null })
  })
})

describe('LMSR markets', () => {
  it('does not treat LMSR prices as P2P best_offers', () => {
    const view = mapMarketOut(
      market({
        mechanism: 'lmsr',
        best_offers: [{ odds: 1.82, available: 320 }, { odds: 2.18, available: 190 }],
      }),
      now,
    )
    expect(view.mechanism).toBe('lmsr')
    expect(view.outcomeA).toEqual({ label: 'Да', odds: null, liquidityTon: null })
    expect(view.outcomeB).toEqual({ label: 'Нет', odds: null, liquidityTon: null })
  })
})

describe('preview mapping', () => {
  it('maps backend requested matched/remaining/payout without inventing fills', () => {
    const preview = mapOrderPreview({
      limit_odds: 1.82,
      requested: { matched: 40, remaining: 60, payout: 72.8, average_odds: 1.82, worst_odds: 1.82 },
      available: { matched: 40, remaining: 60, payout: 72.8, worst_odds: 1.8 },
    })
    expect(preview.matchedTon).toBe(40)
    expect(preview.remainingTon).toBe(60)
    expect(preview.payoutTon).toBe(72.8)
    expect(preview.availableWorstOdds).toBe(1.8)
  })

  it('maps a zero match as no immediate fill', () => {
    const preview = mapOrderPreview({
      limit_odds: 2,
      requested: { matched: 0, remaining: 100, payout: 0 },
      available: { matched: 0, remaining: 100, payout: 0 },
    })
    expect(preview.matchedTon).toBe(0)
    expect(preview.remainingTon).toBe(100)
  })
})

describe('place result mapping', () => {
  it('keeps backend filled/remaining/refunded as the source of truth', () => {
    const result = mapPlaceResult({
      id: 9,
      market_id: 42,
      outcome: 0,
      odds: 1.8,
      amount: 100,
      remaining: 0,
      filled: 40,
      refunded: 60,
      kind: 'ioc',
      status: 'filled',
      request_id: 'aaaaaaaa',
    })
    expect(result.filledTon).toBe(40)
    expect(result.remainingTon).toBe(0)
    expect(result.refundedTon).toBe(60)
    expect(result.requestedTon).toBe(100)
    expect(result.requestId).toBe('aaaaaaaa')
  })
})

describe('IOC placement classification', () => {
  it('treats filled=0 as a stale/no-liquidity requote, not UI success', () => {
    expect(IOC_REQUOTE_MESSAGE).toBe('Предложение уже изменилось. Обновите коэффициент.')
    expect(
      classifyIocPlacement({
        amount: 50,
        filled: 0,
        refunded: 50,
        status: 'cancelled',
      }),
    ).toMatchObject({
      kind: 'empty',
      filledTon: 0,
      refundedTon: 50,
      requestedTon: 50,
      status: 'cancelled',
    })
  })

  it('reports a partial fill from backend filled/refunded without client matching', () => {
    expect(
      classifyIocPlacement({
        amount: 100,
        filled: 40,
        refunded: 60,
        status: 'filled',
      }),
    ).toMatchObject({
      kind: 'partial',
      filledTon: 40,
      refundedTon: 60,
      requestedTon: 100,
      status: 'filled',
    })
  })

  it('reports a full fill from backend filled/amount', () => {
    expect(
      classifyIocPlacement({
        amount: 25,
        filled: 25,
        refunded: 0,
        status: 'filled',
      }),
    ).toMatchObject({
      kind: 'full',
      filledTon: 25,
      refundedTon: 0,
      requestedTon: 25,
      status: 'filled',
    })
  })
})

describe('orders adapter', () => {
  it('maps open remainder and hides filled orders from the active list', () => {
    const open = mapOpenOrder({
      id: 3,
      market_id: 42,
      outcome: 0,
      odds: 1.9,
      amount: 100,
      remaining: 40,
      filled: 60,
      refunded: 0,
      kind: 'limit',
      status: 'open',
      request_id: 'bbbbbbbb',
      question: 'Спартак обыграет Зенит?',
      outcome_name: 'Да',
    })
    expect(open).toMatchObject({
      remainingTon: 40,
      filledTon: 60,
      status: 'Частично исполнена',
      canCancel: true,
      outcomeLabel: 'Да',
    })
    expect(
      mapOpenOrder({
        id: 4,
        market_id: 42,
        outcome: 0,
        odds: 1.9,
        amount: 100,
        remaining: 0,
        filled: 100,
        refunded: 0,
        kind: 'limit',
        status: 'filled',
        request_id: 'cccccccc',
      }),
    ).toBeNull()
  })
})

describe('positions adapter', () => {
  it('maps staked cost and potential payout from backend vectors', () => {
    const rows = mapPositions({
      market_id: 42,
      shares: [178, 0],
      costs: [100, 0],
      claimed: false,
      tip_paid: 0,
      market: market(),
    })
    expect(rows).toEqual([
      {
        id: '42-0',
        marketId: 42,
        question: 'Спартак обыграет Зенит?',
        outcomeLabel: 'Да',
        amountTon: 100,
        avgOdds: 1.78,
        potentialPayoutTon: 178,
      },
    ])
  })
})

describe('history adapter', () => {
  it('maps transaction type onto frozen action labels', () => {
    const row = mapTransaction({
      id: 'reserve:1',
      type: 'reserve',
      market_id: 42,
      question: 'Спартак обыграет Зенит?',
      created_at: '2026-09-16T12:00:00.000Z',
      amount_nano: -100_000_000_000,
      amount: -100,
      display_nano: -100_000_000_000,
      display_amount: -100,
    })
    expect(row.action).toBe('Заявка создана')
    expect(row.amountTon).toBe(-100)
  })
})

describe('create market payload', () => {
  it('sends P2P public/unlisted values the backend already supports', () => {
    const closeAt = new Date('2026-09-20T17:00:00.000Z')
    const payload = buildCreateMarketPayload({
      question: 'Спартак обыграет Зенит?',
      category: 'other',
      outcomeA: 'Да',
      outcomeB: 'Нет',
      closeAt,
      visibility: 'unlisted',
      description: 'По протоколу.',
    })
    expect(payload).toEqual({
      mechanism: 'p2p',
      question: 'Спартак обыграет Зенит?',
      description: 'По протоколу.',
      category: 'unique',
      outcomes: ['Да', 'Нет'],
      close_at: closeAt.toISOString(),
      visibility: 'unlisted',
    })
  })

  it('does not send UI-only private visibility', () => {
    expect(backendVisibilityOrUnavailable('private')).toEqual({ value: 'public', unsupported: true })
    expect(backendVisibilityOrUnavailable('unlisted')).toEqual({ value: 'unlisted', unsupported: false })
  })

  it('preserves unlisted share token from the backend response', () => {
    const view = mapMarketOut(
      market({
        visibility: 'unlisted',
        share_token: 'share-token-abc',
      }),
      now,
    )
    expect(view.shareToken).toBe('share-token-abc')
    expect(view.visibility).toBe('unlisted')
  })
})

describe('admin visibility', () => {
  it('shows admin from backend is_admin and hides it otherwise', () => {
    expect(isAdminAccount({ is_admin: true })).toBe(true)
    expect(isAdminAccount({ isAdmin: true })).toBe(true)
    expect(isAdminAccount({ is_admin: false })).toBe(false)
    expect(isAdminAccount(null)).toBe(false)
  })
})

describe('money payload', () => {
  it('serializes TON without inventing extra dust', () => {
    expect(moneyForOrder(100)).toBe('100')
    expect(moneyForOrder(10.5)).toBe('10.5')
  })
})
