import { translate, type Locale } from '../i18n'

const CLOSING_SOON_MS = 60 * 60 * 1000

export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function isClosingSoon(closeAt: string | null | undefined, now: Date = new Date()): boolean {
  const date = parseDate(closeAt)
  if (!date) return false
  const delta = date.getTime() - now.getTime()
  return delta > 0 && delta <= CLOSING_SOON_MS
}

export function formatTimeLeft(
  closeAt: string | null | undefined,
  now: Date = new Date(),
  status?: string,
  locale: Locale = 'ru',
): string {
  if (status === 'resolved') return translate(locale, 'market.badgeResult')
  if (status === 'cancelled') return translate(locale, 'market.badgeCancel')
  if (status === 'closed') return translate(locale, 'status.closedOne')
  if (status === 'pending') return translate(locale, 'status.pending')
  if (status === 'rejected') return translate(locale, 'status.rejected')
  const date = parseDate(closeAt)
  if (!date) return ''
  const ms = date.getTime() - now.getTime()
  if (ms <= 0) return translate(locale, 'time.ended')
  const mins = Math.max(1, Math.round(ms / 60000))
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days >= 1) return translate(locale, 'time.d', { d: days })
  if (hours >= 1) return translate(locale, 'time.h', { h: hours })
  return translate(locale, 'time.m', { m: mins })
}
