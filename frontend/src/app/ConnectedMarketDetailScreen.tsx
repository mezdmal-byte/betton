import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { mapMarketOut } from '../api/adapters'
import { isApiError } from '../api/client'
import { getMarket, getOrderbook } from '../api/markets'
import { queryKeys } from '../api/query'
import { rememberShareToken, shareTokenFor } from '../api/share'
import { MarketDetailScreen } from '../screens/MarketDetailScreen'
import type { MarketDetailViewState } from '../screens/MarketDetailScreen'
import type { OutcomeSide } from '../types/market'

export type ConnectedMarketDetailScreenProps = {
  marketId: number
  onBack: () => void
}

export function ConnectedMarketDetailScreen({ marketId, onBack }: ConnectedMarketDetailScreenProps) {
  const [side, setSide] = useState<OutcomeSide>('a')
  const shareToken = shareTokenFor(marketId)

  const marketQuery = useQuery({
    queryKey: [...queryKeys.market(marketId), shareToken],
    queryFn: async () => {
      const dto = await getMarket(marketId, shareToken)
      if (dto.share_token) rememberShareToken(dto.id, dto.share_token)
      return dto
    },
  })

  useQuery({
    queryKey: [...queryKeys.orderbook(marketId), shareToken],
    queryFn: () => getOrderbook(marketId, shareToken),
    enabled: marketQuery.data?.mechanism === 'p2p' && marketQuery.isSuccess,
  })

  const market = useMemo(
    () => (marketQuery.data ? mapMarketOut(marketQuery.data) : undefined),
    [marketQuery.data],
  )

  const viewState: MarketDetailViewState = marketQuery.isPending
    ? 'loading'
    : isApiError(marketQuery.error) && marketQuery.error.code === 'not-found'
      ? 'not-found'
      : isApiError(marketQuery.error) && marketQuery.error.code === 'forbidden'
        ? 'forbidden'
        : marketQuery.isError
          ? 'error'
          : 'ready'

  return (
    <MarketDetailScreen
      market={market}
      selectedSide={side}
      onSelectSide={setSide}
      priceHistoryAvailable={false}
      viewState={viewState}
      actionsDisabled
      onBack={onBack}
      onRetry={() => {
        void marketQuery.refetch()
      }}
    />
  )
}
