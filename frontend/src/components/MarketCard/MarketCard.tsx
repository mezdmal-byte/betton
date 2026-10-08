import { formatTonFull } from '../../lib/format'
import { marketIsLocked, marketOutcomeQuoteState } from '../../lib/quote'
import { useT, type MessageKey } from '../../i18n'
import type { MarketFixture, OutcomeSide } from '../../types/market'
import { cx } from '../../lib/cx'
import { OutcomeQuote } from '../OutcomeQuote/OutcomeQuote'
import styles from './MarketCard.module.css'

export type MarketCardProps = {
  market: MarketFixture
  selectedSide?: OutcomeSide | null
  onSelectOutcome?: (side: OutcomeSide) => void
  onOpen?: () => void
  onCreatorClick?: () => void
}

function categoryLabel(market: MarketFixture, t: (key: MessageKey) => string): string {
  if (market.categoryKey === 'sport') return t('cat.sport')
  if (market.categoryKey === 'politics') return t('cat.politics')
  if (market.categoryKey === 'crypto') return t('cat.crypto')
  if (market.categoryKey === 'unique') return t('cat.other')
  return market.category
}

export function MarketCard({
  market,
  selectedSide = null,
  onSelectOutcome,
  onOpen,
}: MarketCardProps) {
  const t = useT()
  const locked = marketIsLocked(market)
  const badge =
    market.status === 'resolved'
      ? t('market.badgeResult')
      : market.status === 'cancelled'
        ? t('market.badgeCancel')
        : market.status === 'closed'
          ? t('status.closedOne')
          : null

  return (
    <article className={styles.card} data-status={market.status}>
      <header className={styles.meta} onClick={onOpen}>
        <span className={styles.category}>{categoryLabel(market, t)}</span>
        {badge ? (
          <span className={cx(styles.badge, market.status === 'cancelled' && styles.cancelled)}>{badge}</span>
        ) : null}
      </header>

      <h2 className={styles.question} onClick={onOpen}>
        {market.question}
      </h2>

      <p className={styles.marketMeta} onClick={onOpen}>
        {t('market.volume')} {formatTonFull(market.volumeTon)} · {market.closeLabel}
      </p>

      <div className={styles.outcomes}>
        <OutcomeQuote
          label={market.outcomeA.label}
          odds={market.outcomeA.odds}
          liquidity={market.outcomeA.liquidityTon}
          side="a"
          state={marketOutcomeQuoteState(market, 'a', selectedSide)}
          showLiquidity={false}
          density="feed"
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
          showLiquidity={false}
          density="feed"
          onClick={() => {
            if (!locked) onSelectOutcome?.('b')
          }}
        />
      </div>
    </article>
  )
}
