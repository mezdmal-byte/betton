import { useMemo, useState } from 'react'
import { CATEGORIES, FEED_MARKETS, liquidityLine, matchesQuery, type FeedMarket } from '../fixture'
import styles from './RailFeed.module.css'

export function RailFeed() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Все')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const markets = useMemo(
    () =>
      FEED_MARKETS.filter((market) => (category === 'Все' || market.category === category) && matchesQuery(market, query)),
    [category, query],
  )

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <strong>BetTON</strong>
        <span>Демо-числа, не котировка</span>
      </header>
      <div className={styles.body}>
        <nav className={styles.rail} aria-label="Категории">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              className={item === category ? styles.railOn : styles.railOff}
              aria-pressed={item === category}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <section className={styles.list}>
          <label className={styles.search}>
            <span className={styles.sr}>Поиск</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск рынка"
            />
          </label>
          {markets.length === 0 ? <p className={styles.empty}>Ничего не найдено</p> : null}
          {markets.map((market) => (
            <MarketRow
              key={market.id}
              market={market}
              selected={market.id === selectedId}
              onSelect={() => setSelectedId(market.id === selectedId ? null : market.id)}
            />
          ))}
        </section>
      </div>
    </div>
  )
}

function MarketRow({
  market,
  selected,
  onSelect,
}: {
  market: FeedMarket
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button type="button" className={selected ? styles.rowOn : styles.row} onClick={onSelect} aria-pressed={selected}>
      <span className={styles.question}>{market.question}</span>
      <span className={styles.pct}>{market.probability}%</span>
      <span className={styles.meta}>
        {market.creator} · {market.closeGroup}, {market.closeTime}
      </span>
      <span className={styles.liq}>{liquidityLine(market)}</span>
      {market.trend ? <span className={styles.trend}>{market.trend}</span> : null}
    </button>
  )
}
