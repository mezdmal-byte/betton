import { MessageCircle, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { IconButton } from '../components/IconButton/IconButton'
import { MarketCard } from '../components/MarketCard/MarketCard'
import { SearchField } from '../components/SearchField/SearchField'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { ThemeToggle } from '../components/ThemeToggle/ThemeToggle'
import { feedMarkets } from '../fixtures/markets'
import { useT } from '../i18n'
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

export function MarketsScreen({
  activeOffersNano, statsError = false, onRetryStats, markets = feedMarkets,
  query = '', sort = 'new', category = 'all', filtersOpen = false,
  filtersActive = false, onQueryChange, onSortChange, onCategoryChange,
  onFiltersClick, onSelectOutcome, onSelectMarket, onCreatorClick, onNavChange,
  onProfileClick, headerUser, accountState = 'ready', feedState = 'ready',
  onRetry, hasMore = false, loadingMore = false, onLoadMore,
  chatUnreadReplies = 0, onChatClick,
}: MarketsScreenProps) {
  const t = useT()
  const [internalQuery, setInternalQuery] = useState(query)
  const [internalSort, setInternalSort] = useState(sort)
  const search = onQueryChange ? query : internalQuery
  const sortValue = onSortChange ? sort : internalSort
  const categories = [['all', 'cat.all'], ['sport', 'cat.sport'], ['politics', 'cat.politics'], ['crypto', 'cat.crypto'], ['unique', 'cat.other']] as const
  return <div className={styles.screen}>
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <strong className={styles.brand}>BetTON<span>.</span></strong>
        <div className={styles.headerActions}>
          {headerUser && accountState === 'ready' ? <button className={styles.account} onClick={onProfileClick}>{headerUser.availableTon.toLocaleString(undefined,{maximumFractionDigits:4})} TON</button> : null}
          <ThemeToggle />
          {onChatClick ? <span className={styles.chatAction}><IconButton label="Лобби BetTON" variant="plain" size="md" onClick={onChatClick}><MessageCircle size={21}/></IconButton>{chatUnreadReplies>0?<span className={styles.chatBadge}>{chatUnreadReplies>9?'9+':chatUnreadReplies}</span>:null}</span> : null}
        </div>
      </div>
    </header>
    <main className={styles.body}>
      <h1 className={styles.heading}>{t('nav.feed')}</h1>
      <p className={styles.lead}>{t('feed.chooseEvent')}</p>
      <div className={styles.searchRow}><SearchField value={search} onChange={onQueryChange ?? setInternalQuery} placeholder={t('feed.searchPh')}/><IconButton label={t('feed.filters')} variant="plain" size="md" className={filtersActive||filtersOpen?styles.filterActive:styles.filter} aria-pressed={filtersOpen||filtersActive} onClick={onFiltersClick}><SlidersHorizontal size={21}/></IconButton></div>
      {onCategoryChange ? <div className={styles.categories} aria-label={t('feed.filters')}>{categories.map(([id,key])=><button key={id} aria-pressed={category===id} onClick={()=>onCategoryChange(id)}>{t(key)}</button>)}</div> : null}
      <div className={styles.feedLabel}><span>{feedState==='loading'?t('loading'):t('nav.feed')}</span><label>{t('feed.sort')}<select value={sortValue} onChange={e=>(onSortChange??setInternalSort)(e.target.value)}><option value="new">{t('cat.all')}</option><option value="popular">{t('feed.popular')}</option><option value="closing">{t('status.closing')}</option></select></label></div>
      <div className={styles.feed}>
        {feedState==='loading'?<StatusMessage tone="loading" title={t('loading')}>{t('loading.body')}</StatusMessage>:null}
        {feedState==='empty'?<StatusMessage tone="empty" title={t('feed.emptyTitle')}>{t('feed.emptyBody')}</StatusMessage>:null}
        {feedState==='error'?<StatusMessage tone="error" title={t('err.request')}>{t('err.requestBody')}</StatusMessage>:null}
        {feedState==='error'&&onRetry?<Button variant="secondary" onClick={onRetry}>{t('retry')}</Button>:null}
        {feedState==='ready'||(feedState==='error'&&markets.length>0)?markets.map(market=><MarketCard key={market.id} market={market} onOpen={onSelectMarket?()=>onSelectMarket(market):undefined} onCreatorClick={onCreatorClick&&(market.creator.id||market.creatorId)?()=>onCreatorClick(market):undefined} onSelectOutcome={side=>onSelectOutcome?.(market,side)}/>):null}
        {feedState==='ready'&&hasMore?<Button variant="secondary" fullWidth loading={loadingMore} onClick={onLoadMore}>{t('feed.more')}</Button>:null}
      </div>
      <details className={styles.marketContext}><summary>{t('feed.activeOffers')}</summary><strong>{statsError?'—':formatActiveOffers(activeOffersNano)}</strong><p>{t('feed.activeOffersHelp')}</p>{statsError?<button onClick={onRetryStats}>{t('feed.statsError')}</button>:null}</details>
    </main>
    <BottomNavigation active="markets" onChange={onNavChange}/>
  </div>
}

export function formatActiveOffers(value?: string): string {
  if (value == null) return '—'
  try {
    const nano = BigInt(value), whole = nano / 1_000_000_000n
    const fraction = (nano % 1_000_000_000n).toString().padStart(9, '0').replace(/0+$/, '')
    return new Intl.NumberFormat('ru-RU').format(whole) + (fraction ? ',' + fraction : '') + ' TON'
  } catch { return '—' }
}
