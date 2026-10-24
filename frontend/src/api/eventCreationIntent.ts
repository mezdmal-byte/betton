import { createEvent, type CreateEventBody } from './eventsV3'
import { isApiError } from './client'
import { newRequestId } from './idempotency'

export type EventIntent = { requestId: string; body: CreateEventBody }
export const eventIntentKey = (userId: number) => `betton:event-intent:v1:${userId}`
const running = new Map<string, Promise<Awaited<ReturnType<typeof createEvent>>>>()

export function pendingEventIntent(userId: number): EventIntent | null {
  const raw = localStorage.getItem(eventIntentKey(userId))
  if (!raw) return null
  const parsed = JSON.parse(raw) as EventIntent
  if (!parsed.requestId || !parsed.body || typeof parsed.body !== 'object') {
    throw new Error('Не удалось прочитать незавершённое создание события. Проверьте список своих событий.')
  }
  return parsed
}

// Persist before sending. On an unknown result always replay the saved body/key.
export function submitEventIntent(userId: number, body?: CreateEventBody) {
  const key = eventIntentKey(userId)
  const active = running.get(key)
  if (active) return active
  const saved = pendingEventIntent(userId)
  if (saved && body && JSON.stringify(saved.body) !== JSON.stringify(body)) {
    return Promise.reject(new Error('Сначала проверьте результат предыдущего создания события.'))
  }
  if (!saved && !body) return Promise.reject(new Error('Нет незавершённого создания события.'))
  const intent = saved ?? { requestId: newRequestId(), body: body! }
  // Storage failure stops the request; no volatile fallback for side effects.
  localStorage.setItem(key, JSON.stringify(intent))
  const operation = createEvent(intent.body, intent.requestId).then(result => {
    localStorage.removeItem(key)
    return result
  }).catch(error => {
    // Both validation statuses reject before the atomic creation commits.
    if (isApiError(error) && [400, 422].includes(error.status)) localStorage.removeItem(key)
    throw error
  }).finally(() => running.delete(key))
  running.set(key, operation)
  return operation
}
