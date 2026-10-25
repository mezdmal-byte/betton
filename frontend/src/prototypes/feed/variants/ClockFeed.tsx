import { useMemo, useState } from 'react'
import { FEED_MARKETS, liquidityLine, matchesQuery, type FeedMarket } from '../fixture'
import styles from './ClockFeed.module.css'

export function ClockFeed() {
  const [query, setQuery] = useState('')
  const [soonestFirst, setSoonestFirst] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const groups = useMemo(() => {
    const visible = FEED_MARKETS.filter((market) => matchesQuery(market, query)).sort((a, b) =>
      soonestFirst ? a.closeOrder - b.closeOrder : b.closeOrder - a.closeOrder,
    )
    const buckets = new Map<string, FeedMarket[]>()
    for (const market of visible) {
      const list = buckets.get(market.closeGroup) ?? []
      list.push(market)
      buckets.set(market.closeGroup, list)
    }
    return [...buckets.entries()]
  }, [query, soonestFirst])

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <strong>BetTON</strong>
        <div className={styles.sort}>
          <button type="button" aria-pressed={soonestFirst} className={soonestFirst ? styles.sortOn : undefined} onClick={() => setSoonestFirst(true)}>
            Раньше
          </button>
          <button type="button" aria-pressed={!soonestFirst} className={!soonestFirst ? styles.sortOn : undefined} onClick={() => setSoonestFirst(false)}>
            Позже
          </button>
        </div>
      </header>
      <p className={styles.note}>Демо-числа, не котировка backend</p>
      <label className={styles.search}>
        <span className={styles.sr}>Поиск</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск рынка" />
      </label>
      {groups.length === 0 ? <p className={styles.empty}>Ничего не найдено</p> : null}
      {groups.map(([group, markets]) => (
        <section key={group}>
          <h2>{group}</h2>
          {markets.map((market) => (
            <button
              key={market.id}
              type="button"
              className={market.id === selectedId ? styles.rowOn : styles.row}
              aria-pressed={market.id === selectedId}
              onClick={() => setSelectedId(market.id === selectedId ? null : market.id)}
            >
              <time dateTime={market.closeTime}>{market.closeTime}</time>
              <span>
                <span className={styles.question}>{market.question}</span>
                <span className={styles.meta}>
                  {market.category} · {market.creator} · {market.probability}%
                  {market.trend ? ` · ${market.trend}` : ''}
                </span>
                <span className={styles.liq}>{liquidityLine(market)}</span>
              </span>
            </button>
          ))}
        </section>
      ))}
    </div>
  )
}
