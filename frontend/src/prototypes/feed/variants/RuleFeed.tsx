import { useMemo, useState } from 'react'
import { FEED_MARKETS, liquidityLine, matchesQuery, type FeedMarket } from '../fixture'
import styles from './RuleFeed.module.css'

type SortKey = 'probability' | 'close' | 'liquidity'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'probability', label: 'Вероятность' },
  { key: 'close', label: 'Закрытие' },
  { key: 'liquidity', label: 'Ликвидность' },
]

export function RuleFeed() {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('probability')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const markets = useMemo(() => {
    const visible = FEED_MARKETS.filter((market) => matchesQuery(market, query))
    return [...visible].sort((a, b) => {
      if (sort === 'probability') return b.probability - a.probability
      if (sort === 'liquidity') return b.availableTon - a.availableTon
      return a.closeOrder - b.closeOrder
    })
  }, [query, sort])

  return (
    <div className={styles.screen}>
      <header>
        <strong>BetTON</strong>
        <p>Демо-числа, не котировка backend</p>
      </header>
      <div className={styles.sort} role="group" aria-label="Сортировка">
        {SORTS.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={sort === item.key}
            className={sort === item.key ? styles.sortOn : undefined}
            onClick={() => setSort(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <label className={styles.search}>
        <span className={styles.sr}>Поиск</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск рынка" />
      </label>
      {markets.length === 0 ? <p className={styles.empty}>Ничего не найдено</p> : null}
      <ul>
        {markets.map((market) => (
          <li key={market.id}>
            <RuleRow
              market={market}
              selected={market.id === selectedId}
              onSelect={() => setSelectedId(market.id === selectedId ? null : market.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

function RuleRow({
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
      <span className={styles.meter} aria-hidden="true">
        <span className={styles.track} style={{ ['--p' as string]: `${market.probability}%` }} />
        <span className={styles.pct}>{market.probability}%</span>
      </span>
      <span className={styles.meta}>
        {market.category} · {market.creator} · {market.closeGroup}, {market.closeTime}
        {market.trend ? ` · ${market.trend}` : ''}
      </span>
      <span className={market.availableTon === 0 ? styles.dry : styles.liq}>{liquidityLine(market)}</span>
    </button>
  )
}
