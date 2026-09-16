import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { mapAccountOut } from '../api/adapters'
import { getHealth } from '../api/account'
import { getMarketByShare } from '../api/markets'
import { queryKeys } from '../api/query'
import { copyShareLink, rememberShareToken, telegramShareUrl } from '../api/share'
import { COPY } from '../lib/constants'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { bootTelegramWebApp, hasTelegramInitData, readShareTokenFromContext } from '../telegram/webapp'
import type { AccountFixture } from '../types/account'
import type { MarketFixture, OutcomeSide } from '../types/market'
import type { MarketOut } from '../api/types'
import { ConnectedCreateMarketScreen } from './ConnectedCreateMarketScreen'
import { ConnectedMarketDetailScreen } from './ConnectedMarketDetailScreen'
import { ConnectedMarketsScreen } from './ConnectedMarketsScreen'
import type { FeedViewState } from './ConnectedMarketsScreen'
import { ConnectedModerationScreen } from './ConnectedModerationScreen'
import { ConnectedMyMarketsScreen } from './ConnectedMyMarketsScreen'
import { ConnectedOwnPriceScreen } from './ConnectedOwnPriceScreen'
import { ConnectedPortfolioScreen } from './ConnectedPortfolioScreen'
import { ConnectedProfileScreen } from './ConnectedProfileScreen'
import { CreateMarketResult } from './CreateMarketResult'
import { useAccount, useAuthExpired, useSession } from './session'
import styles from './ConnectedApp.module.css'

type Route =
  | { name: 'markets' }
  | { name: 'create' }
  | { name: 'create-result'; market: MarketOut }
  | { name: 'portfolio' }
  | { name: 'profile'; from: 'markets' | 'create' | 'portfolio' | 'detail' }
  | { name: 'detail'; marketId: number }
  | { name: 'own-price'; marketId: number; side: OutcomeSide }
  | { name: 'moderation' }
  | { name: 'my-markets' }

