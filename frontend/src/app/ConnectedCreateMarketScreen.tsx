import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { buildCreateMarketPayload } from '../api/adapters'
import { errorDetail } from '../api/errors'
import { createMarket } from '../api/markets'
import { rememberShareToken } from '../api/share'
import { defaultCloseAt, formatCloseAtLabel, fromDatetimeLocalValue, toDatetimeLocalValue } from '../lib/datetime'
import { CreateMarketScreen } from '../screens/CreateMarketScreen'
import type { CreateMarketDraft } from '../types/account'
import type { MarketOut } from '../api/types'

export type ConnectedCreateMarketScreenProps = {
  onBack: () => void
  onCreated: (market: MarketOut) => void
  enabled: boolean
}

export function ConnectedCreateMarketScreen({ onBack, onCreated, enabled }: ConnectedCreateMarketScreenProps) {
  const [closeAt, setCloseAt] = useState(() => defaultCloseAt())
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (draft: CreateMarketDraft) => {
      const visibility = draft.visibility === 'unlisted' ? 'unlisted' : 'public'
      if (draft.question.trim().length < 8) throw new Error('Вопрос должен содержать от 8 до 512 символов')
      if (closeAt.getTime() <= Date.now()) throw new Error('Конец приёма не может быть в прошлом')
      return createMarket(
        buildCreateMarketPayload({
          question: draft.question,
          category: draft.category,
          outcomeA: draft.outcomeA,
          outcomeB: draft.outcomeB,
          closeAt,
          visibility,
          description: draft.description,
        }),
      )
    },
    onSuccess: (market) => {
      if (market.share_token) rememberShareToken(market.id, market.share_token)
      onCreated(market)
    },
    onError: (error) => setErrorMessage(errorDetail(error)),
  })

  const closeLabel = useMemo(() => formatCloseAtLabel(closeAt), [closeAt])

  return (
    <CreateMarketScreen
      onBack={onBack}
      submitDisabled={!enabled || mutation.isPending}
      submitting={mutation.isPending}
      errorMessage={errorMessage}
      closeAtLabel={closeLabel}
      closeAtLocal={toDatetimeLocalValue(closeAt)}
      onCloseAtChange={(value) => {
        const next = fromDatetimeLocalValue(value)
        if (next) setCloseAt(next)
      }}
      onSubmit={(draft) => {
        setErrorMessage(null)
        void mutation.mutateAsync(draft)
      }}
    />
  )
}
