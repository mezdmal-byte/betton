import { formatInteger, formatTon } from '../../lib/format'
import { marketIsLocked, marketOutcomeQuoteState } from '../../lib/quote'
import type { MarketFixture, OutcomeSide } from '../../types/market'
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

export function MarketCard({ market, selectedSide = null, onSelectOutcome, onOpen }: MarketCardProps) {
  const locked = marketIsLocked(market)

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
        {market.status === 'closed' ? <span className={styles.badge}>Приём завершён</span> : null}
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
          state={marketOutcomeQuoteState(market, 'a', selectedSide)}
          onClick={() => {
            if (!locked) onSelectOutcome?.('a')
          }}
        />
        <OutcomeQuote
          label={market.outcomeB.label}
          odds={market.outcomeB.odds}
          liquidity={market.outcomeB.liquidityTon}
          side="b"
          state={marketOutcomeQuoteState(market, 'b', selectedSide)}
          onClick={() => {
            if (!locked) onSelectOutcome?.('b')
          }}
        />
      </div>
    </article>
  )
}
