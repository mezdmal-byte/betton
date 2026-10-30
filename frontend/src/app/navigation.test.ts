import { describe, expect, it } from 'vitest'
import {
  currentRoute,
  goBack,
  isTopLevel,
  pushRoute,
  resetToTab,
  routesForTabMemory,
  sameRoute,
  showTelegramBackButton,
  type Route,
} from './navigation'

const markets: Route = { name: 'markets' }
const create: Route = { name: 'create' }
const portfolio: Route = { name: 'portfolio' }
const profile: Route = { name: 'profile' }
const profileSettings: Route = { name: 'profile-settings' }
const notifications: Route = { name: 'notifications' }
const walletHome: Route = { name: 'wallet' }
const walletDeposit: Route = { name: 'wallet', tab: 'deposit' }
const walletWithdraw: Route = { name: 'wallet', tab: 'withdraw' }
const publicProfile: Route = { name: 'public-profile', userId: 7 }
const myMarkets: Route = { name: 'my-markets' }
const detail: Route = { name: 'detail', marketId: 42 }
const quickTrade: Route = { name: 'quick-trade', marketId: 42, side: 'a' }
const ownPrice: Route = { name: 'own-price', marketId: 42, side: 'a' }
const help: Route = { name: 'help' }
const history: Route = { name: 'history' }

describe('navigation stack', () => {
  it('keeps unfinished creation but never restores a submitted event as a draft', () => {
    expect(routesForTabMemory('create', [create])).toEqual([create])
    expect(routesForTabMemory('create', [{ name: 'create-result', market: { id: 123 } as Extract<Route, { name: 'create-result' }>['market'] }])).toEqual([create])
    expect(routesForTabMemory('markets', [markets, detail])).toEqual([markets, detail])
  })
  it('returns to the actual previous screen, not always Markets', () => {
    const profileFlow = pushRoute(pushRoute([markets], profile), walletDeposit)
    expect(currentRoute(goBack(profileFlow))).toEqual(profile)
    expect(currentRoute(goBack(pushRoute(pushRoute([markets], profile), publicProfile)))).toEqual(profile)

    const mine = pushRoute(pushRoute(pushRoute([markets], profile), myMarkets), detail)
    expect(currentRoute(goBack(mine))).toEqual(myMarkets)
    expect(currentRoute(goBack(goBack(mine)))).toEqual(profile)

    const quickFromDetail = pushRoute(pushRoute([markets], detail), quickTrade)
    expect(currentRoute(goBack(quickFromDetail))).toEqual(detail)

    const fromDetail = pushRoute(pushRoute([markets], detail), ownPrice)
    expect(currentRoute(goBack(fromDetail))).toEqual(detail)

    const helpFlow = pushRoute(pushRoute(pushRoute([portfolio], profile), help), help)
    expect(currentRoute(goBack(pushRoute(pushRoute([portfolio], profile), help)))).toEqual(profile)
    expect(helpFlow.length).toBeGreaterThan(0)

    const settingsFlow = pushRoute(pushRoute([markets], profile), profileSettings)
    expect(currentRoute(goBack(settingsFlow))).toEqual(profile)

    const historyFlow = pushRoute(pushRoute([markets], profile), history)
    expect(currentRoute(goBack(historyFlow))).toEqual(profile)
    expect(showTelegramBackButton(history)).toBe(true)
    expect(showTelegramBackButton(portfolio)).toBe(false)
  })

  it('opens wallet overview from profile and returns there after visiting deposit/withdraw', () => {
    const profileFlow = pushRoute([profile], walletHome)
    expect(currentRoute(profileFlow)).toEqual(walletHome)
    expect(showTelegramBackButton(walletHome)).toBe(true)
    const depositFlow = pushRoute(profileFlow, walletDeposit)
    expect(depositFlow).toEqual([profile, walletHome, walletDeposit])
    expect(currentRoute(goBack(depositFlow))).toEqual(walletHome)
    const withdrawFlow = pushRoute(depositFlow, walletWithdraw)
    expect(withdrawFlow).toEqual([profile, walletHome, walletWithdraw])
    expect(currentRoute(goBack(withdrawFlow))).toEqual(walletHome)
    expect(currentRoute(goBack(goBack(withdrawFlow)))).toEqual(profile)
  })

  it('resets to a top-level tab without leftover secondary screens', () => {
    const nested = pushRoute(pushRoute([markets], profile), walletDeposit)
    expect(resetToTab('portfolio')).toEqual([portfolio])
    expect(isTopLevel(currentRoute(nested))).toBe(false)
    expect(isTopLevel(create)).toBe(true)
    expect(isTopLevel(profile)).toBe(true)
    expect(isTopLevel(notifications)).toBe(true)
    expect(resetToTab('notifications')).toEqual([notifications])
  })

  it('replaces wallet tab in place and hides Telegram Back on roots', () => {
    const fromProfile = pushRoute(pushRoute([markets], profile), walletDeposit)
    const switchedFromProfile = pushRoute(fromProfile, walletWithdraw)
    expect(switchedFromProfile).toEqual([markets, profile, walletWithdraw])
    expect(currentRoute(goBack(switchedFromProfile))).toEqual(profile)

    const fromPortfolio = pushRoute([portfolio], walletWithdraw)
    const switchedFromPortfolio = pushRoute(fromPortfolio, walletDeposit)
    expect(switchedFromPortfolio).toEqual([portfolio, walletDeposit])
    expect(currentRoute(goBack(switchedFromPortfolio))).toEqual(portfolio)

    expect(showTelegramBackButton(detail)).toBe(true)
    expect(showTelegramBackButton(markets)).toBe(false)
    expect(showTelegramBackButton(profile)).toBe(false)
    expect(showTelegramBackButton(notifications)).toBe(false)
    expect(sameRoute(detail, { name: 'detail', marketId: 41 })).toBe(false)
    expect(sameRoute(quickTrade, { name: 'quick-trade', marketId: 42, side: 'b' })).toBe(false)
  })
})
