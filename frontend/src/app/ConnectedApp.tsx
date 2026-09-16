import { useEffect, useMemo, useState } from 'react'
import { mapAccountOut } from '../api/adapters'
import { getMarketByShare } from '../api/markets'
import { rememberShareToken } from '../api/share'
import { COPY } from '../lib/constants'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { CreateMarketScreen } from '../screens/CreateMarketScreen'
import { PortfolioScreen } from '../screens/PortfolioScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { bootTelegramWebApp, hasTelegramInitData, readShareTokenFromContext } from '../telegram/webapp'
import type { AccountFixture } from '../types/account'
import type { MarketFixture } from '../types/market'
import { ConnectedMarketDetailScreen } from './ConnectedMarketDetailScreen'
import { ConnectedMarketsScreen } from './ConnectedMarketsScreen'
import { useAccount, useSession } from './session'
import styles from './ConnectedApp.module.css'

type Route =
  | { name: 'markets' }
  | { name: 'create' }
  | { name: 'portfolio' }
  | { name: 'profile'; from: 'markets' | 'create' | 'portfolio' | 'detail' }
  | { name: 'detail'; marketId: number }

const GUEST_ACCOUNT: AccountFixture = {
  displayName: 'Гость',
  handle: 'telegram',
  initials: '?',
  availableTon: 0,
  inPositionsTon: 0,
  inOrdersTon: 0,
  creatorIncomeTon: 0,
  eventsCreated: 0,
  createdVolumeTon: 0,
  isAdmin: false,
}

export function ConnectedApp() {
  const [hasInitData, setHasInitData] = useState(() => hasTelegramInitData())
  const [route, setRoute] = useState<Route>({ name: 'markets' })
  const [shareToken, setShareToken] = useState<string | null>(null)
  const session = useSession(hasInitData)
  const accountQuery = useAccount(session.user?.id)

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
    const from = route.name === 'profile' ? route.from : route.name === 'detail' ? 'detail' : route.name
    setRoute({ name: 'profile', from })
  }

  const openMarket = (market: MarketFixture) => {
    const id = Number(market.id)
    if (!Number.isFinite(id)) return
    setRoute({ name: 'detail', marketId: id })
  }

  const closeProfile = () => {
    if (route.name !== 'profile') return
    if (route.from === 'create') setRoute({ name: 'create' })
    else if (route.from === 'portfolio') setRoute({ name: 'portfolio' })
    else setRoute({ name: 'markets' })
  }

  if (session.isExpired) {
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

  return (
    <div className={styles.root}>
      {route.name === 'markets' ? (
        <ConnectedMarketsScreen
          account={account}
          accountState={accountState}
          onNavChange={goTab}
          onProfileClick={openProfile}
          onSelectMarket={openMarket}
        />
      ) : null}
      {route.name === 'create' ? (
        <CreateMarketScreen onBack={() => setRoute({ name: 'markets' })} submitDisabled />
      ) : null}
      {route.name === 'portfolio' ? (
        <PortfolioScreen
          account={mappedAccount ?? GUEST_ACCOUNT}
          accountState={accountState}
          positions={[]}
          orders={[]}
          history={[]}
          onNavChange={goTab}
          onProfileClick={openProfile}
        />
      ) : null}
      {route.name === 'profile' ? (
        <ProfileScreen
          account={mappedAccount ?? GUEST_ACCOUNT}
          accountState={accountState === 'ready' ? 'ready' : 'unauthenticated'}
          onBack={closeProfile}
        />
      ) : null}
      {route.name === 'detail' ? (
        <ConnectedMarketDetailScreen marketId={route.marketId} onBack={() => setRoute({ name: 'markets' })} />
      ) : null}
    </div>
  )
}
