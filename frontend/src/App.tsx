import { QueryClientProvider } from '@tanstack/react-query'
import { ConnectedApp } from './app/ConnectedApp'
import { createQueryClient } from './api/query'
import { I18nProvider } from './i18n'
import { ThemeProvider } from './theme/ThemeProvider'
import styles from './App.module.css'
import { readVisualVariant, VisualV1Provider } from './visualV1/VisualV1Context'
import v1 from './visualV1/VisualV1.module.css'

const queryClient = createQueryClient()

export default function App() {
  const visualV1 = readVisualVariant(window.location.search) === 'v1'
  return (
    <VisualV1Provider enabled={visualV1}>
    <I18nProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <div className={`${styles.app} ${visualV1 ? v1.root : ''}`} data-visual={visualV1 ? 'v1' : 'legacy'}>
            <ConnectedApp />
          </div>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nProvider>
    </VisualV1Provider>
  )
}
