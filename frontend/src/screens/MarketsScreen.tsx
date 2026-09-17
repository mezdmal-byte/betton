import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { currentUser, feedMarkets } from '../fixtures/markets'
import type { MarketFixture, OutcomeSide } from '../types/market'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { Avatar } from '../components/Avatar/Avatar'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { IconButton } from '../components/IconButton/IconButton'
import { MarketCard } from '../components/MarketCard/MarketCard'
import { MarketFilters } from '../components/MarketFilters/MarketFilters'
import { SearchField } from '../components/SearchField/SearchField'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { useT } from '../i18n'
import { formatCompactAmount, formatTon } from '../lib/format'
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
  category = 'all',
  filtersOpen = false,
  filtersActive = false,
  onQueryChange,
  onSortChange,
  onCategoryChange,
  onFiltersClick,
  onSelectOutcome,
  onSelectMarket,
  onCreatorClick,
  onNavChange,
  onProfileClick,
  headerUser,
  accountState = 'ready',
  feedState = 'ready',
  onRetry,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  topCreators = [],
  onTopCreatorClick,
}: MarketsScreenProps) {
  const t = useT()
  const [internalQuery, setInternalQuery] = useState(query)
  const [internalSort, setInternalSort] = useState(sort)
  const [internalCategory, setInternalCategory] = useState(category)

  const search = onQueryChange ? query : internalQuery
  const sortValue = onSortChange ? sort : internalSort
  const categoryValue = onCategoryChange ? category : internalCategory
  const resolvedHeader = accountState === 'ready' ? (headerUser ?? currentUser) : null
  const balanceLabel =
    accountState === 'loading' ? '…' : resolvedHeader ? formatTon(resolvedHeader.availableTon) : '—'

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.brand}>
          Bet<span>TON</span>
        </h1>
        <div className={styles.headerRight}>
          <div className={styles.balancePill} aria-label={`${t('header.available')} ${balanceLabel}`}>
            <span>{t('header.available')}</span>
            <strong>{balanceLabel}</strong>
          </div>
          <button type="button" className={styles.avatarButton} onClick={onProfileClick} aria-label={t('nav.profile')}>
            <Avatar
              initials={resolvedHeader?.initials ?? '?'}
              name={resolvedHeader?.displayName}
              src={resolvedHeader?.photoUrl}
              size="md"
            />
          </button>
        </div>
      </header>
      <div className={styles.body}>
        <SearchField
          value={search}
          onChange={onQueryChange ?? setInternalQuery}
          placeholder={t('feed.searchPh')}
          trailing={
            <IconButton
              label={t('feed.filters')}
              variant="plain"
              size="md"
              className={filtersActive || filtersOpen ? styles.filterActive : undefined}
              aria-pressed={filtersOpen || filtersActive}
              onClick={onFiltersClick}
            >
              <SlidersHorizontal size={18} strokeWidth={2} />
            </IconButton>
          }
        />
        <MarketFilters
          sort={sortValue}
          category={categoryValue}
          filtersOpen={filtersOpen}
          filtersActive={filtersActive}
          onSortChange={onSortChange ?? setInternalSort}
          onCategoryChange={onCategoryChange ?? setInternalCategory}
        />
        {topCreators.length > 0 ? (
          <section className={styles.creators} aria-label={t('feed.topCreators')}>
            <span className={styles.creatorsTitle}>{t('feed.topCreators')}</span>
            <div className={styles.creatorRow}>
              {topCreators.map((creator) => (
                <button
                  key={creator.id}
                  type="button"
                  className={styles.creatorChip}
                  onClick={() => onTopCreatorClick?.(creator.id)}
                >
                  <Avatar
                    initials={creator.initials ?? creator.displayName.slice(0, 2)}
                    name={creator.displayName}
                    src={creator.photoUrl}
                    size="sm"
                  />
                  <span className={styles.creatorMeta}>
                    <span className={styles.creatorHandle}>
                      {creator.handle ? `@${creator.handle}` : creator.displayName}
                    </span>
                    {creator.volumeTon != null ? (
                      <span className={styles.creatorVolume}>{formatCompactAmount(creator.volumeTon)}</span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}
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
      </div>
      <BottomNavigation active="markets" onChange={onNavChange} />
    </div>
  )
}
