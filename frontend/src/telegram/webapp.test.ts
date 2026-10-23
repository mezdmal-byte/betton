import { afterEach, describe, expect, it, vi } from 'vitest'
import { bootTelegramWebApp, hapticNotification, readShareTokenFromContext, syncTelegramBackButton } from './webapp'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubWindow(value: Record<string, unknown>) {
  vi.stubGlobal('window', value)
}

describe('Telegram WebApp', () => {
  it('expands the Mini App and keeps vertical swipes inside the app', () => {
    const ready = vi.fn()
    const expand = vi.fn()
    const disableVerticalSwipes = vi.fn()
    stubWindow({
      Telegram: {
        WebApp: { ready, expand, disableVerticalSwipes },
      },
    })

    bootTelegramWebApp()

    expect(ready).toHaveBeenCalledOnce()
    expect(expand).toHaveBeenCalledOnce()
    expect(disableVerticalSwipes).toHaveBeenCalledOnce()
  })
})

describe('Telegram BackButton', () => {
  it('shows on secondary routes and hides on root', () => {
    const show = vi.fn()
    const hide = vi.fn()
    const onClick = vi.fn()
    const offClick = vi.fn()
    stubWindow({
      Telegram: {
        WebApp: {
          BackButton: { show, hide, onClick, offClick },
        },
      },
    })
    const onBack = vi.fn()
    const stop = syncTelegramBackButton(true, onBack)
    expect(show).toHaveBeenCalledOnce()
    expect(onClick).toHaveBeenCalledOnce()
    const handler = onClick.mock.calls[0][0] as () => void
    handler()
    expect(onBack).toHaveBeenCalledOnce()
    stop()
    expect(offClick).toHaveBeenCalledWith(handler)
    expect(hide).toHaveBeenCalled()

    syncTelegramBackButton(false, onBack)
    expect(hide.mock.calls.length).toBeGreaterThan(1)
  })

  it('haptics no-op safely without Telegram', () => {
    stubWindow({})
    expect(() => hapticNotification('success')).not.toThrow()
  })

  it('dispatches Back only to the top visible screen and restores its parent', () => {
    const listeners = new Set<() => void>()
    const button = { show: vi.fn(), hide: vi.fn(), onClick: (fn: () => void) => listeners.add(fn), offClick: (fn: () => void) => listeners.delete(fn) }
    stubWindow({ Telegram: { WebApp: { BackButton: button } } })
    const parent = vi.fn(), child = vi.fn()
    const stopParent = syncTelegramBackButton(true, parent)
    const stopChild = syncTelegramBackButton(true, child)
    Array.from(listeners).forEach(fn => fn())
    expect(child).toHaveBeenCalledOnce()
    expect(parent).not.toHaveBeenCalled()
    stopChild()
    Array.from(listeners).forEach(fn => fn())
    expect(parent).toHaveBeenCalledOnce()
    stopParent()
    expect(button.hide).toHaveBeenCalled()
  })

  it('reads /v2/?share= and Telegram start_param', () => {
    stubWindow({
      Telegram: {
        WebApp: { initDataUnsafe: { start_param: 'market_abc123' } },
      },
      location: { search: '?share=from-query' },
    })
    expect(readShareTokenFromContext()).toBe('from-query')
    stubWindow({
      Telegram: {
        WebApp: { initDataUnsafe: { start_param: 'market_abc123' } },
      },
      location: { search: '' },
    })
    expect(readShareTokenFromContext()).toBe('abc123')
  })
})
