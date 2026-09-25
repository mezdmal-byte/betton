import { useMemo, useState } from 'react'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { useI18n, useT } from '../i18n'
import { formatTonFull } from '../lib/format'
import { formatHistoryTime } from '../lib/time'
import type { HistoryFixture } from '../types/account'
import styles from './ActivityScreen.module.css'

type ActivityFilter = 'all' | 'trades' | 'orders' | 'settlement'

export type ActivityScreenProps = {
  history: HistoryFixture[]
  listState?: 'ready' | 'loading' | 'error'
  onRetry?: () => void
  onNavChange?: (id: NavId) => void
}

export function ActivityScreen({
  history,
  listState = 'ready',
  onRetry,
  onNavChange,
}: ActivityScreenProps) {
  const t = useT()
  const { locale } = useI18n()
  const [filter, setFilter] = useState<ActivityFilter>('all')
  const [selected, setSelected] = useState<HistoryFixture | null>(null)

  const rows = useMemo(
    () => history.filter((item) => filter === 'all' || activityBucket(item.actionKey) === filter),
    [filter, history],
  )

  if (selected) {
    const amount = formatTonFull(Math.abs(selected.amountTon))
    return (
      <div className={styles.screen}>
        <header className={styles.detailHeader}>
          <strong>{detailKicker(selected)}</strong>
          <div className={styles.detailTitleRow}>
            <button type="button" aria-label={t('back')} onClick={() => setSelected(null)}>←</button>
            <h1>Операция</h1>
          </div>
        </header>

        <main className={styles.body}>
          <section className={styles.primaryMetric}>
            <strong>{amount}</strong>
            <span>{activityTitle(selected)}</span>
          </section>

          <section className={styles.details}>
            <DetailRow label="Рынок" value={selected.question} />
            <DetailRow label="Тип" value={selected.action} />
            <DetailRow
              label="Время"
              value={formatHistoryTime(selected.createdAt ?? selected.time, locale)}
            />
            <DetailRow label="Статус" value={detailStatus(selected)} />
          </section>
        </main>

        <BottomNavigation active="profile" onChange={onNavChange} />
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1>Активность</h1>
      </header>

      <main className={styles.body}>
        <div className={styles.tabs} role="tablist" aria-label="Активность">
          {([
            ['all', 'Все'],
            ['trades', 'Сделки'],
            ['orders', 'Ордера'],
            ['settlement', 'Расчёты'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filter === id}
              className={filter === id ? styles.activeTab : undefined}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {listState === 'loading' ? (
          <StatusMessage tone="loading" title={t('loading')}>{t('loading.body')}</StatusMessage>
        ) : null}
        {listState === 'error' ? (
          <>
            <StatusMessage tone="error" title={t('err.request')}>{t('err.requestBody')}</StatusMessage>
            {onRetry ? <Button variant="secondary" onClick={onRetry}>{t('retry')}</Button> : null}
          </>
        ) : null}

        {listState === 'ready' && rows.length === 0 ? (
          <section className={styles.empty}>
            <strong aria-hidden="true">↕</strong>
            <h2>Операций пока нет</h2>
            <p>Сделки, ордера, расчёты, выплаты и возвраты появятся здесь.</p>
          </section>
        ) : null}

        {listState === 'ready' && rows.length > 0 ? (
          <div className={styles.list}>
            {rows.map((item) => (
              <button
                key={item.id}
                type="button"
                className={styles.row}
                onClick={() => setSelected(item)}
              >
                <strong className={activityAccent(item) ? styles.accent : undefined}>
                  {activityTitle(item)}
                </strong>
                <span>
                  {formatSigned(item.amountTon)} · {formatHistoryTime(item.createdAt ?? item.time, locale)}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </main>

      <BottomNavigation active="profile" onChange={onNavChange} />
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function activityBucket(actionKey?: string): Exclude<ActivityFilter, 'all'> {
  if (actionKey === 'fill') return 'trades'
  if (actionKey === 'reserve' || actionKey === 'cancel' || actionKey === 'refund') return 'orders'
  return 'settlement'
}

function activityTitle(item: HistoryFixture): string {
  const key = item.actionKey
  if (key === 'fill') return 'Исполнено · ' + item.question
  if (key === 'reserve') return 'Ордер создан · ' + item.question
  if (key === 'cancel') return 'Ордер отменён · ' + item.question
  if (key === 'refund') return 'Возврат резерва · ' + item.question
  if (key === 'win') return 'Выплата по позиции · ' + item.question
  if (key === 'loss') return 'Позиция рассчитана · ' + item.question
  if (key === 'void') return 'Возврат по рынку · ' + item.question
  if (key === 'fee') return 'Комиссия · ' + item.question
  if (key === 'credit') return 'Зачисление · ' + item.question
  if (key === 'deposit') return 'Пополнение · ' + item.question
  if (key === 'withdraw') return 'Вывод · ' + item.question
  return item.action + ' · ' + item.question
}

function activityAccent(item: HistoryFixture): boolean {
  return item.amountTon > 0 || item.actionKey === 'fill' || item.actionKey === 'win'
}

function detailKicker(item: HistoryFixture): string {
  if (item.actionKey === 'fill') return 'СДЕЛКА · ИСПОЛНЕНО'
  if (item.actionKey === 'reserve') return 'ОРДЕР · СОЗДАН'
  if (item.actionKey === 'cancel') return 'ОРДЕР · ОТМЕНЁН'
  if (item.actionKey === 'refund') return 'ВОЗВРАТ · РЕЗЕРВ'
  if (item.actionKey === 'win') return 'РАСЧЁТ · ВЫПЛАТА'
  if (item.actionKey === 'void') return 'РАСЧЁТ · VOID'
  return 'АКТИВНОСТЬ · ОПЕРАЦИЯ'
}

function detailStatus(item: HistoryFixture): string {
  if (item.actionKey === 'fill') return 'Исполнено'
  if (item.actionKey === 'reserve') return 'Активно'
  if (item.actionKey === 'cancel') return 'Отменено'
  if (item.actionKey === 'refund' || item.actionKey === 'void') return 'Возвращено'
  return 'Завершено'
}

function formatSigned(amount: number): string {
  const value = formatTonFull(Math.abs(amount))
  if (amount > 0) return '+' + value
  if (amount < 0) return '−' + value
  return value
}
