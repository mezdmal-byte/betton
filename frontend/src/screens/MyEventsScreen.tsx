import { useMemo, useState } from 'react'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { useT } from '../i18n'
import { formatTonFull } from '../lib/format'
import type { MarketFixture, MarketStatus } from '../types/market'
import styles from './MyEventsScreen.module.css'

export type MyEventsViewState = 'ready' | 'loading' | 'error' | 'unauthenticated'
type MarketFilter = 'all' | 'open' | 'done'

export type MyEventsScreenProps = {
  markets?: MarketFixture[]
  viewState?: MyEventsViewState
  errorMessage?: string | null
  onBack?: () => void
  onOpenMarket?: (market: MarketFixture) => void
  onRetry?: () => void
  onNavChange?: (id: NavId) => void
}

export function MyEventsScreen({
  markets = [],
  viewState = 'ready',
  errorMessage,
  onOpenMarket,
  onRetry,
  onNavChange,
}: MyEventsScreenProps) {
  const t = useT()
  const [filter, setFilter] = useState<MarketFilter>('all')
  const filtered = useMemo(
    () =>
      markets.filter((market) => {
        if (filter === 'all') return true
        if (filter === 'open') return ['open', 'closing', 'pending'].includes(market.status)
        return ['closed', 'resolved', 'cancelled', 'rejected'].includes(market.status)
      }),
    [filter, markets],
  )

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1>Мои рынки</h1>
        <p>{filterLabel(filter)} • {markets.length} рынков</p>
      </header>

      <main className={styles.body}>
        <div className={styles.filters} role="tablist" aria-label="Статус рынков">
          {([
            ['all', 'Все'],
            ['open', 'Открытые'],
            ['done', 'Завершены'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filter === id}
              className={filter === id ? styles.activeFilter : undefined}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {viewState === 'unauthenticated' ? (
          <StatusMessage tone="warning" title={t('err.openInTg')}>{t('err.openInTgBody')}</StatusMessage>
        ) : null}
        {viewState === 'loading' ? (
          <StatusMessage tone="loading" title={t('loading')}>{t('loading.events')}</StatusMessage>
        ) : null}
        {viewState === 'error' ? (
          <>
            <StatusMessage tone="error" title={t('err.request')}>{errorMessage || t('err.requestBody')}</StatusMessage>
            {onRetry ? <Button variant="secondary" onClick={onRetry}>{t('retry')}</Button> : null}
          </>
        ) : null}

        {viewState === 'ready' && filtered.length === 0 ? (
          <section className={styles.empty}>
            <h2>{t('empty.eventsTitle')}</h2>
            <p>Сформулируйте проверяемый вопрос и укажите надёжный источник результата.</p>
            <Button fullWidth onClick={() => onNavChange?.('create')}>Создать рынок</Button>
          </section>
        ) : null}

        {viewState === 'ready' && filtered.length > 0 ? (
          <div className={styles.list}>
            {filtered.map((market) => {
              const detailAvailable = market.status !== 'pending' && market.status !== 'rejected'
              return (
                <button
                  key={market.id}
                  type="button"
                  className={styles.row}
                  disabled={!detailAvailable}
                  onClick={() => {
                    if (detailAvailable) onOpenMarket?.(market)
                  }}
                >
                  <span className={styles.copy}>
                    <strong className={styles[statusTone(market.status)]}>{market.question}</strong>
                    <small>{marketStatusMeta(market)}</small>
                    {market.status === 'rejected' && market.rejectionReason ? (
                      <small className={styles.reason}>{market.rejectionReason}</small>
                    ) : null}
                  </span>
                  <span className={styles.disclosure} aria-hidden="true">›</span>
                </button>
              )
            })}
          </div>
        ) : null}
      </main>

      <BottomNavigation active="profile" onChange={onNavChange} />
    </div>
  )
}

function filterLabel(filter: MarketFilter): string {
  if (filter === 'open') return 'Открытые'
  if (filter === 'done') return 'Завершены'
  return 'Все'
}

function statusTone(status: MarketStatus): 'success' | 'warning' | 'danger' | 'defaultTone' {
  if (status === 'open' || status === 'closing') return 'success'
  if (status === 'pending' || status === 'closed') return 'warning'
  if (status === 'rejected' || status === 'cancelled') return 'danger'
  return 'defaultTone'
}

function marketStatusMeta(market: MarketFixture): string {
  const volume = formatTonFull(market.volumeTon)
  if (market.status === 'pending') return 'На модерации • ' + market.closeLabel
  if (market.status === 'rejected') return 'Отклонён • нужна правка'
  if (market.status === 'closed') return 'Ожидает решения • ' + market.closeLabel
  if (market.status === 'resolved') return 'Рассчитан • ' + volume
  if (market.status === 'cancelled') return 'Отменён • средства возвращены'
  return 'Открыт • ' + volume
}
