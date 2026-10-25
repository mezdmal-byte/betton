import { cx } from '../../lib/cx'
import styles from './Tabs.module.css'

export type TabItem = {
  id: string
  label: string
}

export type TabsProps = {
  items: TabItem[]
  value: string
  onChange?: (id: string) => void
  ariaLabel?: string
  equal?: boolean
}

export function Tabs({ items, value, onChange, ariaLabel, equal = false }: TabsProps) {
  return (
    <div className={cx(styles.list, equal && styles.equal)} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cx(styles.tab, selected && styles.active)}
            onClick={() => onChange?.(item.id)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
