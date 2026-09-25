import { BellDot } from 'lucide-react'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { ThemeToggle } from '../components/ThemeToggle/ThemeToggle'
import { useT } from '../i18n'
import styles from './NotificationsScreen.module.css'

export type NotificationItem = {
  id: string
  title: string
  metadata: string
  unread?: boolean
}

export type NotificationsScreenProps = {
  items?: NotificationItem[]
  onOpen?: (item: NotificationItem) => void
  onNavChange?: (id: NavId) => void
}

export const notificationPreviewItems: NotificationItem[] = [
  { id: 'partial-fill', title: 'Ордер частично исполнен', metadata: 'Ордер • 13,40 TON • 2 мин', unread: true },
  { id: 'resolution', title: 'Рынок ожидает решения', metadata: 'Рынок • 18 мин', unread: true },
]

export function NotificationsScreen({
  items = [],
  onOpen,
  onNavChange,
}: NotificationsScreenProps) {
  const t = useT()
  const unread = items.some((item) => item.unread)

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1>{t('nav.notifications')}</h1>
          <ThemeToggle />
        </div>
        <p>{unread ? t('notifications.unread') : t('notifications.emptyTitle')}</p>
      </header>

      <main className={styles.body}>
        {items.length > 0 ? (
          <div className={styles.list}>
            {items.map((item) => (
              <button key={item.id} type="button" className={styles.row} onClick={() => onOpen?.(item)}>
                {item.unread ? <span className={styles.unread} aria-hidden="true" /> : null}
                <span className={styles.copy}>
                  <strong className={item.unread ? styles.unreadTitle : undefined}>{item.title}</strong>
                  <small>{item.metadata}</small>
                </span>
                <span className={styles.disclosure} aria-hidden="true">›</span>
              </button>
            ))}
          </div>
        ) : (
          <section className={styles.empty}>
            <BellDot size={48} strokeWidth={1.6} aria-hidden="true" />
            <h2>{t('notifications.emptyTitle')}</h2>
            <p>{t('notifications.emptyBody')}</p>
          </section>
        )}
      </main>

      <BottomNavigation active="notifications" onChange={onNavChange} />
    </div>
  )
}
