import { Plus, Search, Wallet } from 'lucide-react'
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
  const items: Array<{ id: NavId; label: string; icon: typeof Search }> = [
    { id: 'markets', label: t('nav.feed'), icon: Search },
    { id: 'create', label: t('nav.create'), icon: Plus },
    { id: 'portfolio', label: t('nav.mine'), icon: Wallet },
  ]

  return (
    <nav className={styles.root} aria-label={t('nav.main')}>
      {items.map((item) => {
        const Icon = item.icon
        const selected = item.id === active
        const create = item.id === 'create'
        return (
          <button
            key={item.id}
            type="button"
            className={cx(styles.item, selected && styles.active, create && styles.create)}
            aria-current={selected ? 'page' : undefined}
            onClick={() => onChange?.(item.id)}
          >
            <span className={cx(styles.iconWrap, create && styles.createIcon)}>
              <Icon size={create ? 20 : 22} strokeWidth={selected || create ? 2.2 : 1.8} />
            </span>
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
