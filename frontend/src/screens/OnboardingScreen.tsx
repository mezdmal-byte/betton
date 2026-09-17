import { ArrowRight, BookOpen, Percent, UsersRound } from 'lucide-react'
import { Button } from '../components/Button/Button'
import { useT } from '../i18n'
import styles from './OnboardingScreen.module.css'

export type OnboardingScreenProps = { onContinue?: () => void }

export function OnboardingScreen({ onContinue }: OnboardingScreenProps) {
  const t = useT()
  const benefits = [
    { icon: <UsersRound size={18} aria-hidden="true" />, title: 'P2P', body: t('help.p2p') },
    { icon: <BookOpen size={18} aria-hidden="true" />, title: t('event.book'), body: t('help.book') },
    { icon: <Percent size={18} aria-hidden="true" />, title: t('create.feesSummary'), body: t('help.fee') },
  ]

  return (
    <div className={styles.screen}>
      <main className={styles.main}>
        <section className={styles.intro}>
          <div className={styles.mark} aria-hidden="true">B</div>
          <div className={styles.brand}>Bet<span>TON</span></div>
          <span className={styles.eyebrow}>P2P · TON</span>
          <p>{t('help.lead')}</p>
        </section>

        <section className={styles.benefits}>
          {benefits.map((item) => (
            <article key={item.title} className={styles.benefit}>
              <span className={styles.icon}>{item.icon}</span>
              <div><strong>{item.title}</strong><p>{item.body}</p></div>
            </article>
          ))}
        </section>
      </main>

      <footer className={styles.footer}>
        <Button size="md" onClick={onContinue}>{t('nav.feed')} <ArrowRight size={18} aria-hidden="true" /></Button>
        <small>{t('create.feesFee')}</small>
      </footer>
    </div>
  )
}
