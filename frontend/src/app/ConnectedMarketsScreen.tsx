import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { mapAccountOut, mapMarketOut } from '../api/adapters'
import { listMarkets } from '../api/markets'
import { queryKeys } from '../api/query'
import { rememberShareToken } from '../api/share'
import type { AccountOut } from '../api/types'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { QuickTradeSheet } from '../components/QuickTradeSheet/QuickTradeSheet'
import { outcomeIsExecutable } from '../lib/quote'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { MarketsScreen } from '../screens/MarketsScreen'
import overlayStyles from '../screens/QuickTradeScreen.module.css'
import type { MarketFixture, OutcomeSide } from '../types/market'

export type ConnectedMarketsScreenProps = {
  account?: AccountOut | null
  accountState: 'ready' | 'loading' | 'unauthenticated'
  onNavChange: (id: NavId) => void
  onProfileClick: () => void
  onSelectMarket: (market: MarketFixture) => void
}

export function ConnectedMarketsScreen({
  account,
  accountState,
  onNavChange,
  onProfileClick,
  onSelectMarket,
}: ConnectedMarketsScreenProps) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('new')
  const [category, setCategory] = useState('all')
  const [trade, setTrade] = useState<{ market: MarketFixture; side: OutcomeSide; amount: number } | null>(
    null,
  )
  const debouncedQuery = useDebouncedValue(query, 280)
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
    queryKey: queryKeys.markets({ sort, category, q: debouncedQuery }),
    queryFn: ({ pageParam }) =>
      listMarkets({
        sort,
        category,
        q: debouncedQuery,
        status: 'open',
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
    return items.map((item) => mapMarketOut(item))
  }, [feed.data])

  const selectedOutcome = trade
    ? trade.side === 'a'
      ? trade.market.outcomeA
      : trade.market.outcomeB
    : null
  const tradeState =
    trade && selectedOutcome && !outcomeIsExecutable(selectedOutcome) ? 'no-liquidity' : 'normal'

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
        query={query}
        sort={sort}
        category={category}
        onQueryChange={setQuery}
        onSortChange={setSort}
        onCategoryChange={setCategory}
        onSelectMarket={onSelectMarket}
        onSelectOutcome={(market, side) => setTrade({ market, side, amount: 100 })}
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
      {trade ? (
        <div className={overlayStyles.overlay}>
          <QuickTradeSheet
            market={trade.market}
            selectedSide={trade.side}
            amount={trade.amount}
            state={tradeState}
            demoMode
            onSelectSide={(side) => setTrade({ ...trade, side })}
            onAmountChange={(amount) => setTrade({ ...trade, amount })}
            onClose={() => setTrade(null)}
          />
        </div>
      ) : null}
    </div>
  )
}
