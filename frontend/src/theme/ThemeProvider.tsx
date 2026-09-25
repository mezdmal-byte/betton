import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  applyDocumentTheme,
  persistTheme,
  readStoredTheme,
  resolveBootColorScheme,
  syncTelegramChrome,
  subscribeThemeChanges,
  type ColorScheme,
} from './theme'

type ThemeContextValue = {
  scheme: ColorScheme
  setScheme: (scheme: ColorScheme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  scheme: 'dark',
  setScheme: () => undefined,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setSchemeState] = useState<ColorScheme>(() => resolveBootColorScheme())

  useEffect(() => {
    // Dark A / Light C are canonical; Telegram themeParams do not replace semantic colors.
    applyDocumentTheme(scheme, null)
    syncTelegramChrome(scheme)
  }, [scheme])

  useEffect(
    () =>
      subscribeThemeChanges(() => {
        if (readStoredTheme()) return
        setSchemeState(resolveBootColorScheme())
      }),
    [],
  )

  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      setScheme: (next) => {
        persistTheme(next)
        setSchemeState(next)
      },
    }),
    [scheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
