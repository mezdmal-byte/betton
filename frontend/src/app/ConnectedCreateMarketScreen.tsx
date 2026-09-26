import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { buildCreateMarketPayload } from '../api/adapters'
import { errorDetail } from '../api/errors'
import { createMarket } from '../api/markets'
import { getUpcomingCs2Matches, importUpcomingCs2Matches } from '../api/sports'
import { queryKeys } from '../api/query'
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
  const queryClient = useQueryClient()
  const [closeAt, setCloseAt] = useState(() => defaultCloseAt())
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [cs2ImportMessage, setCs2ImportMessage] = useState<string | null>(null)

  const cs2Query = useQuery({
    queryKey: queryKeys.cs2Upcoming,
    queryFn: () => getUpcomingCs2Matches(40),
    enabled,
    staleTime: 60_000,
  })

  const cs2ImportMutation = useMutation({
    mutationFn: () => importUpcomingCs2Matches(40),
    onSuccess: (result) => {
      setCs2ImportMessage(
        result.created > 0
          ? `Загружено рынков: ${result.created}. Уже были загружены: ${result.skipped}.`
          : `Новых рынков нет. Уже были загружены: ${result.skipped}.`,
      )
      void queryClient.invalidateQueries({ queryKey: ['markets'] })
    },
    onError: (error) => {
      setCs2ImportMessage(errorDetail(error))
    },
  })

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
      cs2Matches={cs2Query.data?.items ?? []}
      cs2Configured={Boolean(cs2Query.data?.configured)}
      cs2Loading={cs2Query.isPending}
      cs2Error={cs2Query.isError}
      onRetryCs2={() => { void cs2Query.refetch() }}
      cs2Importing={cs2ImportMutation.isPending}
      cs2ImportMessage={cs2ImportMessage}
      onImportAllCs2={() => {
        setCs2ImportMessage(null)
        void cs2ImportMutation.mutateAsync()
      }}
      onSubmit={(draft) => {
        setErrorMessage(null)
        void mutation.mutateAsync(draft)
      }}
    />
  )
}
