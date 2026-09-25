import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  applyPersonalizedExecutableQuotes,
  mapMarketOut,
  mapOrderBookLevels,
  mapTradesToChartPoints,
  mapTradesToRecent,
} from '../api/adapters'
import { isApiError } from '../api/client'
import { getMarket, getMarketTrades, getOrderbook } from '../api/markets'
import { queryKeys } from '../api/query'
import { copyShareLink, marketShareUrl, rememberShareToken, shareExternally, shareTokenFor } from '../api/share'
import { Button } from '../components/Button/Button'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { useT, useI18n } from '../i18n'
import { buildDemoMarketActivity } from '../lib/demoMarketActivity'
import { openLegacyMiniApp } from '../lib/legacy'
import { marketIsP2P, marketIsTradable } from '../lib/quote'
import { MarketDetailScreen } from '../screens/MarketDetailScreen'
import type { MarketDetailPane, MarketDetailViewState, TradeHistoryState } from '../screens/MarketDetailScreen'
import overlayStyles from '../screens/QuickTradeScreen.module.css'
import type { OutcomeSide } from '../types/market'
import { AdminMarketPanel } from './AdminMarketPanel'
import { getHealth } from '../api/account'

export type ConnectedMarketDetailScreenProps = {
  marketId: number
  onBack: () => void
  onOwnPrice: (side: OutcomeSide) => void
  onQuickTrade: (side: OutcomeSide) => void
  onCreatorClick?: (creatorId: number) => void
  pane?: MarketDetailPane
  onPaneChange?: (pane: MarketDetailPane) => void
  showInternalBack?: boolean
  discussionUnreadReplies?: number
  onDiscussion?: () => void
  isAdmin?: boolean
  userId?: number
  botUsername?: string | null
  webapp?: string | null
}

export function ConnectedMarketDetailScreen({
  marketId,
  onBack,
  onOwnPrice,
  onQuickTrade,
  onCreatorClick,
  pane: controlledPane,
  onPaneChange,
  showInternalBack = true,
  discussionUnreadReplies = 0,
  onDiscussion,
  isAdmin = false,
  userId,
  botUsername,
  webapp,
}: ConnectedMarketDetailScreenProps) {
  const t = useT()
  const { locale } = useI18n()
  const [side, setSide] = useState<OutcomeSide>('a')
  const [localPane, setLocalPane] = useState<MarketDetailPane>('chart')
  const pane = controlledPane ?? localPane
  const setPane = onPaneChange ?? setLocalPane
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
  const recentA = useMemo(() => mapTradesToRecent(tradesQuery.data, 0, locale), [locale, tradesQuery.data])
  const recentB = useMemo(() => mapTradesToRecent(tradesQuery.data, 1, locale), [locale, tradesQuery.data])
  const demoActivity = useMemo(
    () => (market && p2p ? buildDemoMarketActivity(marketId, market) : null),
    [market, marketId, p2p],
  )
  const demoHistory =
    Boolean(demoActivity) &&
    p2p &&
    !tradesQuery.isPending &&
    !tradesQuery.isError &&
    chartA.length === 0 &&
    chartB.length === 0
  const displayChartA = demoHistory ? demoActivity?.seriesA ?? [] : chartA
  const displayChartB = demoHistory ? demoActivity?.seriesB ?? [] : chartB
  const displayRecentA = demoHistory ? demoActivity?.recentA ?? [] : recentA
  const displayRecentB = demoHistory ? demoActivity?.recentB ?? [] : recentB
  const tradeHistoryState: TradeHistoryState = !p2p
    ? 'hidden'
    : tradesQuery.isPending
      ? 'loading'
      : tradesQuery.isError
        ? 'error'
        : (displayChartA.length === 0 && displayChartB.length === 0)
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
        chartSeriesA={displayChartA}
        chartSeriesB={displayChartB}
        recentTradesA={displayRecentA}
        recentTradesB={displayRecentB}
        tradeHistoryState={tradeHistoryState}
        demoHistory={demoHistory}
        chartVolumeTon={demoHistory ? demoActivity?.volumeTon : market?.volumeTon}
        orderbookA={mapOrderBookLevels(bookQuery.data?.sides?.[0])}
        orderbookB={mapOrderBookLevels(bookQuery.data?.sides?.[1])}
        orderbookState={bookQuery.isPending ? 'loading' : bookQuery.isError ? 'error' : 'ready'}
        pane={pane}
        onPaneChange={setPane}
        priceHistoryAvailable={false}
        showMarketDataSwitch={p2p}
        viewState={viewState}
        actionsDisabled={actionsOff}
        showInternalBack={showInternalBack}
        discussionUnreadReplies={discussionUnreadReplies}
        onDiscussion={onDiscussion}
        onBack={onBack}
        onOwnPrice={() => onOwnPrice(side)}
        onPlace={() => {
          if (!market || actionsOff) return
          onQuickTrade(side)
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
        shareValue={shareLink}
        onShare={() => {
          void copyShareLink(shareLink).then((ok) => {
            setShareMessage(ok ? t('share.copied') : t('share.fail'))
          })
        }}
        onExternalShare={() => {
          const ok = shareExternally(shareLink)
          setShareMessage(ok ? null : t('share.fail'))
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
    </div>
  )
}