const GUEST_ACCOUNT: AccountFixture = {
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

export function ConnectedApp() {
  const [hasInitData, setHasInitData] = useState(() => hasTelegramInitData())
  const [route, setRoute] = useState<Route>({ name: 'markets' })
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [feedView, setFeedView] = useState<FeedViewState>({
    query: '',
    sort: 'new',
    category: 'all',
  })
  const session = useSession(hasInitData)
  const authExpired = useAuthExpired()
  const accountQuery = useAccount(session.user?.id)
  const healthQuery = useQuery({
    queryKey: queryKeys.health,
    queryFn: getHealth,
  })

  useEffect(() => {
    bootTelegramWebApp()
    setHasInitData(hasTelegramInitData())
    setShareToken(readShareTokenFromContext())
  }, [])

  useEffect(() => {
    if (!shareToken || !session.user) return
    let cancelled = false
    void getMarketByShare(shareToken)
      .then((market) => {
        if (cancelled) return
        rememberShareToken(market.id, market.share_token || shareToken)
        setRoute({ name: 'detail', marketId: market.id })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [shareToken, session.user])

  const account = accountQuery.data ?? null
  const mappedAccount = useMemo(() => (account ? mapAccountOut(account) : null), [account])
  const accountState: 'ready' | 'loading' | 'unauthenticated' = !hasInitData
    ? 'unauthenticated'
    : session.isExpired
      ? 'unauthenticated'
      : session.isLoading || Boolean(session.user && accountQuery.isPending)
        ? 'loading'
        : mappedAccount
          ? 'ready'
          : 'unauthenticated'

  const goTab = (id: NavId) => {
    if (id === 'markets') setRoute({ name: 'markets' })
    else if (id === 'create') setRoute({ name: 'create' })
    else setRoute({ name: 'portfolio' })
  }

  const openProfile = () => {
    const from =
      route.name === 'profile'
        ? route.from
        : route.name === 'detail' || route.name === 'own-price'
          ? 'detail'
          : route.name === 'create' || route.name === 'create-result'
            ? 'create'
            : route.name === 'portfolio'
              ? 'portfolio'
              : 'markets'
    setRoute({ name: 'profile', from })
  }

  const openMarket = (market: MarketFixture | number) => {
    const id = typeof market === 'number' ? market : Number(market.id)
    if (!Number.isFinite(id)) return
    setRoute({ name: 'detail', marketId: id })
  }

  const closeProfile = () => {
    if (route.name !== 'profile') return
    if (route.from === 'create') setRoute({ name: 'create' })
    else if (route.from === 'portfolio') setRoute({ name: 'portfolio' })
    else setRoute({ name: 'markets' })
  }

  if (session.isExpired || authExpired) {
    return (
      <div className={styles.root}>
        <div className={styles.overlay}>
          <StatusMessage tone="error" title={COPY.authExpiredTitle}>
            {COPY.authExpiredBody}
          </StatusMessage>
        </div>
      </div>
    )
  }

  const availableTon = mappedAccount?.availableTon ?? 0
  const isAdmin = Boolean(mappedAccount?.isAdmin)
  const botUsername = healthQuery.data?.bot_username

  return (
    <div className={styles.root}>
      {route.name === 'markets' ? (
        <ConnectedMarketsScreen
          account={account}
          accountState={accountState}
          personalized={hasInitData}
          userId={session.user?.id}
          availableTon={availableTon}
          feedView={feedView}
          onFeedViewChange={setFeedView}
          onNavChange={goTab}
          onProfileClick={openProfile}
          onSelectMarket={openMarket}
          onOwnPrice={(marketId, side) => setRoute({ name: 'own-price', marketId, side })}
        />
      ) : null}
      {route.name === 'create' ? (
        <ConnectedCreateMarketScreen
          enabled={accountState === 'ready'}
          onBack={() => setRoute({ name: 'markets' })}
          onCreated={(market) => setRoute({ name: 'create-result', market })}
        />
      ) : null}
      {route.name === 'create-result' ? (
        <CreateMarketResult
          market={route.market}
          shareLink={telegramShareUrl(botUsername, route.market.share_token)}
          onOpen={() => {
            if (route.market.status === 'pending') setRoute({ name: 'my-markets' })
            else setRoute({ name: 'detail', marketId: route.market.id })
          }}
          onBack={() => setRoute({ name: 'markets' })}
          onCopy={() => {
            void copyShareLink(telegramShareUrl(botUsername, route.market.share_token))
          }}
        />
      ) : null}
      {route.name === 'portfolio' ? (
        <ConnectedPortfolioScreen
          userId={session.user?.id}
          mappedAccount={mappedAccount}
          accountState={accountState}
          onNavChange={goTab}
          onProfileClick={openProfile}
          onSelectMarket={(marketId) => setRoute({ name: 'detail', marketId })}
        />
      ) : null}
      {route.name === 'profile' ? (
        <ConnectedProfileScreen
          account={mappedAccount ?? GUEST_ACCOUNT}
          accountState={accountState === 'ready' ? 'ready' : 'unauthenticated'}
          userId={session.user?.id}
          onBack={closeProfile}
          onMenu={(id) => {
            if (id === 'events') setRoute({ name: 'my-markets' })
            else if (id === 'moderation' && isAdmin) setRoute({ name: 'moderation' })
            else if (id === 'wallet') setRoute({ name: 'portfolio' })
          }}
        />
      ) : null}
      {route.name === 'my-markets' ? (
        <ConnectedMyMarketsScreen
          userId={session.user?.id}
          onBack={() => setRoute({ name: 'profile', from: 'markets' })}
          onOpenMarket={(marketId) => setRoute({ name: 'detail', marketId })}
        />
      ) : null}
      {route.name === 'moderation' ? (
        <ConnectedModerationScreen
          enabled={isAdmin}
          onBack={() => setRoute({ name: 'profile', from: 'markets' })}
          onOpenMarket={(marketId) => setRoute({ name: 'detail', marketId })}
        />
      ) : null}
      {route.name === 'detail' ? (
        <ConnectedMarketDetailScreen
          marketId={route.marketId}
          isAdmin={isAdmin}
          userId={session.user?.id}
          availableTon={availableTon}
          onBack={() => setRoute({ name: 'markets' })}
          onOwnPrice={(side) => setRoute({ name: 'own-price', marketId: route.marketId, side })}
        />
      ) : null}
      {route.name === 'own-price' ? (
        <ConnectedOwnPriceScreen
          marketId={route.marketId}
          initialSide={route.side}
          availableTon={availableTon}
          userId={session.user?.id}
          onBack={() => setRoute({ name: 'detail', marketId: route.marketId })}
          onPlaced={() => setRoute({ name: 'detail', marketId: route.marketId })}
        />
      ) : null}
    </div>
  )
}
