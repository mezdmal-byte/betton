import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { applyPersonalizedExecutableQuotes, mapAccountOut, mapMarketOut, mapUiStatusToApi } from '../api/adapters'
import { getOrderbook, listMarkets } from '../api/markets'
import { queryKeys } from '../api/query'
import { rememberShareToken, shareTokenFor } from '../api/share'
import type { AccountOut } from '../api/types'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { FilterSheet } from '../components/FilterSheet/FilterSheet'
import { useI18n } from '../i18n'
import { marketIsP2P, marketIsTradable } from '../lib/quote'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { MarketsScreen } from '../screens/MarketsScreen'
import overlayStyles from '../screens/QuickTradeScreen.module.css'
import type { MarketFixture, OutcomeSide } from '../types/market'
import { ConnectedQuickTradeSheet } from './ConnectedQuickTrade'

export type FeedViewState = {
  query: string
  sort: string
  category: string
  status: string
}

export type ConnectedMarketsScreenProps = {
  account?: AccountOut | null
  accountState: 'ready' | 'loading' | 'unauthenticated'
  personalized: boolean
  userId?: number
  availableTon?: number
  feedView: FeedViewState
  onFeedViewChange: (next: FeedViewState) => void
  onNavChange: (id: NavId) => void
  onProfileClick: () => void
  onSelectMarket: (market: MarketFixture) => void
  onCreatorClick?: (market: MarketFixture) => void
  onOwnPrice: (marketId: number, side: OutcomeSide) => void
}

export function ConnectedMarketsScreen({
  account,
  accountState,
  personalized,
  userId,
  availableTon = 0,
  feedView,
  onFeedViewChange,
  onNavChange,
  onProfileClick,
  onSelectMarket,
  onCreatorClick,
  onOwnPrice,
}: ConnectedMarketsScreenProps) {
  const { locale } = useI18n()
  const [trade, setTrade] = useState<{ market: MarketFixture; side: OutcomeSide; amount: number } | null>(
    null,
  )
  const [filtersOpen, setFiltersOpen] = useState(false)
  const debouncedQuery = useDebouncedValue(feedView.query, 280)
  const headerUser = useMemo(() => {
    if (!account) return null
    const mapped = mapAccountOut(account)
    return {
      displayName: mapped.displayName,
      handle: mapped.handle,
      initials: mapped.initials,
      availableTon: mapped.availableTon,
      photoUrl: mapped.photoUrl,
    }
  }, [account])

  const feed = useInfiniteQuery({
    queryKey: queryKeys.markets({
      sort: feedView.sort,
      category: feedView.category,
      q: debouncedQuery,
      status: feedView.status,
    }),
    queryFn: ({ pageParam }) =>
      listMarkets({
        sort: feedView.sort,
        category: feedView.category,
        q: debouncedQuery,
        status: mapUiStatusToApi(feedView.status) ?? null,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const next = lastPage.offset + lastPage.items.length
      return next < lastPage.total ? next : undefined
    },
  })

  const markets = useMemo(() => {
    const items = feed.data?.pages.flatMap((page) => page.items) ?? []
    for (const item of items) {
      if (item.share_token) rememberShareToken(item.id, item.share_token)
    }
    return items.map((item) => mapMarketOut(item, new Date(), locale))
  }, [feed.data, locale])

  const tradeMarketId = trade ? Number(trade.market.id) : NaN
  const tradeShare = Number.isFinite(tradeMarketId) ? shareTokenFor(tradeMarketId) : null
  const bookQuery = useQuery({
    queryKey: [...queryKeys.orderbook(tradeMarketId), tradeShare, 'quick-trade'],
    queryFn: () => getOrderbook(tradeMarketId, tradeShare),
    enabled: Boolean(trade && personalized && Number.isFinite(tradeMarketId) && marketIsP2P(trade.market)),
  })

  const quotesLoading = Boolean(trade && personalized && bookQuery.isPending)
  const sheetMarket = useMemo(() => {
    if (!trade) return null
    if (!marketIsP2P(trade.market)) return trade.market
    if (!personalized) return trade.market
    if (bookQuery.isPending) {
      return {
        ...trade.market,
        outcomeA: { ...trade.market.outcomeA, odds: null, liquidityTon: null },
        outcomeB: { ...trade.market.outcomeB, odds: null, liquidityTon: null },
      }
    }
    if (bookQuery.isSuccess) return applyPersonalizedExecutableQuotes(trade.market, bookQuery.data)
    return applyPersonalizedExecutableQuotes(trade.market, { available_to_me: [[], []] })
  }, [bookQuery.data, bookQuery.isPending, bookQuery.isSuccess, personalized, trade])

  const feedState =
    feed.isPending && markets.length === 0
      ? 'loading'
      : feed.isError && markets.length === 0
        ? 'error'
        : markets.length === 0
          ? 'empty'
          : 'ready'

  return (
    <div className={overlayStyles.root}>
      <MarketsScreen
        markets={markets}
        query={feedView.query}
        sort={feedView.sort}
        category={feedView.category}
        onQueryChange={(query) => onFeedViewChange({ ...feedView, query })}
        onSortChange={(sort) => onFeedViewChange({ ...feedView, sort })}
        onCategoryChange={(category) => onFeedViewChange({ ...feedView, category })}
        filtersOpen={filtersOpen}
        filtersActive={feedView.status !== 'open'}
        onFiltersClick={() => setFiltersOpen(true)}
        onSelectMarket={onSelectMarket}
        onCreatorClick={onCreatorClick}
        onSelectOutcome={(market, side) => {
          if (!marketIsTradable(market) || !marketIsP2P(market)) {
            onSelectMarket(market)
            return
          }
          setTrade({ market, side, amount: 100 })
        }}
        onNavChange={onNavChange}
        onProfileClick={onProfileClick}
        headerUser={headerUser}
        accountState={accountState}
        feedState={feedState}
        onRetry={() => {
          void feed.refetch()
        }}
        hasMore={Boolean(feed.hasNextPage)}
        loadingMore={feed.isFetchingNextPage}
        onLoadMore={() => {
          void feed.fetchNextPage()
        }}
      />
      <FilterSheet
        open={filtersOpen}
        status={feedView.status}
        onClose={() => setFiltersOpen(false)}
        onApply={(status) => onFeedViewChange({ ...feedView, status })}
      />
      {trade && sheetMarket ? (
        <div className={overlayStyles.overlay}>
          <ConnectedQuickTradeSheet
            market={sheetMarket}
            selectedSide={trade.side}
            amount={trade.amount}
            availableTon={availableTon}
            userId={userId}
            quotesLoading={quotesLoading}
            onSelectSide={(side) => setTrade({ ...trade, side })}
            onAmountChange={(amount) => setTrade({ ...trade, amount })}
            onClose={() => setTrade(null)}
            onOwnPrice={() => {
              const id = Number(trade.market.id)
              const side = trade.side
              setTrade(null)
              if (Number.isFinite(id)) onOwnPrice(id, side)
            }}
          />
        </div>
      ) : null}
    </div>
  )
}
