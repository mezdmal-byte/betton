import { apiRequest } from './client'
import type {
  ChatMessageCreate,
  ChatMessageOut,
  ChatMessagesPage,
  ChatUnreadOut,
} from './types'

export type ChatScope = { kind: 'lobby' } | { kind: 'market'; marketId: number }

function scopeBase(scope: ChatScope): string {
  return scope.kind === 'lobby' ? '/chat/lobby' : `/markets/${scope.marketId}/chat`
}

export async function getChatMessages(
  scope: ChatScope,
  input: { limit?: number; beforeId?: number | null } = {},
  shareToken?: string | null,
): Promise<ChatMessagesPage> {
  const params = new URLSearchParams()
  params.set('limit', String(input.limit ?? (scope.kind === 'lobby' ? 100 : 50)))
  if (input.beforeId != null) params.set('before_id', String(input.beforeId))
  const { data } = await apiRequest<ChatMessagesPage>(`${scopeBase(scope)}?${params.toString()}`, { shareToken })
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    has_more: Boolean(data?.has_more),
    next_before_id: data?.next_before_id ?? null,
  }
}

export async function sendChatMessage(
  scope: ChatScope,
  body: ChatMessageCreate,
  shareToken?: string | null,
): Promise<ChatMessageOut> {
  const { data } = await apiRequest<ChatMessageOut>(scopeBase(scope), {
    method: 'POST',
    jsonBody: body,
    shareToken,
  })
  return data
}

export async function deleteChatMessage(messageId: number): Promise<ChatMessageOut> {
  const { data } = await apiRequest<ChatMessageOut>(`/chat/messages/${messageId}`, {
    method: 'DELETE',
  })
  return data
}

export async function markChatRead(scope: ChatScope, shareToken?: string | null): Promise<{ last_read_message_id: number }> {
  const path = scope.kind === 'lobby' ? '/chat/lobby/read' : `/markets/${scope.marketId}/chat/read`
  const { data } = await apiRequest<{ last_read_message_id: number }>(path, { method: 'POST', shareToken })
  return data
}

export async function getChatUnreadReplies(): Promise<ChatUnreadOut> {
  const { data } = await apiRequest<ChatUnreadOut>('/chat/unread-replies')
  return {
    lobby: Number(data?.lobby ?? 0),
    markets: data?.markets ?? {},
    total: Number(data?.total ?? 0),
  }
}
