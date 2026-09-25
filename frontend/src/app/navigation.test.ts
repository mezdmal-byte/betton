import { describe, expect, it } from 'vitest'
import {
  currentRoute,
  goBack,
  isTopLevel,
  pushRoute,
  resetToTab,
  sameRoute,
  showTelegramBackButton,
  type Route,
} from './navigation'

const markets: Route = { name: 'markets' }
const create: Route = { name: 'create' }
const portfolio: Route = { name: 'portfolio' }
const profile: Route = { name: 'profile' }
const notifications: Route = { name: 'notifications' }
const walletDeposit: Route = { name: 'wallet', tab: 'deposit' }
const walletWithdraw: Route = { name: 'wallet', tab: 'withdraw' }
const publicProfile: Route = { name: 'public-profile', userId: 7 }
const myMarkets: Route = { name: 'my-markets' }
const detail: Route = { name: 'detail', marketId: 42 }
const ownPrice: Route = { name: 'own-price', marketId: 42, side: 'a' }
const help: Route = { name: 'help' }
const history: Route = { name: 'history' }

describe('navigation stack', () => {
  it('returns to the actual previous screen, not always Markets', () => {
    const profileFlow = pushRoute(pushRoute([markets], profile), walletDeposit)
    expect(currentRoute(goBack(profileFlow))).toEqual(profile)
    expect(currentRoute(goBack(pushRoute(pushRoute([markets], profile), publicProfile)))).toEqual(profile)

    const mine = pushRoute(pushRoute(pushRoute([markets], profile), myMarkets), detail)
    expect(currentRoute(goBack(mine))).toEqual(myMarkets)
    expect(currentRoute(goBack(goBack(mine)))).toEqual(profile)

    const fromDetail = pushRoute(pushRoute([markets], detail), ownPrice)
    expect(currentRoute(goBack(fromDetail))).toEqual(detail)

    const helpFlow = pushRoute(pushRoute(pushRoute([portfolio], profile), help), help)
    expect(currentRoute(goBack(pushRoute(pushRoute([portfolio], profile), help)))).toEqual(profile)
    expect(helpFlow.length).toBeGreaterThan(0)

    const historyFlow = pushRoute(pushRoute([markets], profile), history)
    expect(currentRoute(goBack(historyFlow))).toEqual(profile)
    expect(showTelegramBackButton(history)).toBe(true)
    expect(showTelegramBackButton(portfolio)).toBe(false)
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
  })
})
