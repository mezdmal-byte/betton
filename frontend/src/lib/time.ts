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
): string {
  if (status === 'resolved') return 'Итог'
  if (status === 'cancelled') return 'Отмена'
  if (status === 'closed') return 'Приём завершён'
  if (status === 'pending') return 'На проверке'
  if (status === 'rejected') return 'Отклонено'
  const date = parseDate(closeAt)
  if (!date) return ''
  const ms = date.getTime() - now.getTime()
  if (ms <= 0) return 'закрыто'
  const mins = Math.max(1, Math.round(ms / 60000))
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days >= 1) return `${days} д`
  if (hours >= 1) return `${hours} ч`
  return `${mins} мин`
}
