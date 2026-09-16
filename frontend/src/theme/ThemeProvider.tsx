import { useEffect, type ReactNode } from 'react'
import { applyDocumentTheme, resolveBootColorScheme, subscribeThemeChanges } from './theme'
import { getTelegramWebApp } from '../telegram/webapp'

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const apply = () => {
      const webApp = getTelegramWebApp()
      applyDocumentTheme(resolveBootColorScheme(), webApp?.themeParams)
    }
    apply()
    return subscribeThemeChanges(apply)
  }, [])
  return children
}
