import { RefreshCw } from 'lucide-react'
import { Button } from '../components/Button/Button'
import { useT } from '../i18n'
import styles from './AuthExpiredScreen.module.css'

export type AuthExpiredScreenProps = {
  onClose?: () => void
}

export function AuthExpiredScreen({ onClose }: AuthExpiredScreenProps) {
  const t = useT()
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.brand}>Bet<span>TON</span></div>
      </header>
      <main className={styles.main}>
        <section className={styles.card}>
          <span className={styles.icon}><RefreshCw size={24} aria-hidden="true" /></span>
          <div className={styles.copy}>
            <h1>{t('auth.expiredTitle')}</h1>
            <p>{t('auth.expiredBody')}</p>
          </div>
          {onClose ? <Button onClick={onClose}>{t('close')}</Button> : null}
        </section>
      </main>
    </div>
  )
}
