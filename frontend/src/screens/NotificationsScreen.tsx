import { BellDot } from 'lucide-react'
import { useState } from 'react'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { ThemeToggle } from '../components/ThemeToggle/ThemeToggle'
import { useT } from '../i18n'
import styles from './NotificationsScreen.module.css'

export type NotificationItem = {
  id: string
  title: string
  metadata: string
  unread?: boolean
  context?: string
  summary?: string
  detail?: string
  actionLabel?: string
}

export type NotificationsScreenProps = {
  items?: NotificationItem[]
  onOpen?: (item: NotificationItem) => void
  onAction?: (item: NotificationItem) => void
  onNavChange?: (id: NavId) => void
}

export const notificationPreviewItems: NotificationItem[] = [
  {
    id: 'partial-fill',
    title: 'Ордер частично исполнен',
    metadata: 'Ордер • 13,40 TON • 2 мин',
    unread: true,
    context: 'Ордер · TON в топ-5 к концу 2026?',
    summary: 'Ордер обновлён',
    detail: 'Лимит 1,48× · покупка ДА',
    actionLabel: 'Открыть ордер',
  },
  {
    id: 'resolution',
    title: 'Рынок ожидает решения',
    metadata: 'Рынок • 18 мин',
    unread: true,
    context: 'Рынок · Спартак — Зенит',
    summary: 'Торговля закрыта',
    detail: 'Создателю или администратору нужно определить исход.',
    actionLabel: 'Открыть рынок',
  },
]

export function NotificationsScreen({
  items = [],
  onOpen,
  onAction,
  onNavChange,
}: NotificationsScreenProps) {
  const t = useT()
  const [selected, setSelected] = useState<NotificationItem | null>(null)
  const unread = items.some((item) => item.unread)

  if (selected) {
    return (
      <div className={styles.screen}>
        <header className={styles.detailHeader}>
          <div className={styles.detailTitleRow}>
            <button type="button" onClick={() => setSelected(null)} aria-label={t('back')}>←</button>
            <h1>Детали уведомления</h1>
          </div>
          <p>{selected.context ?? selected.metadata}</p>
        </header>

        <main className={styles.body}>
          <section className={styles.eventSummary}>
            <strong>{selected.summary ?? selected.title}</strong>
            <span>{selected.title}</span>
          </section>

          <button
            type="button"
            className={styles.detailRow}
            onClick={() => onOpen?.(selected)}
            disabled={!onOpen}
          >
            <span>
              <strong>{selected.context ?? selected.title}</strong>
              <small>{selected.detail ?? selected.metadata}</small>
            </span>
            <b aria-hidden="true">›</b>
          </button>

          <div className={styles.detailRowStatic}>
            <span>
              <strong>Событие</strong>
              <small>{selected.metadata}</small>
            </span>
          </div>

          {selected.actionLabel ? (
            <Button fullWidth onClick={() => onAction?.(selected)} disabled={!onAction}>
              {selected.actionLabel}
            </Button>
          ) : null}
        </main>

        <BottomNavigation active="notifications" onChange={onNavChange} />
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1>{t('nav.notifications')}</h1>
          <ThemeToggle />
        </div>
        <p>{items.length > 0 ? (unread ? t('notifications.unread') : 'Прочитанные') : t('notifications.emptyTitle')}</p>
      </header>

      <main className={styles.body}>
        {items.length > 0 ? (
          <div className={styles.list}>
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={styles.row}
                onClick={() => {
                  if (onOpen) onOpen(item)
                  else setSelected(item)
                }}
              >
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
