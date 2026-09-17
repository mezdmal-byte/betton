import { CloudOff, Inbox, LoaderCircle } from 'lucide-react'
import { Button } from '../components/Button/Button'
import { useT } from '../i18n'
import styles from './SystemStateScreen.module.css'

export type SystemStateKind = 'loading' | 'network' | 'empty'
export type SystemStateScreenProps = {
  kind: SystemStateKind
  onRetry?: () => void
}

export function SystemStateScreen({ kind, onRetry }: SystemStateScreenProps) {
  const t = useT()
  const content = kind === 'loading'
    ? { icon: <LoaderCircle size={24} aria-hidden="true" />, title: t('loading'), body: t('loading.body') }
    : kind === 'network'
      ? { icon: <CloudOff size={24} aria-hidden="true" />, title: t('err.request'), body: t('err.requestBody') }
      : { icon: <Inbox size={24} aria-hidden="true" />, title: t('feed.emptyTitle'), body: t('feed.emptyBody') }

  return (
    <div className={styles.screen}>
      <header className={styles.header}><div className={styles.brand}>Bet<span>TON</span></div></header>
      <main className={styles.main}>
        <section className={styles.card}>
          <span className={`${styles.icon} ${kind === 'loading' ? styles.loading : ''}`}>{content.icon}</span>
          <h1>{content.title}</h1>
          <p>{content.body}</p>
          {kind === 'network' && onRetry ? <Button onClick={onRetry}>{t('retry')}</Button> : null}
        </section>
      </main>
    </div>
  )
}
