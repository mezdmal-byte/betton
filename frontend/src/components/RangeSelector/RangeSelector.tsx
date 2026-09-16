import { cx } from '../../lib/cx'
import styles from './RangeSelector.module.css'

export const RANGE_OPTIONS = [
  { id: '1d', label: '1Д' },
  { id: '1w', label: '1Н' },
  { id: '1m', label: '1М' },
  { id: 'all', label: 'Все' },
] as const

export type RangeSelectorProps = {
  value: string
  onChange?: (id: string) => void
}

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div className={styles.root} role="tablist" aria-label="Период">
      {RANGE_OPTIONS.map((item) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cx(styles.item, selected && styles.active)}
            onClick={() => onChange?.(item.id)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
