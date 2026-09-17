import { ArrowRight, Gauge, ListPlus, Percent } from 'lucide-react'
import { Button } from '../components/Button/Button'
import { useT } from '../i18n'
import styles from './OnboardingScreen.module.css'

export type OnboardingScreenProps = {
  onContinue?: () => void
}

export function OnboardingScreen({ onContinue }: OnboardingScreenProps) {
  const t = useT()
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.brand}>Bet<span>TON</span></div>
        <span className={styles.pill}>P2P · TON</span>
      </header>

      <main className={styles.body}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>BetTON</span>
            <h1>P2P</h1>
            <p>{t('help.lead')}</p>
          </div>
          <div className={styles.quotePreview} aria-hidden="true">
            <div className={styles.quoteA}>
              <span>A</span>
              <strong>1.82</strong>
              <small>320 TON</small>
            </div>
            <div className={styles.quoteB}>
              <span>B</span>
              <strong>2.18</strong>
              <small>190 TON</small>
            </div>
          </div>
        </section>

        <section className={styles.steps}>
          <article className={styles.step}>
            <span className={styles.stepIcon}><Gauge size={18} aria-hidden="true" /></span>
            <div><strong>{t('market.betCta')}</strong><p>{t('help.quick')}</p></div>
          </article>
          <article className={styles.step}>
            <span className={styles.stepIcon}><ListPlus size={18} aria-hidden="true" /></span>
            <div><strong>{t('market.ownOdds')}</strong><p>{t('help.ownPrice')}</p></div>
          </article>
          <article className={styles.step}>
            <span className={styles.stepIcon}><Percent size={18} aria-hidden="true" /></span>
            <div><strong>{t('create.feesSummary')}</strong><p>{t('help.fee')}</p></div>
          </article>
        </section>
      </main>

      <footer className={styles.footer}>
        <Button size="md" onClick={onContinue}>
          {t('nav.feed')} <ArrowRight size={18} aria-hidden="true" />
        </Button>
      </footer>
    </div>
  )
}
