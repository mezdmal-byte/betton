import { useT } from '../../i18n'
import { cx } from '../../lib/cx'
import { useTheme } from '../../theme/ThemeProvider'
import styles from './ThemeToggle.module.css'

export type ThemeToggleProps = {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const t = useT()
  const { scheme, setScheme } = useTheme()

  return (
    <div className={cx(styles.root, className)} role="group" aria-label={t('theme.label')}>
      <button
        type="button"
        className={cx(styles.dark, scheme === 'dark' && styles.active)}
        aria-pressed={scheme === 'dark'}
        onClick={() => setScheme('dark')}
      >
        {t('theme.dark')}
      </button>
      <button
        type="button"
        className={cx(styles.light, scheme === 'light' && styles.active)}
        aria-pressed={scheme === 'light'}
        onClick={() => setScheme('light')}
      >
        {t('theme.light')}
      </button>
    </div>
  )
}
