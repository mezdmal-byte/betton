import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mapMarketOut } from '../api/adapters'
import { errorDetail } from '../api/errors'
import { isApiError } from '../api/client'
import { listModerationQueue, rejectMarket, approveMarket } from '../api/moderation'
import { queryKeys } from '../api/query'
import { useI18n } from '../i18n'
import { ModerationScreen } from '../screens/ModerationScreen'

export type ConnectedModerationScreenProps = { enabled: boolean; onBack: () => void }

export function ConnectedModerationScreen({ enabled, onBack }: ConnectedModerationScreenProps) {
  const { locale } = useI18n()
  const queryClient = useQueryClient()
  const [reasonById, setReasonById] = useState<Record<number, string>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<'failure' | 'conflict'>('failure')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const queue = useQuery({ queryKey: queryKeys.moderation, queryFn: listModerationQueue, enabled })
  const invalidate = (marketId?: number) => { void queryClient.invalidateQueries({ queryKey: queryKeys.moderation }); void queryClient.invalidateQueries({ queryKey: ['markets'] }); if (marketId != null) void queryClient.invalidateQueries({ queryKey: queryKeys.market(marketId) }) }
  const approve = useMutation({
    mutationFn: (marketId: number) => approveMarket(marketId),
    onSuccess: (_data, marketId) => {
      setSuccessMessage('Рынок одобрен и опубликован.')
      invalidate(marketId)
    },
    onError: (error) => {
      setErrorKind(isApiError(error) && error.status === 409 ? 'conflict' : 'failure')
      setErrorMessage(errorDetail(error))
    },
  })
  const reject = useMutation({
    mutationFn: ({ marketId, reason }: { marketId: number; reason: string }) => rejectMarket(marketId, reason),
    onSuccess: (_data, vars) => {
      setSuccessMessage('Рынок отклонён; причина сохранена для создателя.')
      invalidate(vars.marketId)
    },
    onError: (error) => {
      setErrorKind(isApiError(error) && error.status === 409 ? 'conflict' : 'failure')
      setErrorMessage(errorDetail(error))
    },
  })
  const markets = useMemo(() => (queue.data ?? []).map((market) => mapMarketOut(market, new Date(), locale)), [queue.data, locale])
  const busyMarketId = approve.isPending ? approve.variables ?? null : reject.isPending ? reject.variables?.marketId ?? null : null
  const viewState = !enabled ? 'no-access' : queue.isPending ? 'loading' : queue.isError ? 'error' : 'ready'

  return (
    <ModerationScreen
      markets={markets}
      viewState={viewState}
      reasonById={reasonById}
      busyMarketId={busyMarketId}
      errorMessage={queue.isError ? errorDetail(queue.error) : errorMessage}
      errorKind={errorKind}
      successMessage={successMessage}
      onBack={onBack}
      onApprove={(marketId) => {
        setErrorMessage(null)
        setSuccessMessage(null)
        approve.mutate(marketId)
      }}
      onReject={(marketId, reason) => {
        setErrorMessage(null)
        setSuccessMessage(null)
        reject.mutate({ marketId, reason })
      }}
      onReasonChange={(marketId, reason) =>
        setReasonById((current) => ({ ...current, [marketId]: reason }))
      }
      onRetry={() => {
        setErrorMessage(null)
        void queue.refetch()
      }}
      onDismissSuccess={() => setSuccessMessage(null)}
    />
  )
}
