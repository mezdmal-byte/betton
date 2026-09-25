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
  clearStoredTheme,
  persistTheme,
  readStoredTheme,
  resolveBootColorScheme,
  resolveSystemColorScheme,
  syncTelegramChrome,
  subscribeThemeChanges,
  type ColorScheme,
  type ThemePreference,
} from './theme'

type ThemeContextValue = {
  scheme: ColorScheme
  preference: ThemePreference
  setScheme: (scheme: ColorScheme) => void
  setPreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  scheme: 'dark',
  preference: 'system',
  setScheme: () => undefined,
  setPreference: () => undefined,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const initialStored = readStoredTheme()
  const [preference, setPreferenceState] = useState<ThemePreference>(
    () => initialStored ?? 'system',
  )
  const [scheme, setSchemeState] = useState<ColorScheme>(() => resolveBootColorScheme())

  useEffect(() => {
    applyDocumentTheme(scheme, null)
    syncTelegramChrome(scheme)
  }, [scheme])

  useEffect(
    () =>
      subscribeThemeChanges(() => {
        if (preference !== 'system') return
        setSchemeState(resolveSystemColorScheme())
      }),
    [preference],
  )

  const value = useMemo<ThemeContextValue>(() => {
    const setPreference = (next: ThemePreference) => {
      setPreferenceState(next)
      if (next === 'system') {
        clearStoredTheme()
        setSchemeState(resolveSystemColorScheme())
        return
      }
      persistTheme(next)
      setSchemeState(next)
    }

    return {
      scheme,
      preference,
      setPreference,
      setScheme: (next) => setPreference(next),
    }
  }, [scheme, preference])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
