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

type Intent =
  | { kind: 'approve' }
  | { kind: 'reject' }
  | { kind: 'close' }
  | { kind: 'void' }
  | { kind: 'resolve'; outcomeIndex: number; outcomeName: string }
  | null

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
  const [intent, setIntent] = useState<Intent>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const invalidate = () => {
    invalidateAfterTrade(queryClient, { userId, marketId: market.id })
    void queryClient.invalidateQueries({ queryKey: queryKeys.moderation })
  }

  const run = useMutation({
    mutationFn: (fn: () => Promise<MarketOut>) => fn(),
    onSuccess: () => {
      setIntent(null)
      setReason('')
      invalidate()
    },
    onError: (error) => setErrorMessage(errorDetail(error)),
  })

  const p2p = (market.mechanism ?? 'p2p') === 'p2p'
  const names = market.outcomes?.length ? market.outcomes : [t('outcome.yes'), t('outcome.no')]

  const execute = () => {
    if (!intent || run.isPending) return
    setErrorMessage(null)
    if (intent.kind === 'approve') run.mutate(() => approveMarket(market.id))
    if (intent.kind === 'reject' && reason.trim()) run.mutate(() => rejectMarket(market.id, reason.trim()))
    if (intent.kind === 'close') run.mutate(() => closeMarket(market.id))
    if (intent.kind === 'void' && reason.trim()) run.mutate(() => voidMarket(market.id, reason.trim()))
    if (intent.kind === 'resolve') run.mutate(() => resolveMarket(market.id, intent.outcomeIndex))
  }

  return (
    <section className={styles.root}>
      <div className={styles.heading}>
        <strong>{intent ? confirmationTitle(intent) : t('moderation.title')}</strong>
        <span>BETTON · SYSTEM</span>
      </div>

      {run.isPending ? (
        <section className={styles.metric}>
          <strong>Обрабатываем</strong>
          <p>Admin-действие отправлено на backend.</p>
        </section>
      ) : null}

      {errorMessage ? (
        <StatusMessage tone="error" title={t('error')}>{errorMessage}</StatusMessage>
      ) : null}

      {intent ? (
        <>
          <section className={intent.kind === 'void' || intent.kind === 'reject' ? styles.dangerCard : styles.stateCard}>
            <strong>{confirmationCopy(intent, market.question)}</strong>
            {intent.kind === 'resolve' ? (
              <p>Backend выполнит расчёт сразу после подтверждения. Отдельного settlement-preview API сейчас нет.</p>
            ) : null}
          </section>

          {intent.kind === 'reject' || intent.kind === 'void' ? (
            <TextField
              id={'admin-' + intent.kind}
              label={intent.kind === 'reject' ? t('mod.reasonPh') : t('mod.cancelPh')}
              value={reason}
              onChange={setReason}
            />
          ) : null}

          <div className={styles.actions}>
            <Button
              fullWidth
              variant={intent.kind === 'void' || intent.kind === 'reject' ? 'secondary' : undefined}
              disabled={
                run.isPending ||
                ((intent.kind === 'reject' || intent.kind === 'void') && !reason.trim())
              }
              onClick={execute}
            >
              {confirmLabel(intent)}
            </Button>
            <Button variant="secondary" fullWidth disabled={run.isPending} onClick={() => setIntent(null)}>
              Отмена
            </Button>
          </div>
        </>
      ) : (
        <>
          <section className={styles.stateCard}>
            <strong>{market.question}</strong>
            <p>Статус · {market.status}</p>
            <p>{t('mod.hint')}</p>
          </section>

          {market.status === 'pending' ? (
            <div className={styles.actions}>
              <Button fullWidth disabled={run.isPending} onClick={() => setIntent({ kind: 'approve' })}>
                {t('mod.approve')}
              </Button>
              <Button variant="secondary" fullWidth disabled={run.isPending} onClick={() => setIntent({ kind: 'reject' })}>
                {t('mod.reject')}
              </Button>
            </div>
          ) : null}

          {market.status === 'open' ? (
            <div className={styles.actions}>
              <Button variant="secondary" fullWidth disabled={run.isPending} onClick={() => setIntent({ kind: 'close' })}>
                {t('mod.close')}
              </Button>
              {p2p ? (
                <Button variant="secondary" fullWidth disabled={run.isPending} onClick={() => setIntent({ kind: 'void' })}>
                  {t('mod.cancel')}
                </Button>
              ) : null}
            </div>
          ) : null}

          {market.status === 'closed' ? (
            <>
              <div className={styles.resolveGrid}>
                {names.map((name, index) => (
                  <Button
                    key={name}
                    variant="secondary"
                    fullWidth
                    disabled={run.isPending}
                    onClick={() => setIntent({ kind: 'resolve', outcomeIndex: index, outcomeName: name })}
                  >
                    {t('mod.resolve', { name })}
                  </Button>
                ))}
              </div>
              {p2p ? (
                <Button variant="secondary" fullWidth disabled={run.isPending} onClick={() => setIntent({ kind: 'void' })}>
                  {t('mod.cancel')}
                </Button>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </section>
  )
}

function confirmationTitle(intent: Exclude<Intent, null>): string {
  if (intent.kind === 'approve') return 'Подтвердить одобрение'
  if (intent.kind === 'reject') return 'Отклонить рынок'
  if (intent.kind === 'close') return 'Остановить торговлю'
  if (intent.kind === 'void') return 'Void рынка'
  return 'Подтвердить расчёт'
}

function confirmationCopy(intent: Exclude<Intent, null>, question: string): string {
  if (intent.kind === 'approve') return 'Одобрить: ' + question
  if (intent.kind === 'reject') return 'Создатель получит указанную причину отклонения.'
  if (intent.kind === 'close') return 'После подтверждения новые заявки на рынок приниматься не будут.'
  if (intent.kind === 'void') return 'Все применимые P2P-средства будут возвращены по существующей backend-логике.'
  return 'Победивший исход · ' + intent.outcomeName
}

function confirmLabel(intent: Exclude<Intent, null>): string {
  if (intent.kind === 'approve') return 'Одобрить рынок'
  if (intent.kind === 'reject') return 'Подтвердить отклонение'
  if (intent.kind === 'close') return 'Остановить торговлю'
  if (intent.kind === 'void') return 'Подтвердить void'
  return 'Рассчитать рынок'
}
