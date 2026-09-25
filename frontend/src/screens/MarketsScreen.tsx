import { Search, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { IconButton } from '../components/IconButton/IconButton'
import { MarketCard } from '../components/MarketCard/MarketCard'
import { MarketFilters } from '../components/MarketFilters/MarketFilters'
import { SearchField } from '../components/SearchField/SearchField'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { ThemeToggle } from '../components/ThemeToggle/ThemeToggle'
import { feedMarkets } from '../fixtures/markets'
import { useT } from '../i18n'
import { formatTonFull } from '../lib/format'
import type { MarketFixture, OutcomeSide } from '../types/market'
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

export type FeedCreator = {
  id: number
  displayName: string
  handle: string
  initials?: string
  photoUrl?: string
  volumeTon?: number
}

export type MarketsScreenProps = {
  markets?: MarketFixture[]
  query?: string
  sort?: string
  category?: string
  filtersOpen?: boolean
  filtersActive?: boolean
  onQueryChange?: (value: string) => void
  onSortChange?: (id: string) => void
  onCategoryChange?: (id: string) => void
  onFiltersClick?: () => void
  onSelectOutcome?: (market: MarketFixture, side: OutcomeSide) => void
  onSelectMarket?: (market: MarketFixture) => void
  onCreatorClick?: (market: MarketFixture) => void
  onNavChange?: (id: NavId) => void
  onProfileClick?: () => void
  headerUser?: MarketsHeaderUser | null
  accountState?: MarketsAccountState
  feedState?: MarketsFeedState
  onRetry?: () => void
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
  topCreators?: FeedCreator[]
  onTopCreatorClick?: (userId: number) => void
}

export function MarketsScreen({
  markets = feedMarkets,
  query = '',
  sort = 'new',
  filtersOpen = false,
  filtersActive = false,
  onQueryChange,
  onSortChange,
  onFiltersClick,
  onSelectOutcome,
  onSelectMarket,
  onCreatorClick,
  onNavChange,
  feedState = 'ready',
  onRetry,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: MarketsScreenProps) {
  const t = useT()
  const [internalQuery, setInternalQuery] = useState(query)
  const [internalSort, setInternalSort] = useState(sort)
  const [searchOpen, setSearchOpen] = useState(() => Boolean(query.trim()))

  const search = onQueryChange ? query : internalQuery
  const sortValue = onSortChange ? sort : internalSort
  const totalVolume = markets.reduce((sum, market) => sum + (Number.isFinite(market.volumeTon) ? market.volumeTon : 0), 0)

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1>{t('nav.feed')}</h1>
          <div className={styles.headerActions}>
            <ThemeToggle />
            <IconButton
              label={t('feed.searchPh')}
              variant="plain"
              size="md"
              aria-pressed={searchOpen}
              onClick={() => {
                setSearchOpen((open) => !open)
                if (searchOpen && search) (onQueryChange ?? setInternalQuery)('')
              }}
            >
              <Search size={22} strokeWidth={1.8} />
            </IconButton>
          </div>
        </div>
        <p>События, оценённые участниками</p>
      </header>

      <main className={styles.body}>
        {searchOpen ? (
          <SearchField
            value={search}
            onChange={onQueryChange ?? setInternalQuery}
            placeholder={t('feed.searchPh')}
          />
        ) : null}

        <div className={styles.summary}>
          <div className={styles.metric}>
            <strong>{formatTonFull(totalVolume)}</strong>
            <span>объём сделок на открытых рынках</span>
          </div>
          <IconButton
            label={t('feed.filters')}
            variant="plain"
            size="md"
            className={filtersActive || filtersOpen ? styles.filterActive : styles.filter}
            aria-pressed={filtersOpen || filtersActive}
            onClick={onFiltersClick}
          >
            <SlidersHorizontal size={20} strokeWidth={1.8} />
          </IconButton>
        </div>

        <MarketFilters
          sort={sortValue}
          category="all"
          filtersOpen={filtersOpen}
          filtersActive={filtersActive}
          onSortChange={onSortChange ?? setInternalSort}
        />

        <div className={styles.feed}>
          {feedState === 'loading' ? (
            <StatusMessage tone="loading" title={t('loading')}>
              {t('loading.body')}
            </StatusMessage>
          ) : null}
          {feedState === 'empty' ? (
            <StatusMessage tone="empty" title={t('feed.emptyTitle')}>
              {t('feed.emptyBody')}
            </StatusMessage>
          ) : null}
          {feedState === 'error' ? (
            <StatusMessage tone="error" title={t('err.request')}>
              {t('err.requestBody')}
            </StatusMessage>
          ) : null}
          {feedState === 'error' && onRetry ? (
            <Button variant="secondary" onClick={onRetry}>
              {t('retry')}
            </Button>
          ) : null}

          {feedState === 'ready' || (feedState === 'error' && markets.length > 0)
            ? markets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  onOpen={onSelectMarket ? () => onSelectMarket(market) : undefined}
                  onCreatorClick={
                    onCreatorClick && (market.creator.id || market.creatorId)
                      ? () => onCreatorClick(market)
                      : undefined
                  }
                  onSelectOutcome={(side) => onSelectOutcome?.(market, side)}
                />
              ))
            : null}

          {feedState === 'ready' && hasMore ? (
            <Button variant="secondary" fullWidth loading={loadingMore} onClick={onLoadMore}>
              {t('feed.more')}
            </Button>
          ) : null}
        </div>
      </main>

      <BottomNavigation active="markets" onChange={onNavChange} />
    </div>
  )
}
