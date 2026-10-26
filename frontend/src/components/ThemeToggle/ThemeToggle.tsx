import { Moon, Sun } from 'lucide-react'
import { useT } from '../../i18n'
import { cx } from '../../lib/cx'
import { useTheme } from '../../theme/ThemeProvider'
import styles from './ThemeToggle.module.css'

export type ThemeToggleProps = { className?: string }
export function ThemeToggle({className}:ThemeToggleProps) {
  const t=useT()
  const {scheme,setScheme}=useTheme()
  return <button type="button" className={cx(styles.root,className)} aria-label={t('theme.label')} aria-pressed={scheme==='dark'} title={t(scheme==='dark'?'theme.light':'theme.dark')} onClick={()=>setScheme(scheme==='dark'?'light':'dark')}>
    {scheme==='dark'?<Sun size={20}/>:<Moon size={20}/>}
  </button>
}
