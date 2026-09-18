import { ChevronLeft, Clock3, Link2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../components/Button/Button'
import { IconButton } from '../components/IconButton/IconButton'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { Tabs } from '../components/Tabs/Tabs'
import { useT } from '../i18n'
import type { MarketFixture, MarketStatus } from '../types/market'
import styles from './MyEventsScreen.module.css'

export type MyEventsViewState = 'ready' | 'loading' | 'error' | 'unauthenticated'
export type MyEventsScreenProps = { markets?: MarketFixture[]; viewState?: MyEventsViewState; errorMessage?: string | null; onBack?: () => void; onOpenMarket?: (market: MarketFixture) => void; onRetry?: () => void }

export function MyEventsScreen({ markets = [], viewState = 'ready', errorMessage, onBack, onOpenMarket, onRetry }: MyEventsScreenProps) {
  const t = useT()
  const [tab, setTab] = useState<'active' | 'done'>('active')
  const filtered = useMemo(() => markets.filter((market) => tab === 'active' ? ['open', 'closing', 'pending'].includes(market.status) : ['closed', 'resolved', 'cancelled', 'rejected'].includes(market.status)), [markets, tab])
  return (
    <div className={styles.screen}>
      <header className={styles.header}><IconButton label={t('back')} size="md" onClick={onBack}><ChevronLeft size={22} /></IconButton><strong>{t('profile.events')}</strong></header>
      <div className={styles.body}>
        <Tabs equal items={[{ id: 'active', label: t('status.active') }, { id: 'done', label: t('status.resolvedOne') }]} value={tab} onChange={(id) => setTab(id as 'active' | 'done')} ariaLabel={t('profile.events')} />
        {viewState === 'unauthenticated' ? <StatusMessage tone="warning" title={t('err.openInTg')}>{t('err.openInTgBody')}</StatusMessage> : null}
        {viewState === 'loading' ? <StatusMessage tone="loading" title={t('loading')}>{t('loading.events')}</StatusMessage> : null}
        {viewState === 'error' ? <><StatusMessage tone="error" title={t('err.request')}>{errorMessage || t('err.requestBody')}</StatusMessage>{onRetry ? <Button variant="secondary" onClick={onRetry}>{t('retry')}</Button> : null}</> : null}
        {viewState === 'ready' && filtered.length === 0 ? <StatusMessage title={t('empty.eventsTitle')}>{t('empty.eventsBody')}</StatusMessage> : null}
        {viewState === 'ready' && filtered.length > 0 ? <div className={styles.list}>{filtered.map((market) => { const detailAvailable = market.status !== 'pending' && market.status !== 'rejected'; return <button key={market.id} type="button" className={styles.card} disabled={!detailAvailable} onClick={() => { if (detailAvailable) onOpenMarket?.(market) }}><div className={styles.cardTop}><span className={`${styles.status} ${styles[`status_${market.status}`]}`}>{statusLabel(market.status, t)}</span><span className={styles.time}><Clock3 size={13} aria-hidden="true" />{market.closeLabel}</span></div><strong className={styles.question}>{market.question}</strong>{market.status === 'rejected' && market.rejectionReason ? <p className={styles.reason}>{market.rejectionReason}</p> : null}<div className={styles.meta}><span>{market.category}</span>{market.visibility === 'unlisted' ? <span className={styles.unlisted}><Link2 size={13} aria-hidden="true" />{t('type.unlisted')}</span> : null}</div></button> })}</div> : null}
      </div>
    </div>
  )
}

function statusLabel(status: MarketStatus, t: ReturnType<typeof useT>): string { if (status === 'pending') return t('status.pending'); if (status === 'rejected') return t('status.rejected'); if (status === 'resolved') return t('status.resolvedOne'); if (status === 'cancelled') return t('status.cancelledOne'); if (status === 'closed') return t('status.closedOne'); if (status === 'closing') return t('status.closing'); return t('status.active') }
