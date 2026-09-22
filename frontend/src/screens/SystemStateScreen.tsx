import { CloudOff, Inbox, LoaderCircle, LogIn } from 'lucide-react'
import { Button } from '../components/Button/Button'
import { useT } from '../i18n'
import styles from './SystemStateScreen.module.css'

export type SystemStateKind = 'loading' | 'network' | 'empty' | 'auth'
export type SystemStateScreenProps = { kind: SystemStateKind; onRetry?: () => void }

export function SystemStateScreen({ kind, onRetry }: SystemStateScreenProps) {
  const t = useT()
  const content = kind === 'loading'
    ? { icon: <LoaderCircle size={26} aria-hidden="true" />, title: t('market.processing'), body: t('loading.body') }
    : kind === 'network'
      ? { icon: <CloudOff size={26} aria-hidden="true" />, title: t('err.request'), body: t('err.requestBody') }
      : kind === 'auth'
        ? { icon: <LogIn size={26} aria-hidden="true" />, title: t('err.openInTg'), body: t('err.openInTgBody') }
        : { icon: <Inbox size={26} aria-hidden="true" />, title: t('feed.emptyTitle'), body: t('feed.emptyBody') }

  return (
    <div className={styles.screen}>
      <header className={styles.header}><strong>Bet<span>TON</span></strong></header>
      <main className={styles.main}>
        <span className={`${styles.icon} ${kind === 'loading' ? styles.loading : ''}`}>{content.icon}</span>
        <h1>{content.title}</h1>
        <p>{content.body}</p>
        {kind === 'network' && onRetry ? <Button onClick={onRetry}>{t('retry')}</Button> : null}
      </main>
    </div>
  )
}
