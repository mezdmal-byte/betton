import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { mapAccountOut } from '../api/adapters'
import { getHealth } from '../api/account'
import { getMarketByShare } from '../api/markets'
import { queryKeys } from '../api/query'
import { copyShareLink, rememberShareToken, telegramShareUrl } from '../api/share'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { useI18n } from '../i18n'
import type { AccountFixture } from '../types/account'
import type { MarketFixture } from '../types/market'
import {
  bootTelegramWebApp,
  hasTelegramInitData,
  readShareTokenFromContext,
  syncTelegramBackButton,
} from '../telegram/webapp'
import { ConnectedCreateMarketScreen } from './ConnectedCreateMarketScreen'
import { ConnectedMarketDetailScreen } from './ConnectedMarketDetailScreen'
import { ConnectedMarketsScreen } from './ConnectedMarketsScreen'
import type { FeedViewState } from './ConnectedMarketsScreen'
import { ConnectedModerationScreen } from './ConnectedModerationScreen'
import { ConnectedMyMarketsScreen } from './ConnectedMyMarketsScreen'
import { ConnectedOwnPriceScreen } from './ConnectedOwnPriceScreen'
import { ConnectedPortfolioScreen } from './ConnectedPortfolioScreen'
import { ConnectedProfileScreen } from './ConnectedProfileScreen'
import { ConnectedPublicProfileScreen } from './ConnectedPublicProfileScreen'
import { CreateMarketResult } from './CreateMarketResult'
import { HelpScreen } from '../screens/HelpScreen'
import { WalletScreen } from '../screens/WalletScreen'
import {
  currentRoute,
  goBack,
  pushRoute,
  resetToTab,
  showTelegramBackButton,
  type Route,
  type WalletTab,
} from './navigation'
import { useAccount, useAuthExpired, useSession } from './session'
import styles from './ConnectedApp.module.css'

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
  const { t } = useI18n()
  const [hasInitData, setHasInitData] = useState(() => hasTelegramInitData())
  const [stack, setStack] = useState<Route[]>([{ name: 'markets' }])
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [feedView, setFeedView] = useState<FeedViewState>({
    query: '',
    sort: 'new',
    category: 'all',
    status: 'open',
  })
  const session = useSession(hasInitData)
  const authExpired = useAuthExpired()
  const accountQuery = useAccount(session.user?.id)
  const healthQuery = useQuery({
    queryKey: queryKeys.health,
    queryFn: getHealth,
  })
  const route = currentRoute(stack)

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
        setStack((current) => pushRoute(current, { name: 'detail', marketId: market.id }))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [shareToken, session.user])

  useEffect(() => {
    return syncTelegramBackButton(showTelegramBackButton(route), () => setStack(goBack))
  }, [route])

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

  const back = () => setStack((current) => goBack(current))
  const goTab = (id: NavId) => setStack(resetToTab(id))
  const push = (next: Route) => setStack((current) => pushRoute(current, next))

  const openProfile = () => push({ name: 'profile' })
  const openMarket = (market: MarketFixture | number) => {
    const id = typeof market === 'number' ? market : Number(market.id)
    if (!Number.isFinite(id)) return
    push({ name: 'detail', marketId: id })
  }
  const openCreator = (userId?: number | null) => {
    if (!userId) return
    push({ name: 'public-profile', userId })
  }

  if (session.isExpired || authExpired) {
    return (
      <div className={styles.root}>
        <div className={styles.overlay}>
          <StatusMessage tone="error" title={t('auth.expiredTitle')}>
            {t('auth.expiredBody')}
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
          onCreatorClick={(market) => openCreator(market.creator.id ?? market.creatorId)}
          onOwnPrice={(marketId, side) => push({ name: 'own-price', marketId, side })}
        />
      ) : null}
      {route.name === 'create' ? (
        <ConnectedCreateMarketScreen
          enabled={accountState === 'ready'}
          onBack={() => goTab('markets')}
          onCreated={(market) => push({ name: 'create-result', market })}
        />
      ) : null}
      {route.name === 'create-result' ? (
        <CreateMarketResult
          market={route.market}
          shareLink={telegramShareUrl(botUsername, route.market.share_token)}
          onOpen={() => {
            if (route.market.status === 'pending') push({ name: 'my-markets' })
            else push({ name: 'detail', marketId: route.market.id })
          }}
          onBack={back}
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
          onSelectMarket={(marketId) => push({ name: 'detail', marketId })}
          onDeposit={() => push({ name: 'wallet', tab: 'deposit' })}
          onWithdraw={() => push({ name: 'wallet', tab: 'withdraw' })}
        />
      ) : null}
      {route.name === 'profile' ? (
        <ConnectedProfileScreen
          account={mappedAccount ?? GUEST_ACCOUNT}
          accountState={accountState === 'ready' ? 'ready' : 'unauthenticated'}
          userId={session.user?.id}
          onBack={back}
          onMenu={(id) => {
            if (id === 'events') push({ name: 'my-markets' })
            else if (id === 'moderation' && isAdmin) push({ name: 'moderation' })
            else if (id === 'wallet') push({ name: 'wallet', tab: 'deposit' })
            else if (id === 'help') push({ name: 'help' })
            else if (id === 'public' && session.user?.id) openCreator(session.user.id)
          }}
        />
      ) : null}
      {route.name === 'my-markets' ? (
        <ConnectedMyMarketsScreen
          userId={session.user?.id}
          onBack={back}
          onOpenMarket={(marketId) => push({ name: 'detail', marketId })}
        />
      ) : null}
      {route.name === 'moderation' ? (
        <ConnectedModerationScreen
          enabled={isAdmin}
          onBack={back}
          onOpenMarket={(marketId) => push({ name: 'detail', marketId })}
        />
      ) : null}
      {route.name === 'help' ? <HelpScreen onBack={back} /> : null}
      {route.name === 'wallet' ? (
        <WalletScreen
          account={mappedAccount}
          tab={route.tab}
          onBack={back}
          onTabChange={(tab: WalletTab) => push({ name: 'wallet', tab })}
        />
      ) : null}
      {route.name === 'public-profile' ? (
        <ConnectedPublicProfileScreen
          userId={route.userId}
          onBack={back}
          onOpenMarket={(marketId) => push({ name: 'detail', marketId })}
        />
      ) : null}
      {route.name === 'detail' ? (
        <ConnectedMarketDetailScreen
          marketId={route.marketId}
          isAdmin={isAdmin}
          userId={session.user?.id}
          availableTon={availableTon}
          botUsername={botUsername}
          onBack={back}
          onOwnPrice={(side) => push({ name: 'own-price', marketId: route.marketId, side })}
          onCreatorClick={(creatorId) => openCreator(creatorId)}
        />
      ) : null}
      {route.name === 'own-price' ? (
        <ConnectedOwnPriceScreen
          marketId={route.marketId}
          initialSide={route.side}
          availableTon={availableTon}
          userId={session.user?.id}
          onBack={back}
        />
      ) : null}
    </div>
  )
}
