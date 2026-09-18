import { ChevronLeft } from 'lucide-react'
import { useT } from '../i18n'
import { IconButton } from '../components/IconButton/IconButton'
import styles from './HelpScreen.module.css'

export type HelpScreenProps = { onBack?: () => void }

export function HelpScreen({ onBack }: HelpScreenProps) {
  const t = useT()
  const sections = [
    { title: 'BetTON', body: [t('help.lead'), t('help.p2p')] },
    { title: t('event.book'), body: [t('help.book')] },
    { title: t('market.quickTrade'), body: [t('help.quick')] },
    { title: t('market.ownOdds'), body: [t('help.ownPrice')] },
    { title: t('create.feesSummary'), body: [t('help.fee'), t('help.creatorShare')] },
    { title: t('status.cancelledOne'), body: [t('help.cancel')] },
  ]
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label={t('back')} size="md" onClick={onBack}><ChevronLeft size={22} /></IconButton>
        <strong>{t('help.title')}</strong>
      </header>
      <div className={styles.body}>
        {sections.map((section, index) => (
          <details key={section.title} className={styles.details} open={index === 0 || section.title === t('create.feesSummary')}>
            <summary>{section.title}</summary>
            <div className={styles.detailBody}>{section.body.map((text) => <p key={text}>{text}</p>)}</div>
          </details>
        ))}
      </div>
    </div>
  )
}
