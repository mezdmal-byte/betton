import { LayoutGrid, Plus, Wallet } from 'lucide-react'
import { cx } from '../../lib/cx'
import styles from './BottomNavigation.module.css'

export type NavId = 'markets' | 'create' | 'portfolio'

const ITEMS: Array<{ id: NavId; label: string; icon: typeof LayoutGrid }> = [
  { id: 'markets', label: 'Рынки', icon: LayoutGrid },
  { id: 'create', label: 'Создать', icon: Plus },
  { id: 'portfolio', label: 'Портфель', icon: Wallet },
]

export type BottomNavigationProps = {
  active: NavId
  onChange?: (id: NavId) => void
}

export function BottomNavigation({ active, onChange }: BottomNavigationProps) {
  return (
    <nav className={styles.root} aria-label="Основное меню">
      {ITEMS.map((item) => {
        const Icon = item.icon
        const selected = item.id === active
        return (
          <button
            key={item.id}
            type="button"
            className={cx(styles.item, selected && styles.active)}
            aria-current={selected ? 'page' : undefined}
            onClick={() => onChange?.(item.id)}
          >
            <Icon size={22} strokeWidth={selected ? 2.2 : 1.8} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
