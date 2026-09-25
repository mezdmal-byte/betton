import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import {
  classifyIocPlacement,
  mapOrderPreview,
  moneyForOrder,
  type IocPlacementResult,
} from '../api/adapters'
import { errorDetail, isInsufficientBalanceError } from '../api/errors'
import { IdempotencyKeys, orderFingerprint } from '../api/idempotency'
import { placeOrder, previewOrder } from '../api/orders'
import { queryKeys } from '../api/query'
import { shareTokenFor } from '../api/share'
import { QuickTradeSheet } from '../components/QuickTradeSheet/QuickTradeSheet'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import type { QuickTradeState } from '../components/QuickTradeSheet/QuickTradeSheet'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { outcomeIsExecutable } from '../lib/quote'
import {
  iocAcceptedOdds,
  iocDiscoveryOdds,
  shouldRequestQuickTradePreview,
} from '../lib/quickTrade'
import type { MarketFixture, OutcomeSide } from '../types/market'
import { hapticNotification } from '../telegram/webapp'
import { useT } from '../i18n'
import { invalidateAfterTrade } from './invalidate'

type Props = {
  market: MarketFixture
  selectedSide: OutcomeSide
  amount: number
  availableTon: number
  totalAvailableTon?: number | null
  userId?: number
  quotesLoading?: boolean
  quotesError?: boolean
  onRetryQuotes?: () => void
  onSelectSide: (side: OutcomeSide) => void
  onAmountChange: (amount: number) => void
  onClose: () => void
  onOwnPrice: () => void
  onNavChange?: (id: NavId) => void
}

