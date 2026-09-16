import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  localeFromTelegramLanguage,
  persistLocale,
  readStoredLocale,
  resolveInitialLocale,
  translate,
  LOCALE_STORAGE_KEY,
} from './index'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('language selection', () => {
  it('prefers saved locale, then Telegram language, then RU', () => {
    expect(resolveInitialLocale({ stored: 'en', telegramLanguage: 'ru' })).toBe('en')
    expect(resolveInitialLocale({ stored: null, telegramLanguage: 'zh-hans' })).toBe('zh')
    expect(resolveInitialLocale({ stored: null, telegramLanguage: 'de' })).toBe('ru')
    expect(localeFromTelegramLanguage('en-US')).toBe('en')
  })

  it('persists and restores the locale', () => {
    const memory = new Map<string, string>()
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value)
      },
    }
    persistLocale('zh', storage)
    expect(memory.get(LOCALE_STORAGE_KEY)).toBe('zh')
    expect(readStoredLocale(storage)).toBe('zh')
  })

  it('switches visible copy immediately per locale', () => {
    expect(translate('ru', 'nav.feed')).toBe('Рынки')
    expect(translate('en', 'nav.feed')).toBe('Markets')
    expect(translate('zh', 'nav.feed')).toBe('市场')
    expect(translate('en', 'account.fee')).toContain('1%')
  })
})
