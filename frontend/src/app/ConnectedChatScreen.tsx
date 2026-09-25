import { useEffect, useMemo } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteChatMessage,
  getChatMessages,
  markChatRead,
  sendChatMessage,
  type ChatScope,
} from '../api/chat'
import { getMarket, listMarkets } from '../api/markets'
import { queryKeys } from '../api/query'
import { shareTokenFor } from '../api/share'
import { ChatScreen } from '../screens/ChatScreen'

export type ConnectedChatScreenProps = {
  scope: ChatScope
  currentUserId?: number
  isAdmin?: boolean
  onBack: () => void
  onOpenMarket: (marketId: number) => void
}

export function ConnectedChatScreen({
  scope,
  currentUserId,
  isAdmin = false,
  onBack,
  onOpenMarket,
}: ConnectedChatScreenProps) {
  const client = useQueryClient()
  const marketId = scope.kind === 'market' ? scope.marketId : null
  const shareToken = marketId != null ? shareTokenFor(marketId) : null
  const chatKey = scope.kind === 'lobby' ? queryKeys.lobbyChat : queryKeys.marketChat(scope.marketId)

  const chat = useInfiniteQuery({
    queryKey: [...chatKey, shareToken],
    queryFn: ({ pageParam }) =>
      getChatMessages(
        scope,
        {
          limit: scope.kind === 'lobby' ? 100 : 50,
          beforeId: typeof pageParam === 'number' ? pageParam : null,
        },
        shareToken,
      ),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) =>
      scope.kind === 'market' && lastPage.has_more && lastPage.next_before_id != null
        ? lastPage.next_before_id
        : undefined,
    refetchInterval: 3000,
  })

  const messages = useMemo(
    () => (chat.data?.pages ?? []).slice().reverse().flatMap((page) => page.items),
    [chat.data],
  )

  const latestMessageId = messages[messages.length - 1]?.id ?? 0
  useEffect(() => {
    if (!currentUserId || chat.isPending) return
    void markChatRead(scope, shareToken)
      .then(() => client.invalidateQueries({ queryKey: queryKeys.chatUnread }))
      .catch(() => undefined)
  }, [chat.isPending, client, currentUserId, latestMessageId, scope.kind, marketId, shareToken])

  const marketQuery = useQuery({
    queryKey: marketId != null ? [...queryKeys.market(marketId), shareToken, 'chat-title'] : ['chat', 'no-market'],
    queryFn: () => getMarket(marketId!, shareToken),
    enabled: marketId != null,
  })

  const attachableQuery = useQuery({
    queryKey: ['chat', 'attachable-markets'],
    queryFn: () => listMarkets({ status: 'open', sort: 'new', limit: 12 }),
    enabled: scope.kind === 'lobby',
    staleTime: 15_000,
  })

  const sendMutation = useMutation({
    mutationFn: (input: { text: string; replyToId?: number; attachedMarketId?: number }) =>
      sendChatMessage(
        scope,
        {
          text: input.text,
          reply_to_id: input.replyToId,
          attached_market_id: input.attachedMarketId,
        },
        shareToken,
      ),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: chatKey })
      await client.invalidateQueries({ queryKey: queryKeys.chatUnread })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (messageId: number) => deleteChatMessage(messageId),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: chatKey })
      await client.invalidateQueries({ queryKey: queryKeys.chatUnread })
    },
  })

  const marketQuestion = marketQuery.data?.question
  const title = scope.kind === 'lobby' ? 'Лобби BetTON' : 'Обсуждение'
  const subtitle =
    scope.kind === 'lobby'
      ? 'Общий чат · уведомляем только об ответах вам'
      : marketQuestion ?? 'Чат события'

  return (
    <ChatScreen
      title={title}
      subtitle={subtitle}
      messages={messages}
      currentUserId={currentUserId}
      isAdmin={isAdmin}
      loading={chat.isPending}
      error={chat.isError}
      sending={sendMutation.isPending}
      lobby={scope.kind === 'lobby'}
      hasMore={Boolean(chat.hasNextPage)}
      attachableMarkets={(attachableQuery.data?.items ?? []).map((market) => ({
        id: market.id,
        question: market.question,
      }))}
      onBack={onBack}
      onLoadOlder={() => { void chat.fetchNextPage() }}
      onRetry={() => { void chat.refetch() }}
      onSend={(input) => sendMutation.mutate(input)}
      onDelete={(messageId) => deleteMutation.mutate(messageId)}
      onOpenMarket={onOpenMarket}
    />
  )
}
