import { useEffect, useId, useState } from 'react'
import { useT } from '../../i18n'
import { Button } from '../Button/Button'
import { Chip } from '../Chip/Chip'
import styles from './FilterSheet.module.css'

export const STATUS_FILTERS = [
  { id: 'all', labelKey: 'status.all' },
  { id: 'open', labelKey: 'status.open' },
  { id: 'closed', labelKey: 'status.closed' },
  { id: 'resolved', labelKey: 'status.resolved' },
  { id: 'cancelled', labelKey: 'status.cancelled' },
] as const

export type FilterSheetProps = {
  open: boolean
  status: string
  onClose: () => void
  onApply: (status: string) => void
}

export function FilterSheet({ open, status, onClose, onApply }: FilterSheetProps) {
  const t = useT()
  const titleId = useId()
  const [draft, setDraft] = useState(status)

  useEffect(() => {
    if (open) setDraft(status)
  }, [open, status])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <section
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.handle} aria-hidden="true" />
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            {t('feed.filters')}
          </h2>
          <button
            type="button"
            className={styles.reset}
            onClick={() => setDraft('all')}
          >
            {t('feed.reset')}
          </button>
        </div>
        <div className={styles.pills} role="radiogroup" aria-labelledby={titleId}>
          {STATUS_FILTERS.map((item) => (
            <Chip
              key={item.id}
              className={styles.chip}
              surface="raised"
              selected={draft === item.id}
              onClick={() => setDraft(item.id)}
            >
              {t(item.labelKey)}
            </Chip>
          ))}
        </div>
        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={() => {
              setDraft('all')
            }}
          >
            {t('feed.reset')}
          </Button>
          <Button
            onClick={() => {
              onApply(draft)
              onClose()
            }}
          >
            {t('feed.apply')}
          </Button>
        </div>
      </section>
    </div>
  )
}
