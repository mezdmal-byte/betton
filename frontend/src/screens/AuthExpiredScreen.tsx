import { RefreshCw } from 'lucide-react'
import { Button } from '../components/Button/Button'
import { useT } from '../i18n'
import styles from './AuthExpiredScreen.module.css'

export type AuthExpiredScreenProps = { onClose?: () => void }

export function AuthExpiredScreen({ onClose }: AuthExpiredScreenProps) {
  const t = useT()
  return (
    <div className={styles.screen}>
      <main className={styles.main}>
        <div className={styles.mark}>BetTON</div>
        <span className={styles.icon}><RefreshCw size={24} aria-hidden="true" /></span>
        <div className={styles.copy}><h1>{t('auth.expiredTitle')}</h1><p>{t('auth.expiredBody')}</p></div>
        {onClose ? <Button onClick={onClose}>{t('close')}</Button> : null}
      </main>
    </div>
  )
}
