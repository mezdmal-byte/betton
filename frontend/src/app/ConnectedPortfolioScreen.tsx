import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { mapOpenOrder, mapPositions, mapTransaction } from '../api/adapters'
import { errorDetail } from '../api/errors'
import { cancelOrder, listOrders } from '../api/orders'
import { listPositions, listTransactions } from '../api/portfolio'
import { queryKeys } from '../api/query'
import type { AccountOut } from '../api/types'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { PortfolioScreen } from '../screens/PortfolioScreen'
import { ActivityScreen } from '../screens/ActivityScreen'
import type { AccountFixture, OrderFixture } from '../types/account'
import { confirmCancelOrder, invalidateAfterTrade } from './invalidate'
import { useT } from '../i18n'

const GUEST: AccountFixture = {
  displayName: 'Гость',
  handle: 'telegram',
  initials: '?',
  availableTon: 0,
  inPositionsTon: 0,
  inOrdersTon: 0,
  creatorIncomeTon: 0,
  eventsCreated: null,
  createdVolumeTon: null,
  isAdmin: false,
}

export type ConnectedPortfolioScreenProps = {
  userId?: number
  account?: AccountOut | null
  mappedAccount?: AccountFixture | null
  accountState: 'ready' | 'loading' | 'unauthenticated'
  onNavChange: (id: NavId) => void
  onProfileClick: () => void
  onSelectMarket: (marketId: number) => void
  onDeposit?: () => void
  onWithdraw?: () => void
  onBack?: () => void
  variant?: 'tab' | 'history'
}

export function ConnectedPortfolioScreen({
  userId,
  mappedAccount,
  accountState,
  onNavChange,
  onProfileClick,
  onSelectMarket,
  onDeposit,
  onWithdraw,
  onBack,
  variant = 'tab',
}: ConnectedPortfolioScreenProps) {
  const t = useT()
  const queryClient = useQueryClient()
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const enabled = Boolean(userId)

  const positionsQuery = useQuery({
    queryKey: userId ? queryKeys.positions(userId) : ['users', 'positions', 'idle'],
    queryFn: () => listPositions(userId as number),
    enabled: enabled && variant !== 'history',
  })
  const ordersQuery = useQuery({
    queryKey: userId ? queryKeys.orders(userId) : ['users', 'orders', 'idle'],
    queryFn: () => listOrders(userId as number),
    enabled: enabled && variant !== 'history',
  })
  const historyQuery = useQuery({
    queryKey: userId ? queryKeys.transactions(userId) : ['users', 'transactions', 'idle'],
    queryFn: () => listTransactions(userId as number),
    enabled,
  })

  const positions = useMemo(
    () => (positionsQuery.data ?? []).flatMap(mapPositions),
    [positionsQuery.data],
  )
  const orders = useMemo(
    () => (ordersQuery.data ?? []).map(mapOpenOrder).filter((row): row is OrderFixture => row != null),
    [ordersQuery.data],
  )
  const history = useMemo(
    () => (historyQuery.data ?? []).map(mapTransaction),
    [historyQuery.data],
  )

  const listState =
    !enabled && accountState === 'unauthenticated'
      ? 'ready'
      : positionsQuery.isPending || ordersQuery.isPending || historyQuery.isPending
        ? 'loading'
        : positionsQuery.isError || ordersQuery.isError || historyQuery.isError
          ? 'error'
          : 'ready'

  if (variant === 'history') {
    const activityState =
      !enabled && accountState === 'unauthenticated'
        ? 'ready'
        : historyQuery.isPending
          ? 'loading'
          : historyQuery.isError
            ? 'error'
            : 'ready'

    return (
      <ActivityScreen
        history={accountState === 'unauthenticated' ? [] : history}
        listState={activityState}
        onNavChange={onNavChange}
        onRetry={() => { void historyQuery.refetch() }}
      />
    )
  }

  const cancelMutation = useMutation({
    mutationFn: (order: OrderFixture) => cancelOrder(order.id),
    onMutate: (order) => {
      setActionError(null)
      setCancellingOrderId(order.id)
    },
    onSettled: () => setCancellingOrderId(null),
    onSuccess: (_result, order) => {
      invalidateAfterTrade(queryClient, { userId, marketId: order.marketId })
    },
    onError: (error) => setActionError(errorDetail(error)),
  })

  return (
    <PortfolioScreen
      account={mappedAccount ?? GUEST}
      accountState={accountState}
      positions={accountState === 'unauthenticated' ? [] : positions}
      orders={accountState === 'unauthenticated' ? [] : orders}
      history={accountState === 'unauthenticated' ? [] : history}
      listState={listState}
      cancellingOrderId={cancellingOrderId}
      actionError={actionError}
      onNavChange={onNavChange}
      onProfileClick={onProfileClick}
      onSelectMarket={onSelectMarket}
      onDeposit={onDeposit}
      onWithdraw={onWithdraw}
      onBack={onBack}
      variant={variant}
      onRetry={() => {
        void positionsQuery.refetch()
        void ordersQuery.refetch()
        void historyQuery.refetch()
      }}
      onCancelOrder={(order) => {
        if (!confirmCancelOrder(t('order.cancelConfirm'))) return
        void cancelMutation.mutateAsync(order)
      }}
    />
  )
}
