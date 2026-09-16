import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest, buildRequestHeaders, parseTotalCount } from './client'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('auth headers', () => {
  it('constructs a TMA header from supplied initData', () => {
    expect(buildRequestHeaders({ initData: 'query_id=1&hash=abc' })).toEqual({
      Authorization: 'tma query_id=1&hash=abc',
    })
  })

  it('omits the Authorization header when initData is absent', () => {
    expect(buildRequestHeaders({ initData: null })).toEqual({})
    expect(buildRequestHeaders({ initData: '' })).toEqual({})
    expect(buildRequestHeaders({ initData: '   ' })).toEqual({})
  })

  it('adds the share-token header used by the existing backend', () => {
    expect(buildRequestHeaders({ initData: null, shareToken: 'share-abc' })).toEqual({
      'X-Market-Share-Token': 'share-abc',
    })
  })

  it('sends the TMA header on fetch when initData is supplied', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(headers.get('Authorization')).toBe('tma query_id=1&user=ok')
      return new Response(JSON.stringify({ id: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    await apiRequest('/auth/telegram', {
      method: 'POST',
      jsonBody: {},
      initData: 'query_id=1&user=ok',
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})

describe('X-Total-Count', () => {
  it('parses the total count header', () => {
    expect(parseTotalCount(new Headers({ 'X-Total-Count': '17' }), 0)).toBe(17)
  })

  it('falls back when the header is missing or invalid', () => {
    expect(parseTotalCount(new Headers(), 4)).toBe(4)
    expect(parseTotalCount(new Headers({ 'X-Total-Count': 'nope' }), 4)).toBe(4)
  })
})

describe('401 mapping', () => {
  it('maps 401 to an auth-expired API error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ detail: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    const error = await apiRequest('/auth/telegram', {
      method: 'POST',
      jsonBody: {},
      initData: 'expired',
    }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 401, code: 'auth-expired' })
  })
})
