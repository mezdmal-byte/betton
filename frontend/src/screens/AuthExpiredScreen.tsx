import { Button } from '../components/Button/Button'
import { useT } from '../i18n'
import styles from './AuthExpiredScreen.module.css'
import {useVisualV1} from '../visualV1/VisualV1Context'
import {SystemV1} from '../visualV1/SystemV1'

export type AuthExpiredScreenProps = { onClose?: () => void }

export function AuthExpiredScreen({ onClose }: AuthExpiredScreenProps) {
  const t = useT()
  const visual=useVisualV1()
  if(visual)return <SystemV1 kind="auth-expired" onRetry={onClose} actionLabel="Открыть заново"/>
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1>Сессия истекла</h1>
        <span>BETTON · SYSTEM</span>
      </header>

      <main className={styles.body}>
        <section className={styles.stateCard}>
          <p>{t('auth.expiredBody')}</p>
        </section>
        {onClose ? <Button fullWidth onClick={onClose}>Открыть заново</Button> : null}
      </main>
    </div>
  )
}
