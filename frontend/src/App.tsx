import { QueryClientProvider } from '@tanstack/react-query'
import { ConnectedApp } from './app/ConnectedApp'
import { createQueryClient } from './api/query'
import { I18nProvider } from './i18n'
import { ThemeProvider } from './theme/ThemeProvider'
import styles from './App.module.css'

const queryClient = createQueryClient()

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <div className={styles.app}>
            <ConnectedApp />
          </div>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}
