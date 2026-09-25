import { useMemo, useState } from 'react'
import { Avatar } from '../components/Avatar/Avatar'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { useT } from '../i18n'
import { formatInteger, formatTonFull } from '../lib/format'
import type { MarketFixture } from '../types/market'
import styles from './PublicProfileScreen.module.css'

export type PublicProfileView = {
  displayName: string
  handle: string
  initials: string
  photoUrl?: string
  marketsCreated: number | null
  volumeTon: number | null
  fills: number | null
  participants: number | null
  activeMarkets: number | null
  completedMarkets: number | null
}

export type PublicProfileScreenProps = {
  profile?: PublicProfileView | null
  markets?: MarketFixture[]
  viewState?: 'ready' | 'loading' | 'error'
  onBack?: () => void
  onOpenMarket?: (market: MarketFixture) => void
  onRetry?: () => void
  onNavChange?: (id: NavId) => void
}

type CreatorView = 'summary' | 'markets' | 'stats'

export function PublicProfileScreen({
  profile,
  markets = [],
  viewState = 'ready',
  onBack,
  onOpenMarket,
  onRetry,
  onNavChange,
}: PublicProfileScreenProps) {
  const t = useT()
  const [view, setView] = useState<CreatorView>('summary')
  const activeMarkets = useMemo(
    () => markets.filter((market) => market.status === 'open' || market.status === 'closing'),
    [markets],
  )
  const completedMarkets = useMemo(
    () => markets.filter((market) => ['closed', 'resolved', 'cancelled'].includes(market.status)),
    [markets],
  )

  if (viewState !== 'ready') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <h1>Публичный автор</h1>
        </header>
        <main className={styles.body}>
          {viewState === 'loading' ? (
            <StatusMessage tone="loading" title={t('creator.loading')}>{t('loading.body')}</StatusMessage>
          ) : (
            <>
              <StatusMessage tone="error" title={t('err.request')}>{t('err.requestBody')}</StatusMessage>
              {onRetry ? <Button variant="secondary" onClick={onRetry}>{t('retry')}</Button> : null}
            </>
          )}
        </main>
        <BottomNavigation active="profile" onChange={onNavChange} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={styles.screen}>
        <header className={styles.header}><h1>Публичный автор</h1></header>
        <main className={styles.body}>
          <StatusMessage tone="empty" title={t('creator.empty')} />
        </main>
        <BottomNavigation active="profile" onChange={onNavChange} />
      </div>
    )
  }

  if (view === 'markets') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <button type="button" className={styles.back} onClick={() => setView('summary')}>←</button>
            <h1>Рынки автора</h1>
          </div>
          <p>@{profile.handle} · фактические данные</p>
        </header>
        <main className={styles.body}>
          {markets.length === 0 ? (
            <StatusMessage title={t('creator.empty')} />
          ) : (
            <div className={styles.marketList}>
              {markets.map((market) => (
                <button key={market.id} type="button" onClick={() => onOpenMarket?.(market)}>
                  <strong>{market.question}</strong>
                  <span>{marketStatusLine(market)}</span>
                  <b aria-hidden="true">›</b>
                </button>
              ))}
            </div>
          )}
        </main>
        <BottomNavigation active="profile" onChange={onNavChange} />
      </div>
    )
  }

  if (view === 'stats') {
    return (
      <div className={styles.screen}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <button type="button" className={styles.back} onClick={() => setView('summary')}>←</button>
            <h1>Статистика автора</h1>
          </div>
          <p>@{profile.handle} · фактические данные</p>
        </header>
        <main className={styles.body}>
          <section className={styles.primaryMetric}>
            <strong>{profile.volumeTon == null ? '—' : formatTonFull(profile.volumeTon)}</strong>
            <span>Объём сделок в созданных рынках</span>
          </section>
          <DataRow value={(profile.marketsCreated == null ? '—' : formatInteger(profile.marketsCreated)) + ' рынков'} />
          <DataRow value={(profile.fills == null ? '—' : formatInteger(profile.fills)) + ' исполнения'} />
          <DataRow value={(profile.participants == null ? '—' : formatInteger(profile.participants)) + ' участников'} />
          <p className={styles.mutedNote}>Показаны только наблюдаемые метрики, без рейтинга репутации.</p>
        </main>
        <BottomNavigation active="profile" onChange={onNavChange} />
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1>Публичный автор</h1>
        <p>@{profile.handle}</p>
      </header>

      <main className={styles.body}>
        <section className={styles.identity}>
          <Avatar initials={profile.initials} name={profile.displayName} src={profile.photoUrl} size="lg" />
          <div className={styles.identityText}>
            <strong>@{profile.handle}</strong>
            <span>Автор рынков</span>
          </div>
        </section>

        <button type="button" className={styles.dataRow} onClick={() => setView('markets')}>
          <span className={styles.accent}>
            Создано рынков · {profile.marketsCreated == null ? '—' : formatInteger(profile.marketsCreated)}
          </span>
          <b aria-hidden="true">›</b>
        </button>
        <button type="button" className={styles.dataRow} onClick={() => setView('markets')}>
          <span>Активных · {profile.activeMarkets == null ? activeMarkets.length : formatInteger(profile.activeMarkets)}</span>
          <b aria-hidden="true">›</b>
        </button>
        <button type="button" className={styles.dataRow} onClick={() => setView('markets')}>
          <span>Завершённых · {profile.completedMarkets == null ? completedMarkets.length : formatInteger(profile.completedMarkets)}</span>
          <b aria-hidden="true">›</b>
        </button>
        <button type="button" className={styles.dataRow} onClick={() => setView('stats')}>
          <span>Объём сделок · {profile.volumeTon == null ? '—' : formatTonFull(profile.volumeTon)}</span>
          <b aria-hidden="true">›</b>
        </button>

        <Button fullWidth onClick={() => setView('markets')}>Смотреть рынки</Button>
        {onBack ? (
          <button type="button" className={styles.browserBack} onClick={onBack}>← Назад</button>
        ) : null}
      </main>

      <BottomNavigation active="profile" onChange={onNavChange} />
    </div>
  )
}

function DataRow({ value }: { value: string }) {
  return (
    <div className={styles.dataRowStatic}>
      <span>{value}</span>
      <b aria-hidden="true">›</b>
    </div>
  )
}

function marketStatusLine(market: MarketFixture): string {
  if (market.status === 'open' || market.status === 'closing') {
    return 'Открыт • ' + formatTonFull(market.volumeTon)
  }
  if (market.status === 'resolved') return 'Завершён • рассчитан'
  if (market.status === 'cancelled') return 'Завершён • отменён'
  if (market.status === 'closed') return 'Закрыт • ожидает решения'
  if (market.status === 'pending') return 'На модерации'
  if (market.status === 'rejected') return 'Отклонён'
  return market.closeLabel
}
