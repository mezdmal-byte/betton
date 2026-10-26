import { formatTonFull } from '../../lib/format'
import { marketIsLocked, marketOutcomeQuoteState } from '../../lib/quote'
import { useT, type MessageKey } from '../../i18n'
import type { MarketFixture, OutcomeSide } from '../../types/market'
import { cx } from '../../lib/cx'
import { OutcomeQuote } from '../OutcomeQuote/OutcomeQuote'
import styles from './MarketCard.module.css'
import { ArrowUpRight } from 'lucide-react'

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
  onCreatorClick,
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
      <header className={styles.meta}>
        <span className={styles.category}>{categoryLabel(market, t)}</span>
        {badge ? (
          <span className={cx(styles.badge, market.status === 'cancelled' && styles.cancelled)}>{badge}</span>
        ) : null}
      </header>

      <button type="button" className={styles.open} onClick={onOpen}>
        <h2 className={styles.question}>{market.question}</h2>
        <ArrowUpRight size={20} aria-hidden="true" />
      </button>

      <div className={styles.outcomes}>
        <OutcomeQuote
          label={market.outcomeA.label}
          odds={market.outcomeA.odds}
          liquidity={market.outcomeA.liquidityTon}
          side="a"
          state={marketOutcomeQuoteState(market, 'a', selectedSide)}
          showLiquidity
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
          showLiquidity
          density="feed"
          onClick={() => {
            if (!locked) onSelectOutcome?.('b')
          }}
        />
      </div>
      <footer className={styles.marketMeta}>
        <span>{market.closeLabel}</span>
        {onCreatorClick ? <button type="button" onClick={onCreatorClick}>@{market.creator.handle}</button> : null}
        <span>{t('market.volume')} {formatTonFull(market.volumeTon)}</span>
      </footer>
    </article>
  )
}
