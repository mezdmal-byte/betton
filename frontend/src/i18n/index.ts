import { createContext, createElement, useContext, useMemo, useState, type ReactNode } from 'react'
import { MESSAGES, type Locale, type MessageKey } from './messages'
import { getTelegramWebApp } from '../telegram/webapp'

export type { Locale, MessageKey } from './messages'
export { LOCALES, MESSAGES } from './messages'

export const LOCALE_STORAGE_KEY = 'betton.locale'

export type TranslateFn = (key: MessageKey, vars?: Record<string, string | number>) => string

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] == null ? `{${name}}` : String(vars[name]),
  )
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'ru' || value === 'en' || value === 'zh'
}

export function localeFromTelegramLanguage(code: string | null | undefined): Locale | null {
  if (!code) return null
  const lower = code.trim().toLowerCase()
  if (lower.startsWith('ru')) return 'ru'
  if (lower.startsWith('en')) return 'en'
  if (lower.startsWith('zh')) return 'zh'
  return null
}

export function readStoredLocale(storage?: Pick<Storage, 'getItem'> | null): Locale | null {
  try {
    const raw = (storage ?? (typeof localStorage === 'undefined' ? null : localStorage))?.getItem(
      LOCALE_STORAGE_KEY,
    )
    return isLocale(raw) ? raw : null
  } catch {
    return null
  }
}

export function persistLocale(locale: Locale, storage?: Pick<Storage, 'setItem'> | null): void {
  try {
    ;(storage ?? (typeof localStorage === 'undefined' ? null : localStorage))?.setItem(
      LOCALE_STORAGE_KEY,
      locale,
    )
  } catch {
    // Private mode / missing storage.
  }
}

export function resolveInitialLocale(input?: {
  stored?: string | null
  telegramLanguage?: string | null
}): Locale {
  if (isLocale(input?.stored ?? null)) return input!.stored as Locale
  return localeFromTelegramLanguage(input?.telegramLanguage) ?? 'ru'
}

export function resolveBootLocale(): Locale {
  const stored = readStoredLocale()
  const telegramLanguage = getTelegramWebApp()?.initDataUnsafe?.user?.language_code
  return resolveInitialLocale({ stored, telegramLanguage })
}

export function isMessageKey(value: string): value is MessageKey {
  return value in MESSAGES.ru
}

export function translate(locale: Locale, key: MessageKey, vars?: Record<string, string | number>): string {
  const table = MESSAGES[locale] ?? MESSAGES.ru
  return interpolate(table[key] ?? MESSAGES.ru[key] ?? key, vars)
}

type I18nValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslateFn
}

const I18nContext = createContext<I18nValue>({
  locale: 'ru',
  setLocale: () => undefined,
  t: (key, vars) => translate('ru', key, vars),
})

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale ?? resolveBootLocale())
  const value = useMemo<I18nValue>(() => {
    const setLocale = (next: Locale) => {
      setLocaleState(next)
      persistLocale(next)
    }
    return {
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    }
  }, [locale])
  return createElement(I18nContext.Provider, { value }, children)
}

export function useI18n(): I18nValue {
  return useContext(I18nContext)
}

export function useT(): TranslateFn {
  return useI18n().t
}
