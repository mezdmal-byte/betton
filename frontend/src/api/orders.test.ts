import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './client'
import { isInsufficientBalanceError, mapPlaceError } from './errors'
import { IdempotencyKeys, orderFingerprint } from './idempotency'
import { cancelOrder, placeOrder, previewOrder } from './orders'
import { buildCreateMarketPayload } from './adapters'
import { createMarket } from './markets'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('idempotent request_id', () => {
  it('reuses the same request_id for an unchanged fingerprint and issues a new one after clear', () => {
    const keys = new IdempotencyKeys()
    const fingerprint = orderFingerprint({
      marketId: 1,
      outcome: 0,
      money: '100',
      odds: '1.82',
      kind: 'ioc',
    })
    const first = keys.forFingerprint(fingerprint)
    const second = keys.forFingerprint(fingerprint)
    expect(first).toBe(second)
    expect(first.length).toBeGreaterThanOrEqual(8)
    keys.clear(fingerprint)
    const third = keys.forFingerprint(fingerprint)
    expect(third).not.toBe(first)
  })
})

describe('order client', () => {
  it('posts preview and place using the existing P2P contract', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const body = JSON.parse(String(init?.body))
      if (url.endsWith('/orders/quote')) {
        expect(body).toEqual({ outcome: 0, money: '100', odds: 1.00001, kind: 'ioc' })
        return jsonResponse({
          limit_odds: 1.00001,
          kind: 'ioc',
          requested: { matched: 100, remaining: 0, payout: 182, average_odds: 1.82, worst_odds: 1.801 },
          available: { matched: 100, remaining: 0, payout: 182, worst_odds: 1.801 },
        })
      }
      expect(url).toBe('/markets/42/orders')
      expect(body.kind).toBe('ioc')
      expect(body.odds).toBe(1.00001)
      expect(body.request_id).toMatch(/.{8,}/)
      return jsonResponse({
        id: 7,
        market_id: 42,
        outcome: 0,
        odds: 1.801,
        amount: 100,
        remaining: 0,
        filled: 100,
        refunded: 0,
        kind: 'ioc',
        status: 'filled',
        request_id: body.request_id,
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const preview = await previewOrder(42, { outcome: 0, money: '100', odds: 1.00001, kind: 'ioc' })
    expect(preview.requested.matched).toBe(100)
    const placed = await placeOrder(42, {
      outcome: 0,
      money: '100',
      odds: 1.00001,
      kind: 'ioc',
      request_id: 'request-id-1',
    })
    expect(placed.filled).toBe(100)
    expect(placed.request_id).toBe('request-id-1')
  })

  it('posts cancellation to the existing endpoint', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe('/orders/9/cancel')
      return jsonResponse({
        id: 9,
        market_id: 42,
        outcome: 0,
        odds: 1.9,
        amount: 40,
        remaining: 0,
        filled: 0,
        refunded: 40,
        kind: 'limit',
        status: 'cancelled',
        request_id: 'cancel-me',
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    const result = await cancelOrder(9)
    expect(result.status).toBe('cancelled')
    expect(result.refunded).toBe(40)
  })
})

describe('error mapping', () => {
  it('maps insufficient funds from backend detail', () => {
    const error = new ApiError('Недостаточно средств', {
      status: 400,
      code: 'http',
      detail: 'Недостаточно средств',
    })
    expect(isInsufficientBalanceError(error)).toBe(true)
    expect(mapPlaceError(error).kind).toBe('insufficient-balance')
  })
})

describe('moderation payloads', () => {
  it('create payload stays on backend-supported visibility', () => {
    const payload = buildCreateMarketPayload({
      question: 'Будет ли дождь завтра вечером?',
      category: 'sport',
      outcomeA: 'Да',
      outcomeB: 'Нет',
      closeAt: new Date('2026-09-21T12:00:00.000Z'),
      visibility: 'public',
      description: '',
    })
    expect(payload.visibility).toBe('public')
    expect(payload.mechanism).toBe('p2p')
    expect(payload.outcomes).toEqual(['Да', 'Нет'])
  })
})

describe('createMarket client', () => {
  it('posts POST /markets and keeps the returned share token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toBe('/markets')
        expect(init?.method).toBe('POST')
        return jsonResponse({
          id: 88,
          question: 'Будет ли дождь завтра вечером?',
          description: '',
          creator_id: 1,
          category: 'unique',
          outcomes: ['Да', 'Нет'],
          status: 'open',
          visibility: 'unlisted',
          share_token: 'token-xyz',
          mechanism: 'p2p',
        })
      }),
    )
    const created = await createMarket({
      mechanism: 'p2p',
      question: 'Будет ли дождь завтра вечером?',
      description: '',
      category: 'unique',
      outcomes: ['Да', 'Нет'],
      close_at: '2026-09-21T12:00:00.000Z',
      visibility: 'unlisted',
    })
    expect(created.share_token).toBe('token-xyz')
  })
})
