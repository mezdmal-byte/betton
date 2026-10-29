import { createContext, useContext, type ReactNode } from 'react'

export type VisualV1Actions = {
  activeMyEvents?: boolean
  onOpenNotifications?: () => void
  onOpenMyEvents?: () => void
  onOpenProfile?: () => void
  onOpenHelp?: () => void
  onOpenSettings?: () => void
  onOpenGuarantors?: () => void
  onOpenHistory?: () => void
}
const EnabledContext = createContext(false)
const ActionsContext = createContext<VisualV1Actions>({})
export function readVisualVariant(search: string): 'v1' | 'legacy' {
  return new URLSearchParams(search).get('ui') === 'legacy' ? 'legacy' : 'v1'
}
export function VisualV1Provider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <EnabledContext.Provider value={enabled}>{children}</EnabledContext.Provider>
}
export const VisualV1ActionsProvider = ActionsContext.Provider
export function useVisualV1() { return useContext(EnabledContext) }
export function useVisualV1Actions() { return useContext(ActionsContext) }
