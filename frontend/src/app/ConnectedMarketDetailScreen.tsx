import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  applyPersonalizedExecutableQuotes,
  mapMarketOut,
  mapOrderBookLevels,
  mapTradesToChartPoints,
} from '../api/adapters'
import { isApiError } from '../api/client'
import { getMarket, getMarketTrades, getOrderbook } from '../api/markets'
import { queryKeys } from '../api/query'
import { copyShareLink, rememberShareToken, shareTokenFor, telegramShareUrl } from '../api/share'
import { Button } from '../components/Button/Button'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { useT, useI18n } from '../i18n'
import { openLegacyMiniApp } from '../lib/legacy'
import { marketIsP2P, marketIsTradable } from '../lib/quote'
import { MarketDetailScreen } from '../screens/MarketDetailScreen'
import type { MarketDetailPane, MarketDetailViewState, TradeHistoryState } from '../screens/MarketDetailScreen'
import overlayStyles from '../screens/QuickTradeScreen.module.css'
import type { OutcomeSide } from '../types/market'
import { AdminMarketPanel } from './AdminMarketPanel'
import { ConnectedQuickTradeSheet } from './ConnectedQuickTrade'
import { getHealth } from '../api/account'

export type ConnectedMarketDetailScreenProps = {
  marketId: number
  onBack: () => void
  onOwnPrice: (side: OutcomeSide) => void
  onCreatorClick?: (creatorId: number) => void
  isAdmin?: boolean
  userId?: number
  availableTon?: number
  botUsername?: string | null
}

export function ConnectedMarketDetailScreen({
  marketId,
  onBack,
  onOwnPrice,
  onCreatorClick,
  isAdmin = false,
  userId,
  availableTon = 0,
  botUsername,
}: ConnectedMarketDetailScreenProps) {
  const t = useT()
  const { locale } = useI18n()
  const [side, setSide] = useState<OutcomeSide>('a')
  const [tradeAmount, setTradeAmount] = useState(100)
  const [trading, setTrading] = useState(false)
  const [pane, setPane] = useState<MarketDetailPane>('chart')
  const shareToken = shareTokenFor(marketId)
  const health = useQuery({
    queryKey: queryKeys.health,
    queryFn: getHealth,
    enabled: !botUsername,
  })
  const bot = botUsername || health.data?.bot_username

  const marketQuery = useQuery({
    queryKey: [...queryKeys.market(marketId), shareToken],
    queryFn: async () => {
      const dto = await getMarket(marketId, shareToken)
      if (dto.share_token) rememberShareToken(dto.id, dto.share_token)
      return dto
    },
  })

  const p2p = marketQuery.data?.mechanism === 'p2p'
  const bookQuery = useQuery({
    queryKey: [...queryKeys.orderbook(marketId), shareToken],
    queryFn: () => getOrderbook(marketId, shareToken),
    enabled: p2p && marketQuery.isSuccess,
  })
  const tradesQuery = useQuery({
    queryKey: [...queryKeys.trades(marketId), shareToken],
    queryFn: () => getMarketTrades(marketId, shareToken),
    enabled: p2p && marketQuery.isSuccess,
  })

  const market = useMemo(() => {
    if (!marketQuery.data) return undefined
    const mapped = mapMarketOut(marketQuery.data, new Date(), locale)
    if (mapped.mechanism !== 'p2p') return mapped
    if (!bookQuery.isSuccess) return mapped
    return applyPersonalizedExecutableQuotes(mapped, bookQuery.data)
  }, [bookQuery.data, bookQuery.isSuccess, locale, marketQuery.data])

  const chartA = useMemo(() => mapTradesToChartPoints(tradesQuery.data, 0), [tradesQuery.data])
  const chartB = useMemo(() => mapTradesToChartPoints(tradesQuery.data, 1), [tradesQuery.data])
  const tradeHistoryState: TradeHistoryState = !p2p
    ? 'hidden'
    : tradesQuery.isPending
      ? 'loading'
      : tradesQuery.isError
        ? 'error'
        : (chartA.length === 0 && chartB.length === 0)
          ? 'empty'
          : 'ready'

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
  const creatorId = marketQuery.data?.creator?.id ?? marketQuery.data?.creator_id
  const shareLink = telegramShareUrl(bot, marketQuery.data?.share_token ?? shareToken)

  return (
    <div className={overlayStyles.root}>
      <MarketDetailScreen
        market={market}
        selectedSide={side}
        onSelectSide={setSide}
        chartSeriesA={chartA}
        chartSeriesB={chartB}
        tradeHistoryState={tradeHistoryState}
        orderbookA={mapOrderBookLevels(bookQuery.data?.sides?.[0])}
        orderbookB={mapOrderBookLevels(bookQuery.data?.sides?.[1])}
        orderbookState={bookQuery.isPending ? 'loading' : bookQuery.isError ? 'error' : 'ready'}
        pane={pane}
        onPaneChange={setPane}
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
          void bookQuery.refetch()
          void tradesQuery.refetch()
        }}
        onCreatorClick={creatorId ? () => onCreatorClick?.(creatorId) : undefined}
        shareAvailable={Boolean(shareLink)}
        onShare={() => {
          void copyShareLink(shareLink)
        }}
        banner={
          lmsr ? (
            <StatusMessage title={t('lmsr.title')}>{t('lmsr.body')}</StatusMessage>
          ) : null
        }
        extra={
          <>
            {lmsr ? (
              <Button fullWidth onClick={openLegacyMiniApp}>
                {t('lmsr.open')}
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
