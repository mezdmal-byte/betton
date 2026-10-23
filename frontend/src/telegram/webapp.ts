export type TelegramUserUnsafe = {
  id?: number
  username?: string
  first_name?: string
  last_name?: string
  photo_url?: string
  language_code?: string
}

export type TelegramColorScheme = 'light' | 'dark'
export type TelegramThemeParams = { bg_color?: string; secondary_bg_color?: string; text_color?: string; hint_color?: string; button_color?: string; button_text_color?: string }
export type TelegramBackButton = { isVisible?: boolean; show?: () => void; hide?: () => void; onClick?: (callback: () => void) => void; offClick?: (callback: () => void) => void }
export type TelegramHapticFeedback = { notificationOccurred?: (type: 'error' | 'success' | 'warning') => void; impactOccurred?: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void }

export type TelegramWebApp = {
  initData?: string
  initDataUnsafe?: { user?: TelegramUserUnsafe; start_param?: string }
  ready?: () => void
  expand?: () => void
  close?: () => void
  colorScheme?: TelegramColorScheme
  themeParams?: TelegramThemeParams
  onEvent?: (event: string, callback: () => void) => void
  offEvent?: (event: string, callback: () => void) => void
  openTelegramLink?: (url: string) => void
  openLink?: (url: string) => void
  BackButton?: TelegramBackButton
  HapticFeedback?: TelegramHapticFeedback
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  disableVerticalSwipes?: () => void
}

declare global { interface Window { Telegram?: { WebApp?: TelegramWebApp } } }

export function getTelegramWebApp(): TelegramWebApp | null { if (typeof window === 'undefined') return null; return window.Telegram?.WebApp ?? null }
export function getTelegramInitData(): string | null { const value = getTelegramWebApp()?.initData; if (typeof value !== 'string') return null; const trimmed = value.trim(); return trimmed ? trimmed : null }
export function hasTelegramInitData(): boolean { return Boolean(getTelegramInitData()) }
export function bootTelegramWebApp(): void { const webApp = getTelegramWebApp(); try { webApp?.ready?.(); webApp?.expand?.(); webApp?.disableVerticalSwipes?.() } catch { /* Ordinary browser has no Telegram host. */ } }
export function closeTelegramWebApp(): void { try { getTelegramWebApp()?.close?.() } catch { /* Host gone. */ } }
export function readShareTokenFromContext(): string | null { if (typeof window === 'undefined') return null; const params = new URLSearchParams(window.location.search); const fromQuery = (params.get('share') || '').trim(); if (fromQuery) return fromQuery; const start = getTelegramWebApp()?.initDataUnsafe?.start_param; if (!start) return null; const raw = String(start); const token = raw.startsWith('market_') ? raw.slice('market_'.length) : raw; const cleaned = token.trim(); return cleaned || null }
export function hapticNotification(type: 'error' | 'success' | 'warning'): void { try { getTelegramWebApp()?.HapticFeedback?.notificationOccurred?.(type) } catch { /* Browser fallback: do nothing. */ } }
type BackOwner = { visible: boolean; onBack: () => void }
const backOwners = new WeakMap<TelegramBackButton, BackOwner[]>()
export function syncTelegramBackButton(visible: boolean, onBack: () => void): () => void {
  const button = getTelegramWebApp()?.BackButton
  if (!button) return () => undefined
  const owners = backOwners.get(button) ?? []
  backOwners.set(button, owners)
  const owner = { visible, onBack }
  owners.push(owner)
  const active = () => [...owners].reverse().find(item => item.visible)
  const refresh = () => { if (active()) button.show?.(); else button.hide?.() }
  // The host may notify every registered listener. Only the top screen acts.
  const handler = () => { if (active() === owner) owner.onBack() }
  try { button.onClick?.(handler); refresh() } catch { /* Host gone. */ }
  return () => {
    const index = owners.indexOf(owner)
    if (index >= 0) owners.splice(index, 1)
    try { button.offClick?.(handler); refresh() } catch { /* Host gone. */ }
  }
}
