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
import { copyShareLink, marketShareUrl, rememberShareToken, shareTokenFor } from '../api/share'
import { Button } from '../components/Button/Button'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { useT, useI18n } from '../i18n'
import { openLegacyMiniApp } from '../lib/legacy'
import { marketIsP2P, marketIsTradable } from '../lib/quote'
import { QUICK_TRADE_INITIAL_AMOUNT } from '../lib/quickTrade'
import { MarketDetailScreen } from '../screens/MarketDetailScreen'
import type { MarketDetailPane, MarketDetailViewState, TradeHistoryState } from '../screens/MarketDetailScreen'
import overlayStyles from '../screens/QuickTradeScreen.module.css'
import type { OutcomeSide } from '../types/market'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
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
  webapp?: string | null
  onNavChange?: (id: NavId) => void
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
  webapp,
  onNavChange,
}: ConnectedMarketDetailScreenProps) {
  const t = useT()
  const { locale } = useI18n()
  const [side, setSide] = useState<OutcomeSide>('a')
  const [tradeAmount, setTradeAmount] = useState(QUICK_TRADE_INITIAL_AMOUNT)
  const [trading, setTrading] = useState(false)
  const [pane, setPane] = useState<MarketDetailPane>('chart')
  const [adminOpen, setAdminOpen] = useState(false)
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const shareToken = shareTokenFor(marketId)
  const health = useQuery({
    queryKey: queryKeys.health,
    queryFn: getHealth,
    enabled: !botUsername,
  })
  const bot = botUsername || health.data?.bot_username
  const publicBase = webapp || health.data?.webapp

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
  const totalAvailableTon = useMemo(() => {
    const levels = bookQuery.data?.available_to_me?.[side === 'a' ? 0 : 1] ?? []
    return levels.reduce((sum, level) => sum + Number(level.available ?? 0), 0)
  }, [bookQuery.data, side])

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
  const shareLink = marketShareUrl({
    shareToken: marketQuery.data?.share_token ?? shareToken,
    botUsername: bot,
    webapp: publicBase,
  })

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
        showMarketDataSwitch={p2p}
        viewState={viewState}
        actionsDisabled={actionsOff}
        onBack={onBack}
        onOwnPrice={() => onOwnPrice(side)}
        onPlace={() => {
          if (!market || actionsOff) return
          setTradeAmount(QUICK_TRADE_INITIAL_AMOUNT)
          setTrading(true)
        }}
        onRetry={() => {
          void marketQuery.refetch()
          void bookQuery.refetch()
          void tradesQuery.refetch()
        }}
        onRetryTrades={() => {
          void tradesQuery.refetch()
        }}
        onRetryBook={() => {
          void bookQuery.refetch()
        }}
        onCreatorClick={creatorId ? () => onCreatorClick?.(creatorId) : undefined}
        shareAvailable={Boolean(shareLink)}
        onShare={() => {
          void copyShareLink(shareLink).then((ok) => {
            setShareMessage(ok ? t('share.copied') : t('share.fail'))
          })
        }}
        banner={
          <>
            {!userId && !lmsr ? <StatusMessage tone="warning" title={t('err.openInTg')}>{t('err.openInTgBody')}</StatusMessage> : null}
            {shareMessage ? <StatusMessage title={shareMessage} /> : null}
            {lmsr ? (
              <StatusMessage title={t('lmsr.title')}>{t('lmsr.body')}</StatusMessage>
            ) : null}
          </>
        }
        extra={
          <>
            {lmsr ? (
              <Button fullWidth onClick={openLegacyMiniApp}>
                {t('lmsr.open')}
              </Button>
            ) : null}
            {isAdmin && marketQuery.data ? (
              <div className={overlayStyles.adminWrap}>
                <Button variant="secondary" fullWidth onClick={() => setAdminOpen((open) => !open)}>
                  {adminOpen ? t('moderation.hide') : t('moderation.show')}
                </Button>
                {adminOpen ? <AdminMarketPanel market={marketQuery.data} userId={userId} /> : null}
              </div>
            ) : null}
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
            totalAvailableTon={totalAvailableTon}
            userId={userId}
            quotesLoading={bookQuery.isPending || bookQuery.isError}
            quotesError={bookQuery.isError}
            onRetryQuotes={() => { void bookQuery.refetch() }}
            onSelectSide={setSide}
            onAmountChange={setTradeAmount}
            onClose={() => setTrading(false)}
            onNavChange={onNavChange}
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
