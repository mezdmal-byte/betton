import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { mapMarketOut } from '../api/adapters'
import { errorDetail } from '../api/errors'
import { listModerationQueue, rejectMarket, approveMarket } from '../api/moderation'
import { queryKeys } from '../api/query'
import { Button } from '../components/Button/Button'
import { IconButton } from '../components/IconButton/IconButton'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { TextField } from '../components/TextField/TextField'
import { useI18n } from '../i18n'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import styles from '../screens/ProfileScreen.module.css'

export type ConnectedModerationScreenProps = {
  enabled: boolean
  onBack: () => void
  onOpenMarket: (marketId: number) => void
}

export function ConnectedModerationScreen({ enabled, onBack, onOpenMarket }: ConnectedModerationScreenProps) {
  const { t, locale } = useI18n()
  const queryClient = useQueryClient()
  const [reasonById, setReasonById] = useState<Record<number, string>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const queue = useQuery({
    queryKey: queryKeys.moderation,
    queryFn: listModerationQueue,
    enabled,
  })

  const invalidate = (marketId?: number) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.moderation })
    void queryClient.invalidateQueries({ queryKey: ['markets'] })
    if (marketId != null) void queryClient.invalidateQueries({ queryKey: queryKeys.market(marketId) })
  }

  const approve = useMutation({
    mutationFn: (marketId: number) => approveMarket(marketId),
    onSuccess: (_data, marketId) => invalidate(marketId),
    onError: (error) => setErrorMessage(errorDetail(error)),
  })
  const reject = useMutation({
    mutationFn: ({ marketId, reason }: { marketId: number; reason: string }) => rejectMarket(marketId, reason),
    onSuccess: (_data, vars) => invalidate(vars.marketId),
    onError: (error) => setErrorMessage(errorDetail(error)),
  })

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label={t('back')} size="md" onClick={onBack}>
          <ChevronLeft size={22} />
        </IconButton>
        <strong>{t('moderation.title')}</strong>
      </header>
      <div className={styles.body}>
        {!enabled ? (
          <StatusMessage tone="warning" title={t('err.noAccess')}>
            {t('mod.adminOnly')}
          </StatusMessage>
        ) : queue.isPending ? (
          <StatusMessage tone="loading" title={t('loading')}>
            {t('loading.events')}
          </StatusMessage>
        ) : queue.isError ? (
          <StatusMessage tone="error" title={t('err.request')}>
            {errorDetail(queue.error)}
          </StatusMessage>
        ) : (queue.data ?? []).length === 0 ? (
          <StatusMessage title={t('mod.empty')} />
        ) : (
          (queue.data ?? []).map((market) => {
            const view = mapMarketOut(market, new Date(), locale)
            return (
              <section key={market.id}>
                <p>
                  <strong>{view.question}</strong>
                </p>
                <p>
                  {view.category} · {view.closeLabel}
                </p>
                <Button variant="ghost" size="md" onClick={() => onOpenMarket(market.id)}>
                  {t('mod.open')}
                </Button>
                <Button size="md" onClick={() => approve.mutate(market.id)}>
                  {t('mod.approve')}
                </Button>
                <TextField
                  id={`reject-${market.id}`}
                  label={t('mod.reasonPh')}
                  value={reasonById[market.id] ?? ''}
                  onChange={(value) => setReasonById((current) => ({ ...current, [market.id]: value }))}
                />
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => reject.mutate({ marketId: market.id, reason: (reasonById[market.id] || '').trim() })}
                >
                  {t('mod.reject')}
                </Button>
              </section>
            )
          })
        )}
        {errorMessage ? (
          <StatusMessage tone="error" title={t('error')}>
            {errorMessage}
          </StatusMessage>
        ) : null}
      </div>
    </div>
  )
}
