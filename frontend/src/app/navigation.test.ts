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
const walletDeposit: Route = { name: 'wallet', tab: 'deposit' }
const walletWithdraw: Route = { name: 'wallet', tab: 'withdraw' }
const publicProfile: Route = { name: 'public-profile', userId: 7 }
const myMarkets: Route = { name: 'my-markets' }
const detail: Route = { name: 'detail', marketId: 42 }
const ownPrice: Route = { name: 'own-price', marketId: 42, side: 'a' }
const help: Route = { name: 'help' }

describe('navigation stack', () => {
  it('returns to the actual previous screen, not always Markets', () => {
    const profileFlow = pushRoute(pushRoute([markets], profile), walletDeposit)
    expect(currentRoute(goBack(profileFlow))).toEqual(profile)
    expect(currentRoute(goBack(pushRoute(pushRoute([markets], profile), publicProfile)))).toEqual(profile)

    const mine = pushRoute(pushRoute(pushRoute([markets], profile), myMarkets), detail)
    expect(currentRoute(goBack(mine))).toEqual(myMarkets)

    const fromDetail = pushRoute(pushRoute([markets], detail), ownPrice)
    expect(currentRoute(goBack(fromDetail))).toEqual(detail)

    const helpFlow = pushRoute(pushRoute(pushRoute([portfolio], profile), help), help)
    expect(currentRoute(goBack(pushRoute(pushRoute([portfolio], profile), help)))).toEqual(profile)
    expect(helpFlow.length).toBeGreaterThan(0)
  })

  it('resets to a top-level tab without leftover secondary screens', () => {
    const nested = pushRoute(pushRoute([markets], profile), walletDeposit)
    expect(resetToTab('portfolio')).toEqual([portfolio])
    expect(isTopLevel(currentRoute(nested))).toBe(false)
    expect(isTopLevel(create)).toBe(true)
  })

  it('replaces wallet tab in place and hides Telegram Back on roots', () => {
    const stack = pushRoute(pushRoute([markets], profile), walletDeposit)
    const switched = pushRoute(stack, walletWithdraw)
    expect(switched).toEqual([markets, profile, walletWithdraw])
    expect(showTelegramBackButton(detail)).toBe(true)
    expect(showTelegramBackButton(markets)).toBe(false)
    expect(sameRoute(detail, { name: 'detail', marketId: 41 })).toBe(false)
  })
})
