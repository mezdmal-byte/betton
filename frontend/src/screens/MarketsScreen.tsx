import { useState } from 'react'
import { currentUser, feedMarkets } from '../fixtures/markets'
import type { MarketFixture, OutcomeSide } from '../types/market'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { Avatar } from '../components/Avatar/Avatar'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { MarketCard } from '../components/MarketCard/MarketCard'
import { MarketFilters } from '../components/MarketFilters/MarketFilters'
import { SearchField } from '../components/SearchField/SearchField'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { COPY } from '../lib/constants'
import { formatTon } from '../lib/format'
import styles from './MarketsScreen.module.css'

export type MarketsAccountState = 'ready' | 'loading' | 'unauthenticated'

export type MarketsFeedState = 'ready' | 'loading' | 'empty' | 'error'

export type MarketsHeaderUser = {
  displayName: string
  handle: string
  initials: string
  availableTon: number
  photoUrl?: string
}

export type MarketsScreenProps = {
  markets?: MarketFixture[]
  query?: string
  sort?: string
  category?: string
  onQueryChange?: (value: string) => void
  onSortChange?: (id: string) => void
  onCategoryChange?: (id: string) => void
  onSelectOutcome?: (market: MarketFixture, side: OutcomeSide) => void
  onSelectMarket?: (market: MarketFixture) => void
  onNavChange?: (id: NavId) => void
  onProfileClick?: () => void
  headerUser?: MarketsHeaderUser | null
  accountState?: MarketsAccountState
  feedState?: MarketsFeedState
  onRetry?: () => void
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
}

export function MarketsScreen({
  markets = feedMarkets,
  query = '',
  sort = 'new',
  category = 'all',
  onQueryChange,
  onSortChange,
  onCategoryChange,
  onSelectOutcome,
  onSelectMarket,
  onNavChange,
  onProfileClick,
  headerUser,
  accountState = 'ready',
  feedState = 'ready',
  onRetry,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: MarketsScreenProps) {
  const [internalQuery, setInternalQuery] = useState(query)
  const [internalSort, setInternalSort] = useState(sort)
  const [internalCategory, setInternalCategory] = useState(category)

  const search = onQueryChange ? query : internalQuery
  const sortValue = onSortChange ? sort : internalSort
  const categoryValue = onCategoryChange ? category : internalCategory
  const resolvedHeader =
    accountState === 'ready' ? (headerUser ?? currentUser) : null
  const balanceLabel =
    accountState === 'loading' ? '…' : resolvedHeader ? formatTon(resolvedHeader.availableTon) : '—'

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.brand}>
          Bet<span>TON</span>
        </h1>
        <div className={styles.headerRight} onClick={onProfileClick}>
          <div className={styles.balance}>
            <span>Доступно</span>
            <strong>{balanceLabel}</strong>
          </div>
          <Avatar
            initials={resolvedHeader?.initials ?? '?'}
            name={resolvedHeader?.displayName}
            src={resolvedHeader?.photoUrl}
            size="md"
          />
        </div>
      </header>
      <div className={styles.body}>
        <SearchField
          value={search}
          onChange={onQueryChange ?? setInternalQuery}
        />
        <MarketFilters
          sort={sortValue}
          category={categoryValue}
          onSortChange={onSortChange ?? setInternalSort}
          onCategoryChange={onCategoryChange ?? setInternalCategory}
        />
        <div className={styles.feed}>
          {feedState === 'loading' ? (
            <StatusMessage tone="loading" title={COPY.marketsLoadingTitle}>
              {COPY.marketsLoadingBody}
            </StatusMessage>
          ) : null}
          {feedState === 'empty' ? (
            <StatusMessage tone="empty" title={COPY.marketsEmptyTitle}>
              {COPY.marketsEmptyBody}
            </StatusMessage>
          ) : null}
          {feedState === 'error' ? (
            <StatusMessage tone="error" title={COPY.marketsErrorTitle}>
              {COPY.marketsErrorBody}
            </StatusMessage>
          ) : null}
          {feedState === 'error' && onRetry ? (
            <Button variant="secondary" onClick={onRetry}>
              Повторить
            </Button>
          ) : null}
          {feedState === 'ready' || (feedState === 'error' && markets.length > 0)
            ? markets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  onOpen={onSelectMarket ? () => onSelectMarket(market) : undefined}
                  onSelectOutcome={(side) => onSelectOutcome?.(market, side)}
                />
              ))
            : null}
          {feedState === 'ready' && hasMore ? (
            <Button variant="secondary" fullWidth loading={loadingMore} onClick={onLoadMore}>
              {COPY.loadMore}
            </Button>
          ) : null}
        </div>
      </div>
      <BottomNavigation active="markets" onChange={onNavChange} />
    </div>
  )
}
