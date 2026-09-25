import { cx } from '../../lib/cx'
import { useTheme } from '../../theme/ThemeProvider'
import styles from './ThemeToggle.module.css'

export type ThemeToggleProps = {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { scheme, setScheme } = useTheme()

  return (
    <div className={cx(styles.root, className)} role="group" aria-label="Theme">
      <button
        type="button"
        className={cx(styles.dark, scheme === 'dark' && styles.active)}
        aria-pressed={scheme === 'dark'}
        onClick={() => setScheme('dark')}
      >
        Dark
      </button>
      <button
        type="button"
        className={cx(styles.light, scheme === 'light' && styles.active)}
        aria-pressed={scheme === 'light'}
        onClick={() => setScheme('light')}
      >
        Light
      </button>
    </div>
  )
}