export function ConnectedQuickTradeSheet({
  market,
  selectedSide,
  amount,
  availableTon,
  totalAvailableTon = null,
  userId,
  quotesLoading = false,
  quotesError = false,
  onRetryQuotes,
  onSelectSide,
  onAmountChange,
  onClose,
  onOwnPrice,
  onNavChange,
}: Props) {
  const t = useT()
  const queryClient = useQueryClient()
  const keys = useRef(new IdempotencyKeys())
  const [state, setState] = useState<QuickTradeState>('normal')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [placeResult, setPlaceResult] = useState<IocPlacementResult | null>(null)
  const marketId = Number(market.id)
  const shareToken = shareTokenFor(marketId)
  const outcome = selectedSide === 'a' ? 0 : 1
  const selected = selectedSide === 'a' ? market.outcomeA : market.outcomeB
  const discoveryOdds = iocDiscoveryOdds()
  const money = moneyForOrder(amount)
  const debouncedMoney = useDebouncedValue(money, 280)
  const previewEnabled = shouldRequestQuickTradePreview({
    amount,
    executable: outcomeIsExecutable(selected),
    userId,
    marketId,
  })

  const previewQuery = useQuery({
    queryKey: queryKeys.orderPreview({
      marketId,
      outcome,
      money: debouncedMoney,
      odds: String(discoveryOdds),
      kind: 'ioc',
    }),
    queryFn: () =>
      previewOrder(
        marketId,
        { outcome, money: debouncedMoney, odds: discoveryOdds, kind: 'ioc' },
        shareToken,
      ),
    enabled: previewEnabled,
  })

  const preview = previewQuery.data ? mapOrderPreview(previewQuery.data) : null
  const previewRequestError = previewQuery.isError && !isInsufficientBalanceError(previewQuery.error)
  const requestError = quotesError || previewRequestError
  const requestErrorMessage = quotesError
    ? t('err.requestBody')
    : previewRequestError
      ? errorDetail(previewQuery.error) || t('err.requestBody')
      : errorMessage
  const effectiveState: QuickTradeState =
    requestError && state !== 'processing' && state !== 'success' ? 'error' : state
  // During the debounce window React Query still exposes the previous amount's preview.
  // Never let that stale plan be confirmed for a newly typed amount.
  const previewSettling =
    previewEnabled && (debouncedMoney !== money || previewQuery.isPending || previewQuery.isFetching)

  useEffect(() => {
    setState('normal')
    setErrorMessage(null)
    setPlaceResult(null)
  }, [selectedSide, amount, discoveryOdds])

  useEffect(() => {
    if (state === 'processing' || state === 'success' || state === 'stale-quote' || state === 'error') {
      return
    }
    if (!previewEnabled) {
      if (!quotesLoading && !outcomeIsExecutable(selected)) setState('no-liquidity')
      else if (amount <= 0) setState('normal')
      return
    }
    if (amount > availableTon) {
      setState('insufficient-balance')
      return
    }
    if (previewQuery.isError && isInsufficientBalanceError(previewQuery.error)) {
      setState('insufficient-balance')
      return
    }
    if (previewSettling || !preview) return
    if (preview.matchedTon <= 0) {
      setState('no-liquidity')
      return
    }
    if (preview.remainingTon > 0.0001) {
      setState('partial')
      return
    }
    setState('normal')
  }, [
    amount,
    availableTon,
    preview,
    previewEnabled,
    previewQuery.error,
    previewQuery.isError,
    previewSettling,
    quotesLoading,
    selected,
    state,
  ])

  const mutation = useMutation({
    mutationFn: async () => {
      if (debouncedMoney !== money || previewQuery.isFetching) {
        throw new Error(t('err.stale'))
      }
      const acceptedOdds = iocAcceptedOdds(preview?.worstOdds)
      if (acceptedOdds == null || !preview || preview.matchedTon <= 0) {
        throw new Error(t('err.stale'))
      }
      const live = await previewOrder(
        marketId,
        { outcome, money, odds: acceptedOdds, kind: 'ioc' },
        shareToken,
      )
      const mapped = mapOrderPreview(live)
      if (mapped.matchedTon <= 0) throw new Error(t('err.stale'))
      const fingerprint = orderFingerprint({
        marketId,
        outcome,
        money,
        odds: acceptedOdds,
        kind: 'ioc',
      })
      const requestId = keys.current.forFingerprint(fingerprint)
      const result = await placeOrder(
        marketId,
        { outcome, money, odds: acceptedOdds, kind: 'ioc', request_id: requestId },
        shareToken,
      )
      keys.current.clear(fingerprint)
      return result
    },
    onMutate: () => {
      setState('processing')
      setErrorMessage(null)
      setPlaceResult(null)
    },
    onSuccess: (order) => {
      invalidateAfterTrade(queryClient, { userId, marketId })
      const placed = classifyIocPlacement(order)
      if (placed.kind === 'empty') {
        setPlaceResult(null)
        setErrorMessage(t('err.stale'))
        setState('stale-quote')
        hapticNotification('warning')
        void previewQuery.refetch()
        return
      }
      setPlaceResult(placed)
      setErrorMessage(null)
      setState('success')
      hapticNotification('success')
    },
    onError: (error) => {
      hapticNotification('error')
      if (isInsufficientBalanceError(error)) {
        setState('insufficient-balance')
        return
      }
      const message = error instanceof Error ? error.message : t('err.place')
      if (message === t('err.stale') || message.includes(t('err.stale'))) {
        setState('stale-quote')
        return
      }
      setState('error')
      setErrorMessage(message)
    },
  })

  return (
    <QuickTradeSheet
      market={market}
      selectedSide={selectedSide}
      amount={amount}
      state={effectiveState}
      quotesLoading={quotesLoading || previewSettling}
      availableTon={availableTon}
      totalAvailableTon={totalAvailableTon}
      onNavChange={onNavChange}
      previewMatchedTon={previewSettling ? null : (preview?.matchedTon ?? null)}
      previewRestTon={previewSettling ? null : (preview?.remainingTon ?? null)}
      previewPayoutTon={previewSettling ? null : (preview?.payoutTon ?? null)}
      previewAverageOdds={previewSettling ? null : (preview?.averageOdds ?? null)}
      previewWorstOdds={previewSettling ? null : (preview?.worstOdds ?? null)}
      previewFills={previewSettling ? null : (preview?.fills ?? null)}
      errorMessage={requestErrorMessage}
      placeResult={placeResult}
      onSelectSide={onSelectSide}
      onAmountChange={onAmountChange}
      onClose={onClose}
      onOwnPrice={onOwnPrice}
      onRefreshQuote={() => {
        setState('normal')
        setErrorMessage(null)
        onRetryQuotes?.()
        void previewQuery.refetch()
      }}
      onPlace={() => {
        void mutation.mutateAsync()
      }}
    />
  )
}
