const MONTHS_RU = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function defaultCloseAt(now: Date = new Date()): Date {
  return new Date(now.getTime() + 24 * 3600 * 1000)
}

export function toDatetimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromDatetimeLocalValue(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const date = new Date(trimmed)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatCloseAtLabel(date: Date): string {
  return `${date.getDate()} ${MONTHS_RU[date.getMonth()]} ${date.getFullYear()} · ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function closeAtToIso(date: Date): string {
  return date.toISOString()
}
