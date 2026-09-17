import { ChevronLeft, Clock3, Link2 } from 'lucide-react'
import { IconButton } from '../components/IconButton/IconButton'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { useT } from '../i18n'
import type { MarketFixture, MarketStatus } from '../types/market'
import styles from './MyEventsScreen.module.css'

export type MyEventsViewState = 'ready' | 'loading' | 'error' | 'unauthenticated'

export type MyEventsScreenProps = {
  markets?: MarketFixture[]
  viewState?: MyEventsViewState
  errorMessage?: string | null
  onBack?: () => void
  onOpenMarket?: (market: MarketFixture) => void
}

export function MyEventsScreen({ markets = [], viewState = 'ready', errorMessage, onBack, onOpenMarket }: MyEventsScreenProps) {
  const t = useT()
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label={t('back')} size="md" onClick={onBack}><ChevronLeft size={22} /></IconButton>
        <strong>{t('profile.events')}</strong>
      </header>
      <div className={styles.body}>
        {viewState === 'unauthenticated' ? <StatusMessage tone="warning" title={t('err.openInTg')}>{t('err.openInTgBody')}</StatusMessage> : null}
        {viewState === 'loading' ? <StatusMessage tone="loading" title={t('loading')}>{t('loading.events')}</StatusMessage> : null}
        {viewState === 'error' ? <StatusMessage tone="error" title={t('err.request')}>{errorMessage || t('err.requestBody')}</StatusMessage> : null}
        {viewState === 'ready' && markets.length === 0 ? <StatusMessage title={t('empty.eventsTitle')}>{t('empty.eventsBody')}</StatusMessage> : null}
        {viewState === 'ready' && markets.length > 0 ? (
          <div className={styles.list}>
            {markets.map((market) => (
              <button key={market.id} type="button" className={styles.card} onClick={() => onOpenMarket?.(market)}>
                <div className={styles.cardTop}>
                  <span className={`${styles.status} ${styles[`status_${market.status}`]}`}>{statusLabel(market.status, t)}</span>
                  <span className={styles.time}><Clock3 size={13} aria-hidden="true" />{market.closeLabel}</span>
                </div>
                <strong className={styles.question}>{market.question}</strong>
                <div className={styles.meta}>
                  <span>{market.category}</span>
                  {market.visibility === 'unlisted' ? <span className={styles.unlisted}><Link2 size={13} aria-hidden="true" />{t('type.unlisted')}</span> : null}
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function statusLabel(status: MarketStatus, t: ReturnType<typeof useT>): string {
  if (status === 'pending') return t('status.pending')
  if (status === 'rejected') return t('status.rejected')
  if (status === 'resolved') return t('status.resolvedOne')
  if (status === 'cancelled') return t('status.cancelledOne')
  if (status === 'closed') return t('status.closedOne')
  if (status === 'closing') return t('status.closing')
  return t('status.active')
}
