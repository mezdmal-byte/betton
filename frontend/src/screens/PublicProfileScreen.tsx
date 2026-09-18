import { ChevronLeft } from 'lucide-react'
import { Avatar } from '../components/Avatar/Avatar'
import { Button } from '../components/Button/Button'
import { IconButton } from '../components/IconButton/IconButton'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { useT } from '../i18n'
import { formatInteger, formatTon } from '../lib/format'
import type { MarketFixture } from '../types/market'
import styles from './ProfileScreen.module.css'

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
}

export function PublicProfileScreen({
  profile,
  markets = [],
  viewState = 'ready',
  onBack,
  onOpenMarket,
  onRetry,
}: PublicProfileScreenProps) {
  const t = useT()
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label={t('back')} size="md" onClick={onBack}>
          <ChevronLeft size={22} />
        </IconButton>
        <strong>{t('profile.public')}</strong>
      </header>
      <div className={styles.body}>
        {viewState === 'loading' ? (
          <StatusMessage tone="loading" title={t('creator.loading')}>
            {t('loading.body')}
          </StatusMessage>
        ) : null}
        {viewState === 'error' ? (
          <>
            <StatusMessage tone="error" title={t('err.request')}>
              {t('err.requestBody')}
            </StatusMessage>
            {onRetry ? <Button variant="secondary" onClick={onRetry}>{t('retry')}</Button> : null}
          </>
        ) : null}
        {viewState === 'ready' && profile ? (
          <>
            <section className={styles.identity}>
              <Avatar initials={profile.initials} name={profile.displayName} src={profile.photoUrl} size="lg" />
              <div className={styles.identityText}>
                <strong>{profile.displayName}</strong>
                <span>@{profile.handle}</span>
              </div>
            </section>
            <dl className={styles.metrics}>
              <div>
                <dt>{t('account.statEvents')}</dt>
                <dd>{profile.marketsCreated == null ? '—' : formatInteger(profile.marketsCreated)}</dd>
              </div>
              <div>
                <dt>{t('creator.volume')}</dt>
                <dd>{profile.volumeTon == null ? '—' : formatTon(profile.volumeTon)}</dd>
              </div>
              <div>
                <dt>{t('creator.fills')}</dt>
                <dd>{profile.fills == null ? '—' : formatInteger(profile.fills)}</dd>
              </div>
            </dl>
            <dl className={styles.metrics}>
              <div>
                <dt>{t('creator.people')}</dt>
                <dd>{profile.participants == null ? '—' : formatInteger(profile.participants)}</dd>
              </div>
              <div>
                <dt>{t('creator.active')}</dt>
                <dd>{profile.activeMarkets == null ? '—' : formatInteger(profile.activeMarkets)}</dd>
              </div>
              <div>
                <dt>{t('creator.done')}</dt>
                <dd>{profile.completedMarkets == null ? '—' : formatInteger(profile.completedMarkets)}</dd>
              </div>
            </dl>
            <span className={styles.sectionLabel}>{t('creator.events')}</span>
            {markets.length === 0 ? (
              <StatusMessage title={t('creator.empty')} />
            ) : (
              markets.map((market) => (
                <button
                  key={market.id}
                  type="button"
                  className={styles.menuItem}
                  onClick={() => onOpenMarket?.(market)}
                >
                  <span>{market.question}</span>
                </button>
              ))
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
