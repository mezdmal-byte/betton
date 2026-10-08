import { useState } from 'react'
import { useT } from '../../i18n'
import type { OrderBookLevel } from '../../types/market'
import { OrderBookRow } from '../OrderBookRow/OrderBookRow'
import { StatusMessage } from '../StatusMessage/StatusMessage'
import styles from './OrderBookPanel.module.css'

export type OrderBookPanelProps = {
  outcomeALabel: string
  outcomeBLabel: string
  sideA: OrderBookLevel[]
  sideB: OrderBookLevel[]
  state?: 'ready' | 'loading' | 'error' | 'empty'
  hint?: string
  onRetry?: () => void
}

export function OrderBookPanel({
  outcomeALabel,
  outcomeBLabel,
  sideA,
  sideB,
  state = 'ready',
  hint,
  onRetry,
}: OrderBookPanelProps) {
  const t = useT()
  const [expanded, setExpanded] = useState(false)
  const canExpand = sideA.length > 5 || sideB.length > 5
  if (state === 'loading') {
    return (
      <StatusMessage tone="loading" title={t('book.loading')}>
        {t('loading.body')}
      </StatusMessage>
    )
  }
  if (state === 'error') {
    return (
      <div className={styles.errorBlock}>
        <StatusMessage tone="error" title={t('book.error')} />
        {onRetry ? (
          <button type="button" className={styles.retry} onClick={onRetry}>
            {t('retry')}
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <section className={styles.root} aria-label={t('event.book')}>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
      <OutcomeBook label={outcomeALabel} levels={sideA} expanded={expanded} />
      <OutcomeBook label={outcomeBLabel} levels={sideB} expanded={expanded} />
      {canExpand ? (
        <button type="button" className={styles.expandButton} onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Свернуть стакан ↑' : 'Показать весь стакан ↓'}
        </button>
      ) : null}
    </section>
  )
}

function OutcomeBook({
  label,
  levels,
  expanded,
}: {
  label: string
  levels: OrderBookLevel[]
  expanded: boolean
}) {
  const t = useT()
  const sortedLevels = [...levels].sort((a, b) => b.odds - a.odds)
  const visibleLevels = expanded ? sortedLevels : sortedLevels.slice(0, 5)
  const maxAvailable = Math.max(...sortedLevels.map((level) => level.availableTon), 1)
  return (
    <div className={styles.side}>
      <strong className={styles.sideTitle}>{label}</strong>
      <div className={styles.head}>
        <span>{t('book.coef')}</span>
        <span>{t('book.availCol')}</span>
      </div>
      {sortedLevels.length === 0 ? (
        <p className={styles.empty}>{t('book.noOrders')}</p>
      ) : (
        visibleLevels.map((level, index) => (
          <OrderBookRow key={`${level.odds}-${index}`} level={level} maxAvailable={maxAvailable} active={index === 0} />
        ))
      )}
    </div>
  )
}
