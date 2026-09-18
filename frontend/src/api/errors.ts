import { ApiError, isApiError } from './client'

export function errorDetail(error: unknown): string {
  if (isApiError(error)) return error.detail || error.message
  if (error instanceof Error) return error.message
  return String(error ?? '')
}

export function isInsufficientBalanceError(error: unknown): boolean {
  const detail = errorDetail(error).toLowerCase()
  return detail.includes('недостаточно средств') || detail.includes('not enough funds')
}

export function isStaleQuoteMessage(detail: string): boolean {
  const text = detail.toLowerCase()
  return text.includes('обновите предложение') || text.includes('quote') && text.includes('stale')
}

export function mapPlaceError(error: unknown): { kind: 'insufficient-balance' | 'stale-quote' | 'error'; message: string } {
  const message = errorDetail(error) || 'Не удалось разместить заявку'
  if (isInsufficientBalanceError(error)) {
    return { kind: 'insufficient-balance', message }
  }
  if (isApiError(error) && (error.status === 409 || isStaleQuoteMessage(message))) {
    return { kind: 'stale-quote', message }
  }
  return { kind: 'error', message }
}

export function isApiErrorStatus(error: unknown, status: number): error is ApiError {
  return isApiError(error) && error.status === status
}
