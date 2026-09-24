import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Pilot } from './Pilot'
import { ThemeProvider } from './ThemeProvider'
import './tokens.css'

createRoot(document.getElementById('root')!).render(<StrictMode><ThemeProvider><Pilot /></ThemeProvider></StrictMode>)
