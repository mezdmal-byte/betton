import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildMarketsQuery, getMarketTrades, listMarkets } from './markets'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('markets query string', () => {
  it('maps feed controls onto backend query params', () => {
    const newest = new URLSearchParams(buildMarketsQuery({ sort: 'new', category: 'all' }))
    expect(newest.get('sort')).toBe('new')
    expect(newest.get('status')).toBe('open')
    expect(newest.get('category')).toBeNull()
    expect(newest.get('limit')).toBe('20')
    expect(newest.get('offset')).toBe('0')

    const allStatus = new URLSearchParams(buildMarketsQuery({ sort: 'new', category: 'all', status: null }))
    expect(allStatus.get('status')).toBeNull()

    const popular = new URLSearchParams(buildMarketsQuery({ sort: 'popular', category: 'sport' }))
    expect(popular.get('sort')).toBe('popular')
    expect(popular.get('category')).toBe('sport')

    const crypto = new URLSearchParams(buildMarketsQuery({ sort: 'new', category: 'crypto' }))
    expect(crypto.get('category')).toBe('crypto')

    const closing = new URLSearchParams(
      buildMarketsQuery({ sort: 'closing', category: 'other', q: ' зенит ' }),
    )
    expect(closing.get('sort')).toBe('closing')
    expect(closing.get('category')).toBe('unique')
    expect(closing.get('q')).toBe('зенит')
  })
})

describe('listMarkets', () => {
  it('reads X-Total-Count and does not send auth when initData is absent', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('/markets?status=open&sort=new&limit=20&offset=0')
      const headers = new Headers(init?.headers)
      expect(headers.has('Authorization')).toBe(false)
      return new Response(JSON.stringify([{ id: 1, question: 'A', outcomes: ['Да', 'Нет'] }]), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Total-Count': '41',
        },
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const page = await listMarkets({ sort: 'new', category: 'all' })
    expect(page.total).toBe(41)
    expect(page.items).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})

describe('getMarketTrades', () => {
  it('treats an empty fill list as success', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toBe('/markets/7/trades')
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })
    })
    vi.stubGlobal('fetch', fetchMock)
    await expect(getMarketTrades(7)).resolves.toEqual([])
  })
})
