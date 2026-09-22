import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyDocumentTheme, resolveColorScheme, subscribeThemeChanges, telegramSurfaceVars } from './theme'

afterEach(() => {
  vi.unstubAllGlobals()
})

function fakeRoot() {
  const props: Record<string, string> = {}
  const attrs: Record<string, string> = {}
  return {
    getAttribute: (name: string) => attrs[name] ?? null,
    setAttribute: (name: string, value: string) => {
      attrs[name] = value
    },
    style: {
      colorScheme: '',
      getPropertyValue: (name: string) => props[name] ?? '',
      setProperty: (name: string, value: string) => {
        props[name] = value
      },
      removeProperty: (name: string) => {
        delete props[name]
      },
    },
  }
}

describe('theme', () => {
  it('uses Telegram colorScheme, otherwise prefers-color-scheme', () => {
    expect(resolveColorScheme({ telegramScheme: 'dark', prefersDark: false })).toBe('dark')
    expect(resolveColorScheme({ telegramScheme: 'light', prefersDark: true })).toBe('light')
    expect(resolveColorScheme({ prefersDark: true })).toBe('dark')
    expect(resolveColorScheme({})).toBe('light')
  })

  it('maps Telegram themeParams onto canvas/text without touching outcome colors', () => {
    const vars = telegramSurfaceVars({
      bg_color: '#111111',
      secondary_bg_color: '#222222',
      text_color: '#eeeeee',
      hint_color: '#aaaaaa',
      button_color: '#ff0000',
    })
    expect(vars['--color-canvas']).toBe('#111111')
    expect(vars['--color-text-primary']).toBe('#eeeeee')
    expect(vars['--color-action-primary']).toBeUndefined()
    expect(vars['--color-outcome-a-accent']).toBeUndefined()
  })

  it('applies data-theme and live token overrides', () => {
    const root = fakeRoot()
    applyDocumentTheme('dark', { bg_color: '#101010' }, root as unknown as HTMLElement)
    expect(root.getAttribute('data-theme')).toBe('dark')
    expect(root.style.getPropertyValue('--color-canvas')).toBe('#101010')
    applyDocumentTheme('light', null, root as unknown as HTMLElement)
    expect(root.getAttribute('data-theme')).toBe('light')
    expect(root.style.getPropertyValue('--color-canvas')).toBe('')
  })

  it('reacts to Telegram themeChanged and prefers-color-scheme', () => {
    const onEvent = vi.fn()
    const offEvent = vi.fn()
    vi.stubGlobal('window', {
      Telegram: { WebApp: { onEvent, offEvent } },
      matchMedia: () => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    })
    const onChange = vi.fn()
    const stop = subscribeThemeChanges(onChange)
    expect(onEvent).toHaveBeenCalledWith('themeChanged', onChange)
    stop()
    expect(offEvent).toHaveBeenCalledWith('themeChanged', onChange)
  })
})
