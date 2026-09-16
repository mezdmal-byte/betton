import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { applyPersonalizedExecutableQuotes, mapMarketOut } from '../api/adapters'
import { isApiError } from '../api/client'
import { getMarket, getOrderbook } from '../api/markets'
import { queryKeys } from '../api/query'
import { rememberShareToken, shareTokenFor } from '../api/share'
import { Button } from '../components/Button/Button'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { openLegacyMiniApp } from '../lib/legacy'
import { marketIsP2P, marketIsTradable } from '../lib/quote'
import { MarketDetailScreen } from '../screens/MarketDetailScreen'
import type { MarketDetailViewState } from '../screens/MarketDetailScreen'
import overlayStyles from '../screens/QuickTradeScreen.module.css'
import type { OutcomeSide } from '../types/market'
import { AdminMarketPanel } from './AdminMarketPanel'
import { ConnectedQuickTradeSheet } from './ConnectedQuickTrade'

export type ConnectedMarketDetailScreenProps = {
  marketId: number
  onBack: () => void
  onOwnPrice: (side: OutcomeSide) => void
  isAdmin?: boolean
  userId?: number
  availableTon?: number
}

export function ConnectedMarketDetailScreen({
  marketId,
  onBack,
  onOwnPrice,
  isAdmin = false,
  userId,
  availableTon = 0,
}: ConnectedMarketDetailScreenProps) {
  const [side, setSide] = useState<OutcomeSide>('a')
  const [tradeAmount, setTradeAmount] = useState(100)
  const [trading, setTrading] = useState(false)
  const shareToken = shareTokenFor(marketId)

  const marketQuery = useQuery({
    queryKey: [...queryKeys.market(marketId), shareToken],
    queryFn: async () => {
      const dto = await getMarket(marketId, shareToken)
      if (dto.share_token) rememberShareToken(dto.id, dto.share_token)
      return dto
    },
  })

  const bookQuery = useQuery({
    queryKey: [...queryKeys.orderbook(marketId), shareToken],
    queryFn: () => getOrderbook(marketId, shareToken),
    enabled: marketQuery.data?.mechanism === 'p2p' && marketQuery.isSuccess,
  })

  const market = useMemo(() => {
    if (!marketQuery.data) return undefined
    const mapped = mapMarketOut(marketQuery.data)
    if (mapped.mechanism !== 'p2p') return mapped
    if (!bookQuery.isSuccess) return mapped
    return applyPersonalizedExecutableQuotes(mapped, bookQuery.data)
  }, [bookQuery.data, bookQuery.isSuccess, marketQuery.data])

  const viewState: MarketDetailViewState = marketQuery.isPending
    ? 'loading'
    : isApiError(marketQuery.error) && marketQuery.error.code === 'not-found'
      ? 'not-found'
      : isApiError(marketQuery.error) && marketQuery.error.code === 'forbidden'
        ? 'forbidden'
        : marketQuery.isError
          ? 'error'
          : 'ready'

  const lmsr = Boolean(market && !marketIsP2P(market))
  const actionsOff = !market || lmsr || !marketIsTradable(market) || !userId

  return (
    <div className={overlayStyles.root}>
      <MarketDetailScreen
        market={market}
        selectedSide={side}
        onSelectSide={setSide}
        priceHistoryAvailable={false}
        viewState={viewState}
        actionsDisabled={actionsOff}
        onBack={onBack}
        onOwnPrice={() => onOwnPrice(side)}
        onPlace={() => {
          if (!market || actionsOff) return
          setTrading(true)
        }}
        onRetry={() => {
          void marketQuery.refetch()
        }}
        banner={
          lmsr ? (
            <StatusMessage title="LMSR — совместимость">
              Этот рынок использует прежний механизм LMSR. P2P-котировки здесь не показываются. Откройте его в
              исходном Mini App.
            </StatusMessage>
          ) : null
        }
        extra={
          <>
            {lmsr ? (
              <Button fullWidth onClick={openLegacyMiniApp}>
                Открыть в Mini App
              </Button>
            ) : null}
            {isAdmin && marketQuery.data ? <AdminMarketPanel market={marketQuery.data} userId={userId} /> : null}
          </>
        }
      />
      {trading && market ? (
        <div className={overlayStyles.overlay}>
          <ConnectedQuickTradeSheet
            market={market}
            selectedSide={side}
            amount={tradeAmount}
            availableTon={availableTon}
            userId={userId}
            quotesLoading={bookQuery.isPending}
            onSelectSide={setSide}
            onAmountChange={setTradeAmount}
            onClose={() => setTrading(false)}
            onOwnPrice={() => {
              setTrading(false)
              onOwnPrice(side)
            }}
          />
        </div>
      ) : null}
    </div>
  )
}
