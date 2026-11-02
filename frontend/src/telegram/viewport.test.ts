import { afterEach, describe, expect, it, vi } from 'vitest'
import { syncTelegramViewport } from './viewport'
import type { TelegramWebApp } from './webapp'

const cleanups: (() => void)[] = []
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup()
  vi.unstubAllGlobals()
})

function environment(host: TelegramWebApp = {}, height = 844) {
  const properties = new Map<string, string>()
  const attributes = new Map<string, string>()
  const listeners = new Map<string, () => void>()
  const visualViewport = Object.assign(new EventTarget(), { height, offsetTop: 0, scale: 1 })
  const win = Object.assign(new EventTarget(), { innerHeight: height, visualViewport, Telegram: { WebApp: host } })
  const doc = Object.assign(new EventTarget(), {
    activeElement: { matches: (): boolean => false },
    documentElement: {
      style: {
        getPropertyValue: (name: string) => properties.get(name) ?? '',
        getPropertyPriority: () => '',
        setProperty: (name: string, value: string) => properties.set(name, value),
        removeProperty: (name: string) => properties.delete(name),
      },
      getAttribute: (name: string) => attributes.get(name) ?? null,
      setAttribute: (name: string, value: string) => attributes.set(name, value),
      removeAttribute: (name: string) => attributes.delete(name),
    },
  })
  host.onEvent ??= vi.fn((event, callback) => { listeners.set(event, callback) })
  host.offEvent ??= vi.fn((event, callback) => { if (listeners.get(event) === callback) listeners.delete(event) })
  vi.stubGlobal('window', win)
  vi.stubGlobal('document', doc)
  const start = () => { const stop = syncTelegramViewport(); cleanups.push(stop); return stop }
  return { properties, attributes, listeners, win, doc, visualViewport, start }
}

