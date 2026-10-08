import { BellDot } from 'lucide-react'
import { useState } from 'react'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { ThemeToggle } from '../components/ThemeToggle/ThemeToggle'
import { useT } from '../i18n'
import styles from './NotificationsScreen.module.css'

export type NotificationKind =
  | 'partial-fill'
  | 'full-fill'
  | 'order-cancelled'
  | 'refund'
  | 'market-closing'
  | 'market-closed'
  | 'market-resolved'
  | 'payout'
  | 'created-market-approved'
  | 'created-market-rejected'
  | 'admin-moderation'
  | 'generic'

export type NotificationItem = {
  id: string
  kind?: NotificationKind
  title: string
  metadata: string
  unread?: boolean
  detailTitle?: string
  context?: string
  headline?: string
  headlineMeta?: string
  relatedTitle?: string
  relatedMeta?: string
  eventText?: string
  eventMeta?: string
  actionLabel?: string
}

export type NotificationsScreenProps = {
  items?: NotificationItem[]
  initialSelectedId?: string
  onOpen?: (item: NotificationItem) => void
  onAction?: (item: NotificationItem) => void
  onNavChange?: (id: NavId) => void
}

const DELIVERY_NOTE =
  'Статусы показаны в продукте и не обещают фоновую backend-доставку.'

export const notificationPreviewItems: NotificationItem[] = [
  {
    id: 'partial-fill',
    kind: 'partial-fill',
    title: 'Ордер частично исполнен',
    metadata: 'Ордер • 13,40 TON • 2 мин',
    unread: true,
    detailTitle: 'Частичное исполнение',
    context: 'Ордер • ДА @ 1.76',
    headline: 'Исполнено 13,40 TON',
    headlineMeta: 'Остаток 18,20 TON • 2 мин',
    relatedTitle: 'Ордер • ДА @ 1.76',
    relatedMeta: 'Связанный объект',
    actionLabel: 'Открыть ордер',
  },
  {
    id: 'awaiting-resolution',
    kind: 'market-closed',
    title: 'Рынок ожидает решения',
    metadata: 'Рынок • 18 мин',
    unread: true,
    detailTitle: 'Рынок закрыт',
    context: 'Рынок • ETH выше $8k?',
    headline: 'Торги завершены',
    headlineMeta: 'Результат ожидает подтверждения',
    relatedTitle: 'Рынок • ETH выше $8k?',
    relatedMeta: 'Связанный объект',
    actionLabel: 'Открыть рынок',
  },
  {
    id: 'full-fill',
    kind: 'full-fill',
    title: 'Ордер исполнен',
    metadata: 'Позиция • сейчас',
    detailTitle: 'Ордер исполнен',
    context: 'Позиция • BTC выше $150k?',
    headline: 'Исполнено 31,60 TON',
    headlineMeta: 'Средняя цена 1.76 • сейчас',
    relatedTitle: 'Позиция • BTC выше $150k?',
    relatedMeta: 'Связанный объект',
    actionLabel: 'Открыть позицию',
  },
  {
    id: 'order-cancelled',
    kind: 'order-cancelled',
    title: 'Остаток ордера отменён',
    metadata: 'Ордер • вчера',
    detailTitle: 'Ордер отменён',
    context: 'Ордер • НЕТ @ 2.14',
    headline: 'Остаток ордера отменён',
    headlineMeta: '12,00 TON возвращены в баланс',
    relatedTitle: 'Ордер • НЕТ @ 2.14',
    relatedMeta: 'Связанный объект',
    actionLabel: 'Открыть ордер',
  },
  {
    id: 'refund',
    kind: 'refund',
    title: 'Возврат',
    metadata: 'Позиция • вчера',
    detailTitle: 'Возврат',
    context: 'Позиция • Матч состоится?',
    headline: 'Возврат 24,00 TON',
    headlineMeta: 'Рынок аннулирован • средства доступны',
    relatedTitle: 'Позиция • Матч состоится?',
    relatedMeta: 'Связанный объект',
    actionLabel: 'Открыть позицию',
  },
  {
    id: 'market-closing',
    kind: 'market-closing',
    title: 'Рынок скоро закроется',
    metadata: 'Рынок • 30 мин',
    detailTitle: 'Рынок скоро закроется',
    context: 'Рынок • ETH выше $8k?',
    headline: 'До закрытия 30 минут',
    headlineMeta: 'Открытые ордера останутся до закрытия',
    relatedTitle: 'Рынок • ETH выше $8k?',
    relatedMeta: 'Связанный объект',
    actionLabel: 'Открыть рынок',
  },
  {
    id: 'market-resolved',
    kind: 'market-resolved',
    title: 'Результат подтверждён',
    metadata: 'Позиция • вчера',
    detailTitle: 'Рынок рассчитан',
    context: 'Рынок • ETH выше $8k?',
    headline: 'Результат: ДА',
    headlineMeta: 'Источник и решение доступны в рынке',
    relatedTitle: 'Рынок • ETH выше $8k?',
    relatedMeta: 'Связанный объект',
    actionLabel: 'Открыть рынок',
  },
  {
    id: 'payout',
    kind: 'payout',
    title: 'Выплата',
    metadata: 'Позиция • сегодня',
    detailTitle: 'Выплата',
    context: 'Позиция • ETH выше $8k?',
    headline: '+46,80 TON начислено',
    headlineMeta: 'Расчёт по выигрышной позиции',
    relatedTitle: 'Позиция • ETH выше $8k?',
    relatedMeta: 'Связанный объект',
    actionLabel: 'Открыть позицию',
  },
  {
    id: 'created-approved',
    kind: 'created-market-approved',
    title: 'Рынок одобрен',
    metadata: 'Мой рынок • сегодня',
    detailTitle: 'Рынок одобрен',
    context: 'Мой рынок • TON выше $12?',
    headline: 'Рынок опубликован',
    headlineMeta: 'Теперь он доступен участникам',
    relatedTitle: 'Мой рынок • TON выше $12?',
    relatedMeta: 'Связанный объект',
    actionLabel: 'Управлять рынком',
  },
  {
    id: 'created-rejected',
    kind: 'created-market-rejected',
    title: 'Рынок отклонён',
    metadata: 'Мой рынок • сегодня',
    detailTitle: 'Рынок отклонён',
    context: 'Мой рынок • Погода в Москве',
    headline: 'Нужно исправить формулировку',
    headlineMeta: 'Комментарий модератора внутри',
    relatedTitle: 'Мой рынок • Погода в Москве',
    relatedMeta: 'Связанный объект',
    actionLabel: 'Открыть мой рынок',
  },
  {
    id: 'admin-moderation',
    kind: 'admin-moderation',
    title: 'Новая модерация',
    metadata: 'Модерация • очередь рынков',
    unread: true,
    detailTitle: 'Новая модерация',
    context: 'Модерация • очередь рынков',
    headline: '3 рынка ждут проверки',
    headlineMeta: 'Административный контекст',
    relatedTitle: 'Модерация • очередь рынков',
    relatedMeta: 'Связанный объект',
    actionLabel: 'Открыть модерацию',
  },
]

