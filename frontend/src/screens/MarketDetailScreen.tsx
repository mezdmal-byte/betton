import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '../components/Avatar/Avatar'
import { Button } from '../components/Button/Button'
import { IconButton } from '../components/IconButton/IconButton'
import { MarketChart } from '../components/MarketChart/MarketChart'
import { OutcomeQuote } from '../components/OutcomeQuote/OutcomeQuote'
import { RangeSelector } from '../components/RangeSelector/RangeSelector'
import { chartSpartakA, chartSpartakB, marketYesNo } from '../fixtures/markets'
import { formatInteger, formatTon } from '../lib/format'
import type { MarketFixture, OutcomeSide } from '../types/market'
import styles from './MarketDetailScreen.module.css'

export type MarketDetailScreenProps = {
  market?: MarketFixture
  selectedSide?: OutcomeSide
}

export function MarketDetailScreen({
  market = marketYesNo,
  selectedSide = 'a',
}: MarketDetailScreenProps) {
  const [side, setSide] = useState<OutcomeSide>(selectedSide)
  const [range, setRange] = useState('1d')
  const selected = side === 'a' ? market.outcomeA : market.outcomeB
  const series = side === 'a' ? chartSpartakA : chartSpartakB
  const currentOdds = selected.odds ?? series[series.length - 1]?.odds ?? 0

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label="Назад" size="md">
          <ChevronLeft size={22} />
        </IconButton>
        <div className={styles.meta}>
          <span>{market.category}</span>
          <span>·</span>
          <span>{market.closeLabel}</span>
        </div>
      </header>
      <div className={styles.body}>
        <h1 className={styles.question}>{market.question}</h1>
        <div className={styles.creatorRow}>
          <Avatar initials={market.creator.initials} name={market.creator.displayName} size="sm" />
          <span>@{market.creator.handle}</span>
          <span className={styles.stats}>
            {formatTon(market.volumeTon)} · {formatInteger(market.participants)}
          </span>
        </div>
        <div className={styles.outcomes}>
          <OutcomeQuote
            label={market.outcomeA.label}
            odds={market.outcomeA.odds}
            liquidity={market.outcomeA.liquidityTon}
            side="a"
            state={side === 'a' ? 'selected' : 'default'}
            onClick={() => setSide('a')}
          />
          <OutcomeQuote
            label={market.outcomeB.label}
            odds={market.outcomeB.odds}
            liquidity={market.outcomeB.liquidityTon}
            side="b"
            state={side === 'b' ? 'selected' : 'default'}
            onClick={() => setSide('b')}
          />
        </div>
        <RangeSelector value={range} onChange={setRange} />
        <MarketChart
          series={series}
          currentOdds={currentOdds}
          outcomeLabel={selected.label}
          volumeTon={market.volumeTon}
        />
        <section className={styles.info}>
          <h2>Как разрешится</h2>
          <p>{market.description}</p>
          <p>{market.resolution}</p>
        </section>
      </div>
      <div className={styles.actions}>
        <Button variant="secondary">Своя цена</Button>
        <Button>Поставить</Button>
      </div>
    </div>
  )
}