describe('V1 Telegram viewport', () => {
  it('does not request fullscreen in an ordinary browser even when SDK methods exist', () => {
    const requestFullscreen = vi.fn()
    const env = environment({ requestFullscreen, isVersionAtLeast: () => true })
    env.start()
    expect(requestFullscreen).not.toHaveBeenCalled()
    expect(env.properties.get('--betton-viewport-height')).toBe('844px')
    expect(env.attributes.get('data-betton-host')).toBe('false')
  })

  it('requests fullscreen once, including StrictMode cleanup/remount, and follows the host response', () => {
    const requestFullscreen = vi.fn()
    const host = { initData: 'test-host-context', requestFullscreen, isVersionAtLeast: vi.fn(() => true), isFullscreen: false, viewportStableHeight: 600 }
    const env = environment(host)
    env.start()()
    env.start()
    expect(requestFullscreen).toHaveBeenCalledOnce()
    expect(host.isVersionAtLeast).toHaveBeenCalledWith('8.0')
    expect(env.attributes.get('data-betton-fullscreen')).toBe('false')
    host.isFullscreen = true
    host.viewportStableHeight = 844
    env.listeners.get('fullscreenChanged')?.()
    expect(env.attributes.get('data-betton-fullscreen')).toBe('true')
    expect(env.properties.get('--betton-viewport-height')).toBe('844px')
  })

  it.each([false, undefined])('keeps older or unknown clients in expanded mode (%s)', (supported) => {
    const requestFullscreen = vi.fn()
    const env = environment({ initData: 'host', requestFullscreen, isVersionAtLeast: supported === undefined ? undefined : () => supported, viewportStableHeight: 550 })
    env.start()
    expect(requestFullscreen).not.toHaveBeenCalled()
    expect(env.attributes.get('data-betton-compact')).toBe('true')
  })

  it('does not request fullscreen again when the host is already fullscreen', () => {
    const requestFullscreen = vi.fn()
    environment({ initData: 'host', requestFullscreen, isFullscreen: true, isVersionAtLeast: () => true }).start()
    expect(requestFullscreen).not.toHaveBeenCalled()
  })

  it('survives a synchronous rejection and does not retry on layout events or remount', () => {
    const requestFullscreen = vi.fn(() => { throw new Error('UNSUPPORTED') })
    const env = environment({ initData: 'host', requestFullscreen, isVersionAtLeast: () => true, viewportStableHeight: 550 })
    const stop = env.start()
    env.listeners.get('fullscreenFailed')?.()
    env.listeners.get('viewportChanged')?.()
    stop()
    env.start()
    expect(requestFullscreen).toHaveBeenCalledOnce()
    expect(env.properties.get('--betton-viewport-height')).toBe('550px')
  })

  it('updates both system and content insets independently after rotation', () => {
    const host = { initData: 'host', safeAreaInset: { top: 24, bottom: 20, left: 0 }, contentSafeAreaInset: { top: 46, bottom: 0, left: 0 } }
    const env = environment(host)
    env.start()
    expect(env.properties.get('--betton-system-top')).toBe('24px')
    expect(env.properties.get('--betton-content-top')).toBe('46px')
    host.safeAreaInset = { top: 0, bottom: 0, left: 44 }
    host.contentSafeAreaInset = { top: 32, bottom: 0, left: 0 }
    env.listeners.get('safeAreaChanged')?.()
    env.listeners.get('contentSafeAreaChanged')?.()
    expect(env.properties.get('--betton-system-left')).toBe('44px')
    expect(env.properties.get('--betton-system-bottom')).toBe('0px')
    expect(env.properties.get('--betton-content-top')).toBe('32px')
  })

  it.each([550, 600, 700, 844])('sets compact mode using usable height (%i)', (height) => {
    const env = environment({ initData: 'host', viewportStableHeight: height, safeAreaInset: { top: 24, bottom: 20 }, contentSafeAreaInset: { top: 46 } })
    env.start()
    expect(env.properties.get('--betton-viewport-height')).toBe(`${height}px`)
    expect(env.attributes.get('data-betton-compact')).toBe(String(height - 90 < 700))
  })

  it('keeps host stable height during animations, but moves actions above an editing keyboard', () => {
    const env = environment({ initData: 'host', viewportStableHeight: 844 })
    env.start()
    env.visualViewport.height = 460
    env.visualViewport.dispatchEvent(new Event('resize'))
    expect(env.properties.get('--betton-viewport-height')).toBe('844px')
    env.doc.activeElement = { matches: () => true }
    env.doc.dispatchEvent(new Event('focusin'))
    expect(env.properties.get('--betton-viewport-height')).toBe('460px')
    expect(env.attributes.get('data-betton-keyboard')).toBe('true')
    env.visualViewport.height = 844
    env.visualViewport.dispatchEvent(new Event('resize'))
    expect(env.properties.get('--betton-viewport-height')).toBe('844px')
    expect(env.attributes.get('data-betton-keyboard')).toBe('false')
  })

  it('does not interpret pinch zoom as a keyboard', () => {
    const env = environment({ initData: 'host', viewportStableHeight: 844 })
    env.doc.activeElement = { matches: () => true }
    env.visualViewport.scale = 2
    env.visualViewport.height = 422
    env.start()
    expect(env.attributes.get('data-betton-keyboard')).toBe('false')
    expect(env.properties.get('--betton-viewport-height')).toBe('844px')
  })

  it('rejects invalid host geometry and falls back to the browser height', () => {
    const env = environment({ initData: 'host', viewportStableHeight: NaN, safeAreaInset: { top: -8, bottom: Infinity } }, 600)
    env.start()
    expect(env.properties.get('--betton-viewport-height')).toBe('600px')
    expect(env.properties.get('--betton-system-top')).toBe('0px')
    expect(env.properties.get('--betton-system-bottom')).toBe('0px')
  })

  it('restores existing CSS and attributes and removes every event subscription on cleanup', () => {
    const env = environment({ initData: 'host', viewportStableHeight: 600 })
    env.properties.set('--betton-viewport-height', '900px')
    env.attributes.set('data-betton-compact', 'previous')
    env.start()()
    expect([...env.properties]).toEqual([['--betton-viewport-height', '900px']])
    expect([...env.attributes]).toEqual([['data-betton-compact', 'previous']])
    expect(env.listeners.size).toBe(0)
    env.win.innerHeight = 500
    env.win.dispatchEvent(new Event('resize'))
    env.visualViewport.dispatchEvent(new Event('resize'))
    env.doc.dispatchEvent(new Event('focusin'))
    expect(env.properties.get('--betton-viewport-height')).toBe('900px')
  })
})
