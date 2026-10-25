import { afterEach, describe, expect, it, vi } from 'vitest'
import { approveMarket, rejectMarket, voidMarket } from './moderation'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('moderation client', () => {
  it('posts approve without a new permission model', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('/markets/5/approve')
      expect(init?.method).toBe('POST')
      return new Response(JSON.stringify({ id: 5, status: 'open', question: 'Q', description: '', creator_id: 1, category: 'unique', outcomes: ['Да', 'Нет'] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    const market = await approveMarket(5)
    expect(market.status).toBe('open')
  })

  it('posts reject and void reasons using existing contracts', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const body = JSON.parse(String(init?.body))
      if (url.endsWith('/reject')) {
        expect(body).toEqual({ reason: 'spam' })
      } else {
        expect(url).toBe('/markets/5/cancel')
        expect(body).toEqual({ reason: 'event cancelled' })
      }
      return new Response(JSON.stringify({ id: 5, status: 'rejected', question: 'Q', description: '', creator_id: 1, category: 'unique', outcomes: ['Да', 'Нет'] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    await rejectMarket(5, 'spam')
    await voidMarket(5, 'event cancelled')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
