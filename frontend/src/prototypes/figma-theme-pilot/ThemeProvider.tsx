import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from 'react'

type Theme = 'dark' | 'light'
const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void } | null>(null)
const readTheme = (): Theme => new URLSearchParams(location.search).get('theme') === 'light' ? 'light' : 'dark'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, updateTheme] = useState<Theme>(readTheme)
  useLayoutEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => {
    const sync = () => updateTheme(readTheme())
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])
  function setTheme(next: Theme) {
    const url = new URL(location.href)
    url.searchParams.set('theme', next)
    history.replaceState(history.state, '', url)
    updateTheme(next)
  }
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('ThemeProvider is required')
  return value
}
