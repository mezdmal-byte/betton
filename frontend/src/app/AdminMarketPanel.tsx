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
import { invalidateAfterTrade } from './invalidate'

export function AdminMarketPanel({
  market,
  userId,
}: {
  market: MarketOut
  userId?: number
}) {
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
  const names = market.outcomes?.length ? market.outcomes : ['Да', 'Нет']

  return (
    <section>
      <StatusMessage title="Модерация">Только существующие admin-действия backend.</StatusMessage>
      {errorMessage ? <StatusMessage tone="error" title="Ошибка">{errorMessage}</StatusMessage> : null}
      {market.status === 'pending' ? (
        <>
          <Button fullWidth onClick={() => run.mutate(() => approveMarket(market.id))}>
            Одобрить
          </Button>
          <TextField id="admin-reject" label="Причина отклонения" value={reason} onChange={setReason} />
          <Button variant="secondary" fullWidth onClick={() => run.mutate(() => rejectMarket(market.id, reason.trim()))}>
            Отклонить
          </Button>
        </>
      ) : null}
      {market.status === 'open' ? (
        <Button variant="secondary" fullWidth onClick={() => run.mutate(() => closeMarket(market.id))}>
          Стоп ставки
        </Button>
      ) : null}
      {market.status === 'closed'
        ? names.map((name, index) => (
            <Button
              key={name}
              variant="secondary"
              fullWidth
              onClick={() => run.mutate(() => resolveMarket(market.id, index))}
            >
              Рассчитать: {name}
            </Button>
          ))
        : null}
      {p2p && (market.status === 'open' || market.status === 'closed') ? (
        <>
          <TextField id="admin-void" label="Причина отмены события" value={reason} onChange={setReason} />
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              if (
                typeof window !== 'undefined' &&
                !window.confirm('Все ставки по событию будут возвращены. Сервисный сбор не удерживается')
              ) {
                return
              }
              run.mutate(() => voidMarket(market.id, reason.trim()))
            }}
          >
            Отменить событие
          </Button>
        </>
      ) : null}
    </section>
  )
}
