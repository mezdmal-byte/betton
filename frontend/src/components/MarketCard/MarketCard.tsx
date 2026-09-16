import { formatInteger, formatTon } from '../../lib/format'
import { outcomeIsExecutable } from '../../lib/quote'
import type { MarketFixture, OutcomeQuoteState, OutcomeSide } from '../../types/market'
import { cx } from '../../lib/cx'
import { Avatar } from '../Avatar/Avatar'
import { OutcomeQuote } from '../OutcomeQuote/OutcomeQuote'
import styles from './MarketCard.module.css'

export type MarketCardProps = {
  market: MarketFixture
  selectedSide?: OutcomeSide | null
  onSelectOutcome?: (side: OutcomeSide) => void
  onOpen?: () => void
}

function quoteState(market: MarketFixture, side: OutcomeSide, selectedSide: OutcomeSide | null): OutcomeQuoteState {
  if (market.status === 'resolved') {
    return market.resolvedSide === side ? 'winner' : 'resolved-loser'
  }
  if (market.status === 'cancelled') return 'disabled'
  const outcome = side === 'a' ? market.outcomeA : market.outcomeB
  if (!outcomeIsExecutable(outcome)) return 'no-liquidity'
  if (selectedSide === side) return 'selected'
  return 'default'
}

export function MarketCard({ market, selectedSide = null, onSelectOutcome, onOpen }: MarketCardProps) {
  const locked = market.status === 'resolved' || market.status === 'cancelled'

  return (
    <article className={styles.card} data-status={market.status}>
      <header className={styles.meta} onClick={onOpen}>
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
      <h2 className={styles.question} onClick={onOpen}>
        {market.question}
      </h2>
      <div className={styles.creatorRow} onClick={onOpen}>
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
          state={quoteState(market, 'a', selectedSide)}
          onClick={() => {
            if (!locked) onSelectOutcome?.('a')
          }}
        />
        <OutcomeQuote
          label={market.outcomeB.label}
          odds={market.outcomeB.odds}
          liquidity={market.outcomeB.liquidityTon}
          side="b"
          state={quoteState(market, 'b', selectedSide)}
          onClick={() => {
            if (!locked) onSelectOutcome?.('b')
          }}
        />
      </div>
    </article>
  )
}
