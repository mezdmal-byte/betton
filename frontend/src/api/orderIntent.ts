import { apiRequest, isApiError } from './client'
import { newRequestId } from './idempotency'
import { orderByRequest, placeOrder } from './orders'
import { shareTokenFor } from './share'
import type { OrderOut, OrderPlaceBody } from './types'

export const ORDER_INTENT_TTL = 7 * 24 * 60 * 60 * 1000
export const orderIntentKey = (userId: number) => `betton:order-intent:v1:${userId}`
export const INTENT_EVENT = 'betton:order-intent'
export const UNKNOWN_RESULT = 'Не удалось определить результат. Проверьте историю перед повторной попыткой.'
type Payload = Omit<OrderPlaceBody, 'request_id' | 'expected_user_id'>
export type OrderIntent = { userId: number; requestId: string; marketId: number; createdAt: number; operation?: 'legacy_buy'; body?: Payload | {kind:'legacy_buy';outcome:number;money:string|number} }
const running = new Map<number, Promise<OrderOut>>()
function changed() { if (typeof window !== 'undefined') window.dispatchEvent(new Event(INTENT_EVENT)) }
function save(userId: number, intent: OrderIntent) { localStorage.setItem(orderIntentKey(userId), JSON.stringify(intent)); changed() }
export function readOrderIntent(userId: number): OrderIntent | null {
  const raw = localStorage.getItem(orderIntentKey(userId))
  if (!raw) return null
  const value = JSON.parse(raw) as OrderIntent
  if (value.userId !== userId || typeof value.requestId !== 'string' || value.requestId.length < 8 || value.requestId.length > 64 || !Number.isSafeInteger(value.marketId) || value.marketId <= 0 || !Number.isFinite(value.createdAt)) throw new Error(UNKNOWN_RESULT)
  if (value.body && (!['limit','ioc','legacy_buy'].includes(value.body.kind) || ![0,1].includes(value.body.outcome)
    || !Number.isFinite(Number(value.body.money)) || Number(value.body.money) <= 0
    || (value.body.kind !== 'legacy_buy' && (!Number.isFinite(Number(value.body.odds)) || Number(value.body.odds) <= 1))
    || Object.keys(value.body).some(key => !['kind','outcome','money','odds'].includes(key)))) throw new Error(UNKNOWN_RESULT)
  // Keep the minimal unresolved identifier as a safety tombstone; never issue a new key on expiry.
  if (Date.now() - value.createdAt > ORDER_INTENT_TTL && value.body) { delete value.body; save(userId, value) }
  return value
}
function clear(userId: number, requestId: string) {
  if (readOrderIntent(userId)?.requestId === requestId) { localStorage.removeItem(orderIntentKey(userId)); changed() }
}
function serialized(userId: number, fn: () => Promise<OrderOut>): Promise<OrderOut> {
  const active = running.get(userId)
  if (active) return active
  const promise = Promise.resolve().then(fn).finally(() => running.delete(userId))
  running.set(userId, promise)
  return promise
}
export function submitOrderIntent(userId: number, marketId: number, body: Payload): Promise<OrderOut> {
  return serialized(userId, async () => {
    if (!userId || readOrderIntent(userId)) throw new Error('Сначала проверьте результат предыдущей операции.')
    const intent: OrderIntent = {userId, marketId, requestId: newRequestId(), createdAt: Date.now(), body: {outcome:body.outcome,money:body.money,odds:body.odds,kind:body.kind}}
    save(userId, intent) // No request if durable storage fails.
    return send(intent)
  })
}
async function send(intent: OrderIntent): Promise<OrderOut> {
  if (!intent.body) throw new Error(UNKNOWN_RESULT)
  try {
    const result = intent.body.kind === 'legacy_buy'
      ? (await apiRequest<OrderOut>(`/markets/${intent.marketId}/buy`,{method:'POST',jsonBody:{outcome:intent.body.outcome,money:intent.body.money,request_id:intent.requestId,expected_user_id:intent.userId},shareToken:shareTokenFor(intent.marketId)})).data
      : await placeOrder(intent.marketId, {...intent.body, request_id:intent.requestId, expected_user_id:intent.userId}, shareTokenFor(intent.marketId))
    if (result.request_id !== intent.requestId || result.market_id !== intent.marketId) throw new Error(UNKNOWN_RESULT)
    return result
  } catch (error) {
    // 400/422 are definitive pre-commit validation/placement rejections. 401/403/409/5xx remain uncertain.
    if (isApiError(error) && [400,422].includes(error.status)) clear(intent.userId,intent.requestId)
    throw error
  }
}
export async function checkOrderIntent(userId: number): Promise<OrderOut | null> {
  const intent = readOrderIntent(userId)
  if (!intent) return null
  const result = await orderByRequest(userId, intent.requestId, intent.operation === 'legacy_buy')
  if (result) {
    if (result.request_id !== intent.requestId || result.market_id !== intent.marketId) throw new Error(UNKNOWN_RESULT)
  }
  return result
}
export function retryOrderIntent(userId: number): Promise<OrderOut> {
  return serialized(userId, async () => {
    const intent = readOrderIntent(userId)
    if (!intent) throw new Error('Нет незавершённой операции.')
    const result = await checkOrderIntent(userId)
    return result ?? send(intent) // Same body/key, even if the first POST is still committing.
  })
}

export function completeOrderIntent(userId: number, order: OrderOut) {
  const intent = readOrderIntent(userId)
  if (intent && intent.marketId === order.market_id && intent.requestId === order.request_id) clear(userId,order.request_id)
}
