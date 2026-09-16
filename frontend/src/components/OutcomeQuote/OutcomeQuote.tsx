import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../../lib/cx'
import { useT } from '../../i18n'
import { formatOdds, formatTon } from '../../lib/format'
import { resolveOutcomeQuoteState } from '../../lib/quote'
import type { OutcomeQuoteState, OutcomeSide } from '../../types/market'
import styles from './OutcomeQuote.module.css'

export type OutcomeQuoteProps = {
  label: string
  odds?: number | null
  liquidity?: number | null
  side: OutcomeSide
  state?: OutcomeQuoteState
  showMetrics?: boolean
  density?: 'default' | 'compact'
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>

export function OutcomeQuote({
  label,
  odds = null,
  liquidity = null,
  side,
  state = 'default',
  showMetrics = true,
  density = 'default',
  className,
  type = 'button',
  disabled,
  ...rest
}: OutcomeQuoteProps) {
  const t = useT()
  const resolvedState = resolveOutcomeQuoteState({ odds, liquidity, state, showMetrics })
  const isDisabled =
    disabled ||
    resolvedState === 'disabled' ||
    resolvedState === 'loading' ||
    resolvedState === 'winner' ||
    resolvedState === 'resolved-loser'

  return (
    <button
      type={type}
      className={cx(
        styles.root,
        styles[side],
        resolvedState === 'selected' && styles.selected,
        resolvedState === 'pressed' && styles.pressed,
        resolvedState === 'disabled' && styles.disabled,
        resolvedState === 'loading' && styles.loading,
        resolvedState === 'no-liquidity' && styles.noLiquidity,
        resolvedState === 'winner' && styles.winner,
        resolvedState === 'resolved-loser' && styles.resolvedLoser,
        !showMetrics && styles.compact,
        density === 'compact' && styles.dense,
        className,
      )}
      data-side={side}
      data-state={resolvedState}
      aria-pressed={resolvedState === 'selected' || undefined}
      disabled={isDisabled}
      {...rest}
    >
      {resolvedState === 'loading' ? (
        <>
          <span className={cx(styles.skeleton, styles.skeletonLabel)} />
          <span className={cx(styles.skeleton, styles.skeletonOdds)} />
          <span className={cx(styles.skeleton, styles.skeletonLiq)} />
        </>
      ) : (
        <>
          <span className={styles.label}>{label}</span>
          {resolvedState === 'winner' ? <span className={styles.winnerMark}>{t('market.winner')}</span> : null}
          {showMetrics ? (
            <>
              <span className={styles.odds}>
                {formatOdds(resolvedState === 'no-liquidity' ? null : odds)}
              </span>
              <span className={styles.liquidity}>
                {resolvedState === 'no-liquidity' ? t('market.noLiq') : formatTon(liquidity)}
              </span>
            </>
          ) : null}
        </>
      )}
    </button>
  )
}
