import { MessageCircle, Search, SlidersHorizontal } from 'lucide-react'
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
import type { MarketFixture, OutcomeSide } from '../types/market'
import styles from './MarketsScreen.module.css'
import { useVisualV1 } from '../visualV1/VisualV1Context'
import { FeedV1 } from '../visualV1/FeedV1'

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
  selectedOutcomes?: Record<string, OutcomeSide>
  activeOffersNano?: string
  statsError?: boolean
  onRetryStats?: () => void
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
  chatUnreadReplies?: number
  onChatClick?: () => void
}

export function MarketsScreen(props: MarketsScreenProps) {
  const visualV1 = useVisualV1()
  return visualV1 ? <FeedV1 {...props} /> : <LegacyMarketsScreen {...props} />
}

function LegacyMarketsScreen({
  activeOffersNano,
  statsError = false,
  onRetryStats,
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
  chatUnreadReplies = 0,
  onChatClick,
}: MarketsScreenProps) {
  const t = useT()
  const [internalQuery, setInternalQuery] = useState(query)
  const [internalSort, setInternalSort] = useState(sort)
  const [searchOpen, setSearchOpen] = useState(() => Boolean(query.trim()))
  const [metricInfo, setMetricInfo] = useState(false)

  const search = onQueryChange ? query : internalQuery
  const sortValue = onSortChange ? sort : internalSort
  const metric = formatActiveOffers(activeOffersNano)

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1>{t('nav.feed')}</h1>
          <div className={styles.headerActions}>
            <ThemeToggle />
            {onChatClick ? (
              <span className={styles.chatAction}>
                <IconButton label="Лобби BetTON" variant="plain" size="md" onClick={onChatClick}>
                  <MessageCircle size={21} strokeWidth={1.8} />
                </IconButton>
                {chatUnreadReplies > 0 ? (
                  <span className={styles.chatBadge}>{chatUnreadReplies > 9 ? '9+' : chatUnreadReplies}</span>
                ) : null}
              </span>
            ) : null}
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
        <p>{t('feed.chooseEvent')}</p>
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
          <button type="button" className={styles.metric} aria-expanded={metricInfo} onClick={() => setMetricInfo(!metricInfo)}>
            <strong>{statsError ? '—' : metric}</strong>
            <span>{t('feed.activeOffers')}</span>
          </button>
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
        {metricInfo ? <div className={styles.metricInfo}><p>{t('feed.activeOffersHelp')}</p><Button variant="secondary" onClick={() => setMetricInfo(false)}>{t('understood')}</Button></div> : null}
        {statsError ? <button className={styles.metricRetry} onClick={onRetryStats}>{t('feed.statsError')}</button> : null}

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

export function formatActiveOffers(value?: string): string {
  if (value == null) return '—'
  try {
    const nano = BigInt(value), whole = nano / 1_000_000_000n
    const fraction = (nano % 1_000_000_000n).toString().padStart(9, '0').replace(/0+$/, '')
    return new Intl.NumberFormat('ru-RU').format(whole) + (fraction ? ',' + fraction : '') + ' TON'
  } catch { return '—' }
}
