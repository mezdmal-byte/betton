import { QueryClientProvider } from '@tanstack/react-query'
import { ConnectedApp } from './app/ConnectedApp'
import { createQueryClient } from './api/query'
import styles from './App.module.css'

const queryClient = createQueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className={styles.app}>
        <ConnectedApp />
      </div>
    </QueryClientProvider>
  )
}