export function NotificationsScreen({
  items = [],
  initialSelectedId,
  onOpen,
  onAction,
  onNavChange,
}: NotificationsScreenProps) {
  const t = useT()
  const [selected, setSelected] = useState<NotificationItem | null>(
    () => items.find((item) => item.id === initialSelectedId) ?? null,
  )
  const unreadCount = items.filter((item) => item.unread).length

  if (selected) {
    return (
      <div className={styles.screen}>
        <header className={styles.detailHeader}>
          <div className={styles.detailTitleRow}>
            <button type="button" onClick={() => setSelected(null)} aria-label={t('back')}>←</button>
            <h1>{selected.detailTitle ?? 'Детали уведомления'}</h1>
          </div>
          <p>{selected.context ?? selected.metadata}</p>
        </header>

        <main className={styles.body}>
          <section className={styles.eventSummary}>
            <strong>{selected.headline ?? selected.title}</strong>
            <span>{selected.headlineMeta ?? selected.metadata}</span>
          </section>

          <button
            type="button"
            className={styles.detailRow}
            onClick={() => onOpen?.(selected)}
          >
            <span className={styles.index}>01</span>
            <span className={styles.detailCopy}>
              <strong>{selected.relatedTitle ?? selected.context ?? selected.title}</strong>
              <small>{selected.relatedMeta ?? 'Связанный объект'}</small>
            </span>
            <b aria-hidden="true">›</b>
          </button>

          <div className={styles.detailRowStatic}>
            <span className={styles.index}>02</span>
            <span className={styles.detailCopy}>
              <strong>{selected.eventText ?? 'Событие зафиксировано в интерфейсе'}</strong>
              <small>{selected.eventMeta ?? 'Без обещания внешней доставки'}</small>
            </span>
          </div>

          {selected.actionLabel ? (
            <Button fullWidth onClick={() => onAction?.(selected)}>
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
        <p>
          {items.length === 0
            ? 'Все события'
            : unreadCount > 0
              ? unreadCount + ' непрочитанных'
              : 'Прочитанные'}
        </p>
      </header>

      <main className={styles.body}>
        {items.length > 0 ? (
          <>
            <p className={styles.dateGroup}>СЕГОДНЯ</p>
            <div className={styles.list}>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.row}
                  onClick={() => setSelected(item)}
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
            <p className={styles.deliveryNote}>{DELIVERY_NOTE}</p>
          </>
        ) : (
          <section className={styles.empty}>
            <BellDot size={48} strokeWidth={1.6} aria-hidden="true" />
            <h2>Пока тихо</h2>
            <p>Здесь появятся события рынков, ордеров и позиций.</p>
          </section>
        )}
      </main>

      <BottomNavigation active="notifications" onChange={onNavChange} />
    </div>
  )
}
