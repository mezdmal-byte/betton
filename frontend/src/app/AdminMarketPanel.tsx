import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { errorDetail } from '../api/errors'
import {
  approveMarket,
  closeMarket,
  rejectMarket,
  resolveMarket,
  voidMarket,
} from '../api/moderation'
import { queryKeys } from '../api/query'
import type { MarketOut } from '../api/types'
import { Button } from '../components/Button/Button'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { TextField } from '../components/TextField/TextField'
import { useT } from '../i18n'
import { invalidateAfterTrade } from './invalidate'
import styles from './AdminMarketPanel.module.css'

export function AdminMarketPanel({
  market,
  userId,
}: {
  market: MarketOut
  userId?: number
}) {
  const t = useT()
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const invalidate = () => {
    invalidateAfterTrade(queryClient, { userId, marketId: market.id })
    void queryClient.invalidateQueries({ queryKey: queryKeys.moderation })
  }

  const run = useMutation({
    mutationFn: (fn: () => Promise<MarketOut>) => fn(),
    onSuccess: invalidate,
    onError: (error) => setErrorMessage(errorDetail(error)),
  })

  const p2p = (market.mechanism ?? 'p2p') === 'p2p'
  const names = market.outcomes?.length ? market.outcomes : [t('outcome.yes'), t('outcome.no')]

  return (
    <section className={styles.root}>
      <StatusMessage title={t('moderation.title')}>{t('mod.hint')}</StatusMessage>
      {errorMessage ? (
        <StatusMessage tone="error" title={t('error')}>
          {errorMessage}
        </StatusMessage>
      ) : null}
      {market.status === 'pending' ? (
        <div className={styles.actions}>
          <Button fullWidth disabled={run.isPending} onClick={() => run.mutate(() => approveMarket(market.id))}>
            {t('mod.approve')}
          </Button>
          <TextField id="admin-reject" label={t('mod.reasonPh')} value={reason} onChange={setReason} />
          <Button
            variant="secondary"
            fullWidth
            disabled={run.isPending}
            onClick={() => run.mutate(() => rejectMarket(market.id, reason.trim()))}
          >
            {t('mod.reject')}
          </Button>
        </div>
      ) : null}
      {market.status === 'open' ? (
        <Button variant="secondary" fullWidth disabled={run.isPending} onClick={() => run.mutate(() => closeMarket(market.id))}>
          {t('mod.close')}
        </Button>
      ) : null}
      {market.status === 'closed' ? (
        <div className={styles.resolveGrid}>
          {names.map((name, index) => (
            <Button
              key={name}
              variant="secondary"
              fullWidth
              disabled={run.isPending}
              onClick={() => run.mutate(() => resolveMarket(market.id, index))}
            >
              {t('mod.resolve', { name })}
            </Button>
          ))}
        </div>
      ) : null}
      {p2p && (market.status === 'open' || market.status === 'closed') ? (
        <div className={styles.actions}>
          <TextField id="admin-void" label={t('mod.cancelPh')} value={reason} onChange={setReason} />
          <Button
            variant="secondary"
            fullWidth
            disabled={run.isPending}
            onClick={() => {
              if (typeof window !== 'undefined' && !window.confirm(t('mod.voidConfirm'))) {
                return
              }
              run.mutate(() => voidMarket(market.id, reason.trim()))
            }}
          >
            {t('mod.cancel')}
          </Button>
        </div>
      ) : null}
    </section>
  )
}
