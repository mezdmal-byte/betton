import { afterEach, describe, expect, it, vi } from 'vitest'
import { marketShareUrl, telegramShareUrl, webappShareUrl } from './share'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('market share URL', () => {
  it('prefers t.me deep link when bot username is known', () => {
    expect(telegramShareUrl('@SobakaPesBot', 'abc')).toBe('https://t.me/SobakaPesBot?start=market_abc')
    expect(
      marketShareUrl({
        shareToken: 'abc',
        botUsername: 'SobakaPesBot',
        webapp: 'https://example.trycloudflare.com',
      }),
    ).toBe('https://t.me/SobakaPesBot?start=market_abc')
  })

  it('falls back to public /v2/?share= when bot username is missing', () => {
    expect(telegramShareUrl('', 'abc')).toBe('')
    expect(
      marketShareUrl({
        shareToken: 'abc',
        botUsername: '',
        webapp: 'https://example.trycloudflare.com',
      }),
    ).toBe('https://example.trycloudflare.com/v2/?share=abc')
    expect(webappShareUrl('tok', 'https://host/')).toBe('https://host/v2/?share=tok')
  })

  it('uses window origin when webapp is also missing', () => {
    vi.stubGlobal('window', { location: { origin: 'https://local.example' } })
    expect(marketShareUrl({ shareToken: 'zz', botUsername: null, webapp: '' })).toBe(
      'https://local.example/v2/?share=zz',
    )
  })

  it('returns empty when the share token itself is missing', () => {
    expect(marketShareUrl({ shareToken: '', botUsername: 'bot', webapp: 'https://host' })).toBe('')
    expect(
      marketShareUrl({
        shareToken: '  ',
        botUsername: 'bot',
        webapp: 'https://host',
      }),
    ).toBe('')
  })
})
