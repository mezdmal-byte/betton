export type TelegramUserUnsafe = {
  id?: number
  username?: string
  first_name?: string
  last_name?: string
  photo_url?: string
  language_code?: string
}

export type TelegramWebApp = {
  initData?: string
  initDataUnsafe?: {
    user?: TelegramUserUnsafe
    start_param?: string
  }
  ready?: () => void
  expand?: () => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null
  return window.Telegram?.WebApp ?? null
}

export function getTelegramInitData(): string | null {
  const value = getTelegramWebApp()?.initData
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export function hasTelegramInitData(): boolean {
  return Boolean(getTelegramInitData())
}

export function bootTelegramWebApp(): void {
  const webApp = getTelegramWebApp()
  try {
    webApp?.ready?.()
    webApp?.expand?.()
  } catch {
    // Ordinary browser has no Telegram host.
  }
}

export function readShareTokenFromContext(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const fromQuery = (params.get('share') || '').trim()
  if (fromQuery) return fromQuery
  const start = getTelegramWebApp()?.initDataUnsafe?.start_param
  if (!start) return null
  const raw = String(start)
  const token = raw.startsWith('market_') ? raw.slice('market_'.length) : raw
  const cleaned = token.trim()
  return cleaned || null
}
