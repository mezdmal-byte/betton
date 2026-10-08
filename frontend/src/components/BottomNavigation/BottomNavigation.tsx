import { useT } from '../../i18n'
import { cx } from '../../lib/cx'
import styles from './BottomNavigation.module.css'

export type NavId = 'markets' | 'portfolio' | 'create' | 'notifications' | 'profile'

export type BottomNavigationProps = {
  active: NavId
  onChange?: (id: NavId) => void
}

type IconProps = { className?: string }

function MarketsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5V19H20M8 14L12 9L16 12L20 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PortfolioIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6H6C4.34315 6 3 7.34315 3 9V18C3 19.6569 4.34315 21 6 21H18C19.6569 21 21 19.6569 21 18V9C21 7.34315 19.6569 6 18 6Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6V4C8 3.73478 8.10536 3.48043 8.29289 3.29289C8.48043 3.10536 8.73478 3 9 3H15C15.2652 3 15.5196 3.10536 15.7071 3.29289C15.8946 3.48043 16 3.73478 16 4V6M3 11H21M10 11V14H14V11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NotificationsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 21H14M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 15 3 17H21C21 15 18 15 18 8Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ProfileIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 21V19C4 17.4087 4.63214 15.8826 5.75736 14.7574C6.88258 13.6321 8.4087 13 10 13H14C15.5913 13 17.1174 13.6321 18.2426 14.7574C19.3679 15.8826 20 17.4087 20 19V21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function BottomNavigation({ active, onChange }: BottomNavigationProps) {
  const t = useT()
  const items = [
    { id: 'markets' as const, label: t('nav.feed'), Icon: MarketsIcon },
    { id: 'portfolio' as const, label: t('nav.mine'), Icon: PortfolioIcon },
    { id: 'create' as const, label: t('nav.create'), Icon: null },
    { id: 'notifications' as const, label: t('nav.notifications'), Icon: NotificationsIcon },
    { id: 'profile' as const, label: t('nav.profile'), Icon: ProfileIcon },
  ]

  return (
    <nav className={styles.root} aria-label={t('nav.main')}>
      {items.map(({ id, label, Icon }) => {
        const selected = id === active
        const create = id === 'create'
        return (
          <button
            key={id}
            type="button"
            className={cx(styles.item, selected && styles.active, create && styles.create)}
            aria-current={selected ? 'page' : undefined}
            onClick={() => onChange?.(id)}
          >
            {create ? (
              <span className={styles.createIcon} aria-hidden="true">
                <span className={styles.plusHorizontal} />
                <span className={styles.plusVertical} />
              </span>
            ) : Icon ? (
              <Icon className={styles.icon} />
            ) : null}
            <span className={styles.label}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
