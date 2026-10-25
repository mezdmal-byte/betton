import { getTelegramWebApp, type TelegramThemeParams } from '../telegram/webapp'

export type ColorScheme = 'light' | 'dark'
export type ThemePreference = ColorScheme | 'system'

export const THEME_ATTR = 'data-theme'
export const THEME_STORAGE_KEY = 'betton.theme'

export function isColorScheme(value: string | null | undefined): value is ColorScheme {
  return value === 'light' || value === 'dark'
}

export function prefersColorScheme(): ColorScheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveColorScheme(input?: {
  telegramScheme?: string | null
  prefersDark?: boolean
}): ColorScheme {
  if (input?.telegramScheme === 'dark' || input?.telegramScheme === 'light') return input.telegramScheme
  if (input?.prefersDark) return 'dark'
  return 'light'
}

export function readStoredTheme(storage?: Pick<Storage, 'getItem'> | null): ColorScheme | null {
  try {
    const value = (storage ?? (typeof localStorage === 'undefined' ? null : localStorage))?.getItem(
      THEME_STORAGE_KEY,
    )
    return isColorScheme(value) ? value : null
  } catch {
    return null
  }
}

export function persistTheme(scheme: ColorScheme, storage?: Pick<Storage, 'setItem'> | null): void {
  try {
    ;(storage ?? (typeof localStorage === 'undefined' ? null : localStorage))?.setItem(
      THEME_STORAGE_KEY,
      scheme,
    )
  } catch {
    // Private mode / missing storage.
  }
}

export function clearStoredTheme(storage?: Pick<Storage, 'removeItem'> | null): void {
  try {
    ;(storage ?? (typeof localStorage === 'undefined' ? null : localStorage))?.removeItem(
      THEME_STORAGE_KEY,
    )
  } catch {
    // Private mode / missing storage.
  }
}

export function resolveSystemColorScheme(): ColorScheme {
  const telegram = getTelegramWebApp()
  return resolveColorScheme({
    telegramScheme: telegram?.colorScheme,
    prefersDark: prefersColorScheme() === 'dark',
  })
}

export function resolveBootColorScheme(): ColorScheme {
  return readStoredTheme() ?? resolveSystemColorScheme()
}

function isHexColor(value: string | undefined): value is string {
  if (!value) return false
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())
}

export function telegramSurfaceVars(params: TelegramThemeParams | null | undefined): Record<string, string> {
  const vars: Record<string, string> = {}
  if (!params) return vars
  if (isHexColor(params.bg_color)) vars['--color-canvas'] = params.bg_color.trim()
  if (isHexColor(params.secondary_bg_color)) vars['--color-surface'] = params.secondary_bg_color.trim()
  if (isHexColor(params.text_color)) vars['--color-text-primary'] = params.text_color.trim()
  if (isHexColor(params.hint_color)) vars['--color-text-secondary'] = params.hint_color.trim()
  return vars
}

export function applyDocumentTheme(
  scheme: ColorScheme,
  params?: TelegramThemeParams | null,
  root: HTMLElement | null = typeof document === 'undefined' ? null : document.documentElement,
): void {
  if (!root) return
  root.setAttribute(THEME_ATTR, scheme)
  root.style.colorScheme = scheme

  const allowed = new Set([
    '--color-canvas',
    '--color-surface',
    '--color-text-primary',
    '--color-text-secondary',
  ])
  for (const name of allowed) root.style.removeProperty(name)

  const vars = telegramSurfaceVars(params)
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value)

  try {
    const webApp = getTelegramWebApp()
    const canvas = vars['--color-canvas']
    if (canvas) {
      webApp?.setBackgroundColor?.(canvas)
      webApp?.setHeaderColor?.(canvas)
    }
  } catch {
    // Host optional.
  }
}

export function syncTelegramChrome(scheme: ColorScheme): void {
  const background = scheme === 'dark' ? '#060b0e' : '#f6f5f1'
  try {
    const webApp = getTelegramWebApp()
    webApp?.setBackgroundColor?.(background)
    webApp?.setHeaderColor?.(background)
  } catch {
    // Telegram host is optional in browser preview.
  }
}

export function subscribeThemeChanges(onChange: () => void): () => void {
  const webApp = getTelegramWebApp()
  const media =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null
  const onMedia = () => onChange()

  try {
    webApp?.onEvent?.('themeChanged', onChange)
  } catch {
    // No Telegram host.
  }
  media?.addEventListener?.('change', onMedia)

  return () => {
    try {
      webApp?.offEvent?.('themeChanged', onChange)
    } catch {
      // Host gone.
    }
    media?.removeEventListener?.('change', onMedia)
  }
}
