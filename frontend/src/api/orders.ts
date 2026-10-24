import { apiRequest } from './client'
import type {
  OrderKind,
  OrderOut,
  OrderPlaceBody,
  OrderPreviewBody,
  OrderPreviewOut,
} from './types'
import { iocAcceptedOdds, iocExecutionOdds } from '../lib/quickTrade'

export async function previewOrder(
  marketId: number | string,
  body: OrderPreviewBody,
  shareToken?: string | null,
): Promise<OrderPreviewOut> {
  const { data } = await apiRequest<OrderPreviewOut>(`/markets/${marketId}/orders/quote`, {
    method: 'POST',
    jsonBody: body,
    shareToken,
  })
  return data
}

export async function placeOrder(
  marketId: number | string,
  body: OrderPlaceBody,
  shareToken?: string | null,
): Promise<OrderOut> {
  const { data } = await apiRequest<OrderOut>(`/markets/${marketId}/orders`, {
    method: 'POST',
    jsonBody: body,
    shareToken,
  })
  return data
}

export async function cancelOrder(orderId: number | string): Promise<OrderOut> {
  const { data } = await apiRequest<OrderOut>(`/orders/${orderId}/cancel`, {
    method: 'POST',
    jsonBody: {},
  })
  return data
}

export async function listOrders(userId: number): Promise<OrderOut[]> {
  const { data } = await apiRequest<OrderOut[]>(`/users/${userId}/orders`)
  return Array.isArray(data) ? data : []
}

export function iocOddsFromPreview(worstOdds: number | null | undefined, fallbackOdds: number): number {
  return iocAcceptedOdds(worstOdds) ?? iocExecutionOdds(fallbackOdds)
}

export function asOrderKind(kind: string | null | undefined): OrderKind {
  return kind === 'ioc' ? 'ioc' : 'limit'
}
