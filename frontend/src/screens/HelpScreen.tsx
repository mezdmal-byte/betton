import { ChevronLeft } from 'lucide-react'
import { useT } from '../i18n'
import { IconButton } from '../components/IconButton/IconButton'
import styles from './HelpScreen.module.css'

export type HelpScreenProps = {
  onBack?: () => void
}

export function HelpScreen({ onBack }: HelpScreenProps) {
  const t = useT()
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label={t('back')} size="md" onClick={onBack}>
          <ChevronLeft size={22} />
        </IconButton>
        <strong>{t('help.title')}</strong>
      </header>
      <div className={styles.body}>
        <p>{t('help.lead')}</p>
        <p>{t('help.p2p')}</p>
        <p>{t('help.book')}</p>
        <p>{t('help.quick')}</p>
        <p>{t('help.ownPrice')}</p>
        <p>{t('help.fee')}</p>
        <p>{t('help.cancel')}</p>
        <details className={styles.details}>
          <summary>{t('create.feesSummary')}</summary>
          <p>{t('help.creatorShare')}</p>
        </details>
      </div>
    </div>
  )
}
