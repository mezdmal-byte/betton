import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { buildCreateMarketPayload } from '../api/adapters'
import { errorDetail } from '../api/errors'
import { createMarket } from '../api/markets'
import { rememberShareToken } from '../api/share'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { useT } from '../i18n'
import { hapticNotification } from '../telegram/webapp'
import { defaultCloseAt, formatCloseAtLabel, fromDatetimeLocalValue, toDatetimeLocalValue } from '../lib/datetime'
import { CreateMarketScreen } from '../screens/CreateMarketScreen'
import type { CreateMarketDraft } from '../types/account'
import type { MarketOut } from '../api/types'

export type ConnectedCreateMarketScreenProps = {
  onBack: () => void
  onCreated: (market: MarketOut) => void
  enabled: boolean
  onNavChange?: (id: NavId) => void
}

export function ConnectedCreateMarketScreen({ onBack, onCreated, enabled, onNavChange }: ConnectedCreateMarketScreenProps) {
  const t = useT()
  const [closeAt, setCloseAt] = useState(() => defaultCloseAt())
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (draft: CreateMarketDraft) => {
      const visibility = draft.visibility === 'unlisted' ? 'unlisted' : 'public'
      const questionLength = draft.question.trim().length
      if (questionLength < 8 || questionLength > 512) throw new Error(t('create.qShort'))
      if (closeAt.getTime() <= Date.now()) throw new Error(t('create.closePast'))
      if (draft.outcomeA.trim() === draft.outcomeB.trim()) throw new Error(t('create.uniqOutcomes'))
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
      hapticNotification('success')
      onCreated(market)
    },
    onError: (error) => {
      hapticNotification('error')
      setErrorMessage(errorDetail(error))
    },
  })

  const closeLabel = useMemo(() => formatCloseAtLabel(closeAt), [closeAt])

  return (
    <CreateMarketScreen
      onBack={onBack}
      unauthenticated={!enabled}
      onNavChange={onNavChange}
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
