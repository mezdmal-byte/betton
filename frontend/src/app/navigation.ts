import type { MarketOut } from '../api/types'
import type { OutcomeSide } from '../types/market'

export type TabName = 'markets' | 'create' | 'portfolio'

export type WalletTab = 'deposit' | 'withdraw'

export type Route =
  | { name: 'markets' }
  | { name: 'create' }
  | { name: 'create-result'; market: MarketOut }
  | { name: 'portfolio' }
  | { name: 'profile' }
  | { name: 'detail'; marketId: number }
  | { name: 'own-price'; marketId: number; side: OutcomeSide }
  | { name: 'moderation' }
  | { name: 'my-markets' }
  | { name: 'public-profile'; userId: number }
  | { name: 'help' }
  | { name: 'wallet'; tab: WalletTab }
  | { name: 'history' }

export const TOP_LEVEL_ROUTES: ReadonlySet<Route['name']> = new Set(['markets', 'create', 'portfolio'])

export function isTopLevel(route: Route): boolean {
  return TOP_LEVEL_ROUTES.has(route.name)
}

export function sameRoute(a: Route, b: Route): boolean {
  if (a.name !== b.name) return false
  if (a.name === 'detail' && b.name === 'detail') return a.marketId === b.marketId
  if (a.name === 'own-price' && b.name === 'own-price') {
    return a.marketId === b.marketId && a.side === b.side
  }
  if (a.name === 'public-profile' && b.name === 'public-profile') return a.userId === b.userId
  if (a.name === 'wallet' && b.name === 'wallet') return a.tab === b.tab
  if (a.name === 'create-result' && b.name === 'create-result') return a.market.id === b.market.id
  return true
}

export function pushRoute(stack: Route[], next: Route): Route[] {
  const current = stack[stack.length - 1]
  if (current && sameRoute(current, next)) return stack
  if (current?.name === 'wallet' && next.name === 'wallet') {
    return [...stack.slice(0, -1), next]
  }
  return [...stack, next]
}

export function resetToTab(tab: TabName): Route[] {
  return [{ name: tab }]
}

export function goBack(stack: Route[]): Route[] {
  if (stack.length <= 1) return [{ name: 'markets' }]
  return stack.slice(0, -1)
}

export function currentRoute(stack: Route[]): Route {
  return stack[stack.length - 1] ?? { name: 'markets' }
}

export function showTelegramBackButton(route: Route): boolean {
  return !isTopLevel(route)
}
