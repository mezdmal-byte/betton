import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/Button/Button'
import { IconButton } from '../components/IconButton/IconButton'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { TextField } from '../components/TextField/TextField'
import { useT } from '../i18n'
import type { MarketFixture } from '../types/market'
import styles from './ModerationScreen.module.css'

export type ModerationViewState = 'ready' | 'loading' | 'error' | 'no-access'
export type ModerationScreenProps = {
  markets?: MarketFixture[]
  viewState?: ModerationViewState
  reasonById?: Record<number, string>
  busyMarketId?: number | null
  errorMessage?: string | null
  onBack?: () => void
  onOpenMarket?: (marketId: number) => void
  onApprove?: (marketId: number) => void
  onReject?: (marketId: number, reason: string) => void
  onReasonChange?: (marketId: number, reason: string) => void
}

export function ModerationScreen({ markets = [], viewState = 'ready', reasonById = {}, busyMarketId = null, errorMessage, onBack, onOpenMarket, onApprove, onReject, onReasonChange }: ModerationScreenProps) {
  const t = useT()
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label={t('back')} size="md" onClick={onBack}><ChevronLeft size={22} /></IconButton>
        <strong>{t('moderation.title')}</strong>
      </header>
      <div className={styles.body}>
        {viewState === 'no-access' ? <StatusMessage tone="warning" title={t('err.noAccess')}>{t('mod.adminOnly')}</StatusMessage> : null}
        {viewState === 'loading' ? <StatusMessage tone="loading" title={t('loading')}>{t('loading.events')}</StatusMessage> : null}
        {viewState === 'error' ? <StatusMessage tone="error" title={t('err.request')}>{errorMessage || t('err.requestBody')}</StatusMessage> : null}
        {viewState === 'ready' && markets.length === 0 ? <StatusMessage title={t('mod.empty')} /> : null}
        {viewState === 'ready' ? markets.map((market) => {
          const marketId = Number(market.id)
          const busy = busyMarketId === marketId
          const reason = reasonById[marketId] ?? ''
          return (
            <section key={market.id} className={styles.card}>
              <div className={styles.top}><span>{market.category}</span><span>{market.closeLabel}</span></div>
              <strong className={styles.question}>{market.question}</strong>
              <div className={styles.actions}>
                <Button variant="secondary" size="md" disabled={busy} onClick={() => onOpenMarket?.(marketId)}>{t('mod.open')}</Button>
                <Button size="md" disabled={busy} onClick={() => onApprove?.(marketId)}>{t('mod.approve')}</Button>
              </div>
              {rejectingId === marketId ? (
                <div className={styles.rejectPanel}>
                  <TextField id={`reject-${marketId}`} label={t('mod.reasonPh')} value={reason} onChange={(value) => onReasonChange?.(marketId, value)} />
                  <Button
                    variant="secondary"
                    size="md"
                    disabled={busy || !reason.trim()}
                    onClick={() => {
                      onReject?.(marketId, reason.trim())
                      if (reason.trim()) setRejectingId(null)
                    }}
                  >
                    {t('mod.reject')}
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="md" disabled={busy} onClick={() => setRejectingId(marketId)}>
                  {t('mod.reject')}
                </Button>
              )}
            </section>
          )
        }) : null}
        {errorMessage && viewState === 'ready' ? <StatusMessage tone="error" title={t('error')}>{errorMessage}</StatusMessage> : null}
      </div>
    </div>
  )
}
