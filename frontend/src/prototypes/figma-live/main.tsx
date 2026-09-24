import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '../../api/query'
import { ThemeProvider } from '../figma-theme-pilot/ThemeProvider'
import { LivePilot } from './LivePilot'
import '../figma-theme-pilot/tokens.css'
import '../figma-theme-pilot/Pilot.module.css'

const queryClient = createQueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LivePilot />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
