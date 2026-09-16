import { LayoutGrid, Plus, Wallet } from 'lucide-react'
import { useT } from '../../i18n'
import { cx } from '../../lib/cx'
import styles from './BottomNavigation.module.css'

export type NavId = 'markets' | 'create' | 'portfolio'

export type BottomNavigationProps = {
  active: NavId
  onChange?: (id: NavId) => void
}

export function BottomNavigation({ active, onChange }: BottomNavigationProps) {
  const t = useT()
  const items: Array<{ id: NavId; label: string; icon: typeof LayoutGrid }> = [
    { id: 'markets', label: t('nav.feed'), icon: LayoutGrid },
    { id: 'create', label: t('nav.create'), icon: Plus },
    { id: 'portfolio', label: t('nav.mine'), icon: Wallet },
  ]

  return (
    <nav className={styles.root} aria-label={t('nav.main')}>
      {items.map((item) => {
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
