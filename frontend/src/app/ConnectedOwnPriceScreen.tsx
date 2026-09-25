import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { mapMarketOut, mapOrderBookLevels, mapOrderPreview, mapTradesToRecent, moneyForOrder } from '../api/adapters'
import { isApiError } from '../api/client'
import { errorDetail, isInsufficientBalanceError } from '../api/errors'
import { IdempotencyKeys, orderFingerprint } from '../api/idempotency'
import { getMarket, getMarketTrades, getOrderbook } from '../api/markets'
import { placeOrder, previewOrder } from '../api/orders'
import { queryKeys } from '../api/query'
import { rememberShareToken, shareTokenFor } from '../api/share'
import { hapticNotification } from '../telegram/webapp'
import { useT, useI18n } from '../i18n'
import { formatTonFull } from '../lib/format'
import { marketIsTradable } from '../lib/quote'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { OwnPriceScreen } from '../screens/OwnPriceScreen'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import type { OutcomeSide } from '../types/market'
import { invalidateAfterTrade } from './invalidate'

export type ConnectedOwnPriceScreenProps = {
  marketId: number
  initialSide?: OutcomeSide
  availableTon: number
  userId?: number
  onBack: () => void
  onQuickTrade?: (side: OutcomeSide) => void
  onNavChange?: (id: NavId) => void
}

export function ConnectedOwnPriceScreen({
  marketId,
  initialSide = 'a',
  availableTon,
  userId,
  onBack,
  onQuickTrade,
  onNavChange,
}: ConnectedOwnPriceScreenProps) {
  const t = useT()
  const { locale } = useI18n()
  const queryClient = useQueryClient()
  const keys = useRef(new IdempotencyKeys())
  const [side, setSide] = useState<OutcomeSide>(initialSide)
  const [odds, setOdds] = useState(1.9)
  const [amount, setAmount] = useState(100)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const initializedOdds = useRef(false)
  const shareToken = shareTokenFor(marketId)

  const marketQuery = useQuery({
    queryKey: [...queryKeys.market(marketId), shareToken],
    queryFn: async () => {
      const dto = await getMarket(marketId, shareToken)
      if (dto.share_token) rememberShareToken(dto.id, dto.share_token)
      return dto
    },
  })

  const bookQuery = useQuery({
    queryKey: [...queryKeys.orderbook(marketId), shareToken],
    queryFn: () => getOrderbook(marketId, shareToken),
    enabled: marketQuery.data?.mechanism === 'p2p',
  })
  const tradesQuery = useQuery({
    queryKey: [...queryKeys.trades(marketId), shareToken],
    queryFn: () => getMarketTrades(marketId, shareToken),
    enabled: marketQuery.data?.mechanism === 'p2p',
  })

  const market = marketQuery.data ? mapMarketOut(marketQuery.data, new Date(), locale) : undefined
  const tradable = Boolean(market && marketIsTradable(market))
  const outcome = side === 'a' ? 0 : 1
  const money = moneyForOrder(amount)
  const debouncedMoney = useDebouncedValue(money, 280)
  const debouncedOdds = useDebouncedValue(odds, 200)

  useEffect(() => {
    if (initializedOdds.current || !market) return
    const current = side === 'a' ? market.outcomeA.odds : market.outcomeB.odds
    if (current) setOdds(current)
    initializedOdds.current = true
  }, [market, side])

  const previewQuery = useQuery({
    queryKey: queryKeys.orderPreview({
      marketId,
      outcome,
      money: debouncedMoney,
      odds: String(debouncedOdds),
      kind: 'limit',
    }),
    queryFn: () =>
      previewOrder(marketId, { outcome, money: debouncedMoney, odds: debouncedOdds, kind: 'limit' }, shareToken),
    enabled: Boolean(userId && market && tradable && amount > 0 && odds > 1),
  })

  const preview = previewQuery.data ? mapOrderPreview(previewQuery.data) : null
  const book = mapOrderBookLevels(bookQuery.data?.sides?.[outcome])
  const trades = mapTradesToRecent(tradesQuery.data, outcome, locale)
  const insufficient = amount > availableTon

  const mutation = useMutation({
    mutationFn: async () => {
      const fingerprint = orderFingerprint({
        marketId,
        outcome,
        money,
        odds,
        kind: 'limit',
      })
      const requestId = keys.current.forFingerprint(fingerprint)
      const result = await placeOrder(
        marketId,
        { outcome, money, odds, kind: 'limit', request_id: requestId },
        shareToken,
      )
      keys.current.clear(fingerprint)
      return result
    },
    onSuccess: () => {
      invalidateAfterTrade(queryClient, { userId, marketId })
      hapticNotification('success')
      setSuccess(true)
    },
    onError: (error) => {
      hapticNotification('error')
      if (isInsufficientBalanceError(error)) {
        setErrorMessage(t('err.fundsAvail', { amt: formatTonFull(availableTon) }))
        return
      }
      setErrorMessage(error instanceof Error ? error.message : t('err.place'))
    },
  })

  const forbidden = isApiError(marketQuery.error) && marketQuery.error.code === 'forbidden'
  if (marketQuery.isPending || !market || marketQuery.isError) {
    return (
      <OwnPriceScreen
        onBack={onBack}
        onQuickTrade={onQuickTrade}
        onNavChange={onNavChange}
        viewState={marketQuery.isPending ? 'loading' : forbidden ? 'forbidden' : 'error'}
        onRetry={() => { void marketQuery.refetch() }}
      />
    )
  }

  const selectSide = (next: OutcomeSide) => {
    setSide(next)
    setErrorMessage(null)
    setSuccess(false)
    const nextOdds = next === 'a' ? market.outcomeA.odds : market.outcomeB.odds
    if (nextOdds) setOdds(nextOdds)
  }

  const changeOdds = (next: number) => {
    setErrorMessage(null)
    setSuccess(false)
    setOdds(Math.max(1.01, Math.round(next * 100) / 100))
  }

  const changeAmount = (next: number) => {
    setErrorMessage(null)
    setSuccess(false)
    setAmount(next)
  }

  return (
    <OwnPriceScreen
      market={market}
      onBack={onBack}
      onQuickTrade={onQuickTrade}
      onNavChange={onNavChange}
      selectedSide={side}
      odds={odds}
      amount={amount}
      book={book}
      trades={trades}
      matchedTon={preview?.matchedTon ?? null}
      restTon={preview?.remainingTon ?? null}
      previewMode="backend"
      submitting={mutation.isPending}
      disabled={!tradable || insufficient || !userId || mutation.isPending || success}
      noticeMessage={!tradable ? t('demo.unavailable') : null}
      bookState={bookQuery.isPending ? 'loading' : bookQuery.isError ? 'error' : 'ready'}
      tradesState={tradesQuery.isPending ? 'loading' : tradesQuery.isError ? 'error' : 'ready'}
      onRetryBook={() => { void bookQuery.refetch() }}
      onRetryTrades={() => { void tradesQuery.refetch() }}
      errorMessage={errorMessage ?? (previewQuery.isError && !isInsufficientBalanceError(previewQuery.error) ? errorDetail(previewQuery.error) : null)}
      availableTon={availableTon}
      success={success}
      onSelectSide={selectSide}
      onOddsChange={changeOdds}
      onAmountChange={changeAmount}
      onSubmit={() => {
        setErrorMessage(null)
        if (insufficient || !tradable) return
        void mutation.mutateAsync()
      }}
    />
  )
}
