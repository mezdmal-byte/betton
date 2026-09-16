import { cx } from '../../lib/cx'
import { formatInteger, formatTon } from '../../lib/format'
import type { MarketFixture, OutcomeSide } from '../../types/market'
import { Avatar } from '../Avatar/Avatar'
import { OutcomeQuote } from '../OutcomeQuote/OutcomeQuote'
import styles from './MarketCard.module.css'

export type MarketCardProps = {
  market: MarketFixture
  selectedSide?: OutcomeSide | null
  onSelectOutcome?: (side: OutcomeSide) => void
}

export function MarketCard({ market, selectedSide = null, onSelectOutcome }: MarketCardProps) {
  const locked = market.status === 'resolved' || market.status === 'cancelled'
  const quoteState = (hasLiquidity: boolean, side: OutcomeSide) => {
    if (locked) return 'disabled' as const
    if (!hasLiquidity) return 'no-liquidity' as const
    if (selectedSide === side) return 'selected' as const
    return 'default' as const
  }

  return (
    <article className={styles.card} data-status={market.status}>
      <header className={styles.meta}>
        <span className={styles.category}>{market.category}</span>
        <span className={styles.dot}>·</span>
        <span className={cx(styles.time, market.status === 'closing' && styles.closing)}>
          {market.timeLeft}
        </span>
        {market.status === 'resolved' ? <span className={styles.badge}>Итог</span> : null}
        {market.status === 'cancelled' ? (
          <span className={cx(styles.badge, styles.cancelled)}>Отмена</span>
        ) : null}
      </header>
      <h2 className={styles.question}>{market.question}</h2>
      <div className={styles.creatorRow}>
        <Avatar initials={market.creator.initials} name={market.creator.displayName} size="sm" />
        <span className={styles.handle}>@{market.creator.handle}</span>
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
          state={quoteState(market.outcomeA.liquidityTon != null, 'a')}
          onClick={() => onSelectOutcome?.('a')}
        />
        <OutcomeQuote
          label={market.outcomeB.label}
          odds={market.outcomeB.odds}
          liquidity={market.outcomeB.liquidityTon}
          side="b"
          state={quoteState(market.outcomeB.liquidityTon != null, 'b')}
          onClick={() => onSelectOutcome?.('b')}
        />
      </div>
    </article>
  )
}
