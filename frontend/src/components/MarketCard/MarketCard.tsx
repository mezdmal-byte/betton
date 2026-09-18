import { Clock } from 'lucide-react'
import { formatInteger, formatTon } from '../../lib/format'
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
      <header className={styles.meta} onClick={onOpen}>
        <span className={styles.category}>{categoryLabel(market, t)}</span>
        {badge ? (
          <span className={cx(styles.badge, market.status === 'cancelled' && styles.cancelled)}>{badge}</span>
        ) : (
          <span className={cx(styles.time, market.status === 'closing' && styles.closing)}>
            <Clock size={12} strokeWidth={2.2} aria-hidden="true" />
            {market.timeLeft}
          </span>
        )}
      </header>
      <h2 className={styles.question} onClick={onOpen}>
        {market.question}
      </h2>
      <div
        className={cx(styles.creatorRow, onCreatorClick && styles.creatorClick)}
        onClick={(event) => {
          if (onCreatorClick) {
            event.stopPropagation()
            onCreatorClick()
            return
          }
          onOpen?.()
        }}
        role={onCreatorClick ? 'button' : undefined}
        tabIndex={onCreatorClick ? 0 : undefined}
        onKeyDown={
          onCreatorClick
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onCreatorClick()
                }
              }
            : undefined
        }
      >
        <span className={styles.handle}>@{market.creator.handle}</span>
        <span className={styles.dot}>·</span>
        <span className={styles.stats}>{formatTon(market.volumeTon)}</span>
        <span className={styles.dot}>·</span>
        <span className={styles.stats}>{t('market.peopleCount', { n: formatInteger(market.participants) })}</span>
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
