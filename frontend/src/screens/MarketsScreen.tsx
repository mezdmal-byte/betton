import { useState } from 'react'
import { currentUser, feedMarkets } from '../fixtures/markets'
import type { MarketFixture, OutcomeSide } from '../types/market'
import { Avatar } from '../components/Avatar/Avatar'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { MarketCard } from '../components/MarketCard/MarketCard'
import { MarketFilters } from '../components/MarketFilters/MarketFilters'
import { SearchField } from '../components/SearchField/SearchField'
import { formatTon } from '../lib/format'
import styles from './MarketsScreen.module.css'

export type MarketsScreenProps = {
  markets?: MarketFixture[]
  query?: string
  sort?: string
  category?: string
  onSelectOutcome?: (market: MarketFixture, side: OutcomeSide) => void
}

export function MarketsScreen({
  markets = feedMarkets,
  query = '',
  sort = 'new',
  category = 'all',
  onSelectOutcome,
}: MarketsScreenProps) {
  const [search, setSearch] = useState(query)
  const [sortValue, setSortValue] = useState(sort)
  const [categoryValue, setCategoryValue] = useState(category)

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.brand}>
          Bet<span>TON</span>
        </h1>
        <div className={styles.headerRight}>
          <div className={styles.balance}>
            <span>Доступно</span>
            <strong>{formatTon(currentUser.availableTon)}</strong>
          </div>
          <Avatar initials={currentUser.initials} name={currentUser.displayName} size="md" />
        </div>
      </header>
      <div className={styles.body}>
        <SearchField value={search} onChange={setSearch} />
        <MarketFilters
          sort={sortValue}
          category={categoryValue}
          onSortChange={setSortValue}
          onCategoryChange={setCategoryValue}
        />
        <div className={styles.feed}>
          {markets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              onSelectOutcome={(side) => onSelectOutcome?.(market, side)}
            />
          ))}
        </div>
      </div>
      <BottomNavigation active="markets" />
    </div>
  )
}
