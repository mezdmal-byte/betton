import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import {
  classifyIocPlacement,
  IOC_REQUOTE_MESSAGE,
  mapOrderPreview,
  moneyForOrder,
  type IocPlacementResult,
} from '../api/adapters'
import { isInsufficientBalanceError } from '../api/errors'
import { IdempotencyKeys, orderFingerprint } from '../api/idempotency'
import { iocOddsFromPreview, placeOrder, previewOrder } from '../api/orders'
import { queryKeys } from '../api/query'
import { shareTokenFor } from '../api/share'
import { QuickTradeSheet } from '../components/QuickTradeSheet/QuickTradeSheet'
import type { QuickTradeState } from '../components/QuickTradeSheet/QuickTradeSheet'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { outcomeIsExecutable } from '../lib/quote'
import type { MarketFixture, OutcomeSide } from '../types/market'
import { invalidateAfterTrade } from './invalidate'

type Props = {
  market: MarketFixture
  selectedSide: OutcomeSide
  amount: number
  availableTon: number
  userId?: number
  quotesLoading?: boolean
  onSelectSide: (side: OutcomeSide) => void
  onAmountChange: (amount: number) => void
  onClose: () => void
  onOwnPrice: () => void
}

export function ConnectedQuickTradeSheet({
  market,
  selectedSide,
  amount,
  availableTon,
  userId,
  quotesLoading = false,
  onSelectSide,
  onAmountChange,
  onClose,
  onOwnPrice,
}: Props) {
  const queryClient = useQueryClient()
  const keys = useRef(new IdempotencyKeys())
  const [state, setState] = useState<QuickTradeState>('normal')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [placeResult, setPlaceResult] = useState<IocPlacementResult | null>(null)
  const marketId = Number(market.id)
  const shareToken = shareTokenFor(marketId)
  const outcome = selectedSide === 'a' ? 0 : 1
  const selected = selectedSide === 'a' ? market.outcomeA : market.outcomeB
  const limitOdds = selected.odds
  const money = moneyForOrder(amount)
  const debouncedMoney = useDebouncedValue(money, 280)
  const previewEnabled =
    Boolean(userId) &&
    Number.isFinite(marketId) &&
    amount > 0 &&
    limitOdds != null &&
    outcomeIsExecutable(selected)

  const previewQuery = useQuery({
    queryKey: queryKeys.orderPreview({
      marketId,
      outcome,
      money: debouncedMoney,
      odds: String(limitOdds ?? ''),
    }),
    queryFn: () =>
      previewOrder(
        marketId,
        { outcome, money: debouncedMoney, odds: limitOdds as number },
        shareToken,
      ),
    enabled: previewEnabled,
  })

  const preview = previewQuery.data ? mapOrderPreview(previewQuery.data) : null

  useEffect(() => {
    setState('normal')
    setErrorMessage(null)
    setPlaceResult(null)
  }, [selectedSide, amount, limitOdds])

  useEffect(() => {
    if (state === 'processing' || state === 'success' || state === 'stale-quote' || state === 'error') {
      return
    }
    if (!previewEnabled) {
      if (!quotesLoading && !outcomeIsExecutable(selected)) setState('no-liquidity')
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
    if (!preview) return
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
    quotesLoading,
    selected,
    state,
  ])

  const mutation = useMutation({
    mutationFn: async () => {
      if (limitOdds == null) throw new Error('Обновите предложение')
      const live = await previewOrder(marketId, { outcome, money, odds: limitOdds }, shareToken)
      const mapped = mapOrderPreview(live)
      if (mapped.matchedTon <= 0) throw new Error('Обновите предложение')
      const odds = iocOddsFromPreview(mapped.availableWorstOdds, limitOdds)
      const fingerprint = orderFingerprint({
        marketId,
        outcome,
        money,
        odds,
        kind: 'ioc',
      })
      const requestId = keys.current.forFingerprint(fingerprint)
      const result = await placeOrder(
        marketId,
        { outcome, money, odds, kind: 'ioc', request_id: requestId },
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
        setErrorMessage(IOC_REQUOTE_MESSAGE)
        setState('stale-quote')
        void previewQuery.refetch()
        return
      }
      setPlaceResult(placed)
      setErrorMessage(null)
      setState('success')
    },
    onError: (error) => {
      if (isInsufficientBalanceError(error)) {
        setState('insufficient-balance')
        return
      }
      const message = error instanceof Error ? error.message : 'Не удалось разместить заявку'
      if (message.includes('Обновите предложение')) {
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
      state={state}
      quotesLoading={quotesLoading || (previewEnabled && previewQuery.isPending)}
      availableTon={availableTon}
      previewMatchedTon={preview?.matchedTon ?? null}
      previewRestTon={preview?.remainingTon ?? null}
      previewPayoutTon={preview?.payoutTon ?? null}
      errorMessage={errorMessage}
      placeResult={placeResult}
      onSelectSide={onSelectSide}
      onAmountChange={onAmountChange}
      onClose={onClose}
      onOwnPrice={onOwnPrice}
      onRefreshQuote={() => {
        setState('normal')
        void previewQuery.refetch()
      }}
      onPlace={() => {
        void mutation.mutateAsync()
      }}
    />
  )
}
