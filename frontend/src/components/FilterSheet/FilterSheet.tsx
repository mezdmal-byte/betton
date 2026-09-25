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

export const CATEGORY_FILTERS = [
  { id: 'all', labelKey: 'cat.all' },
  { id: 'sport', labelKey: 'cat.sport' },
  { id: 'politics', labelKey: 'cat.politics' },
  { id: 'crypto', labelKey: 'cat.crypto' },
  { id: 'other', labelKey: 'cat.other' },
] as const

export type FilterSheetProps = {
  open: boolean
  status: string
  category?: string
  onClose: () => void
  onApply: (status: string, category: string) => void
}

export function FilterSheet({
  open,
  status,
  category = 'all',
  onClose,
  onApply,
}: FilterSheetProps) {
  const t = useT()
  const titleId = useId()
  const [draftStatus, setDraftStatus] = useState(status)
  const [draftCategory, setDraftCategory] = useState(category)

  useEffect(() => {
    if (!open) return
    setDraftStatus(status)
    setDraftCategory(category)
  }, [open, status, category])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const reset = () => {
    setDraftStatus('all')
    setDraftCategory('all')
  }

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
          <h2 id={titleId} className={styles.title}>{t('feed.filters')}</h2>
          <button type="button" className={styles.reset} onClick={reset}>{t('feed.reset')}</button>
        </div>

        <div className={styles.group}>
          <strong className={styles.groupTitle}>{t('feed.status')}</strong>
          <div className={styles.pills} role="radiogroup" aria-label={t('feed.status')}>
            {STATUS_FILTERS.map((item) => (
              <Chip
                key={item.id}
                className={styles.chip}
                surface="raised"
                selected={draftStatus === item.id}
                onClick={() => setDraftStatus(item.id)}
              >
                {t(item.labelKey)}
              </Chip>
            ))}
          </div>
        </div>

        <div className={styles.group}>
          <strong className={styles.groupTitle}>{t('feed.cats')}</strong>
          <div className={styles.pills} role="radiogroup" aria-label={t('feed.cats')}>
            {CATEGORY_FILTERS.map((item) => (
              <Chip
                key={item.id}
                className={styles.chip}
                surface="raised"
                selected={draftCategory === item.id}
                onClick={() => setDraftCategory(item.id)}
              >
                {t(item.labelKey)}
              </Chip>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={reset}>{t('feed.reset')}</Button>
          <Button
            onClick={() => {
              onApply(draftStatus, draftCategory)
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
