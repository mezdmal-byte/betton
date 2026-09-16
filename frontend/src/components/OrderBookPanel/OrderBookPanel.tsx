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
      <OutcomeBook label={outcomeALabel} levels={sideA} />
      <OutcomeBook label={outcomeBLabel} levels={sideB} />
    </section>
  )
}

function OutcomeBook({ label, levels }: { label: string; levels: OrderBookLevel[] }) {
  const t = useT()
  const maxAvailable = Math.max(...levels.map((level) => level.availableTon), 1)
  return (
    <div className={styles.side}>
      <strong className={styles.sideTitle}>{label}</strong>
      <div className={styles.head}>
        <span>{t('book.coef')}</span>
        <span>{t('book.availCol')}</span>
      </div>
      {levels.length === 0 ? (
        <p className={styles.empty}>{t('book.noOrders')}</p>
      ) : (
        levels.map((level, index) => (
          <OrderBookRow key={`${level.odds}-${index}`} level={level} maxAvailable={maxAvailable} active={index === 0} />
        ))
      )}
    </div>
  )
}
