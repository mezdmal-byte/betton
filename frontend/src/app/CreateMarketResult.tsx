import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { copyShareLink, shareExternally } from '../api/share'
import type { MarketOut } from '../api/types'
import { Button } from '../components/Button/Button'
import { IconButton } from '../components/IconButton/IconButton'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { useT } from '../i18n'
import styles from './CreateMarketResult.module.css'

export function CreateMarketResult({
  market,
  shareLink,
  onOpen,
  onBack,
  onToFeed,
}: {
  market: MarketOut
  shareLink: string
  onOpen: () => void
  onBack: () => void
  onToFeed: () => void
}) {
  const t = useT()
  const pending = market.status === 'pending'
  const unlisted = market.visibility === 'unlisted'
  const showShare = Boolean(shareLink) && (unlisted || !pending)
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle')
  const title = pending
    ? t('create.resultPendingTitle')
    : unlisted
      ? t('create.resultUnlistedTitle')
      : t('create.resultCreatedTitle')
  const body = pending
    ? t('create.resultPendingBody')
    : unlisted
      ? t('create.resultUnlistedBody')
      : t('create.resultCreatedBody')

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label={t('back')} size="md" onClick={onBack}>
          <ChevronLeft size={22} />
        </IconButton>
        <strong>{title}</strong>
      </header>
      <div className={styles.body}>
        <StatusMessage title={title}>{body}</StatusMessage>
        {showShare ? (
          <section className={styles.share}>
            <span className={styles.label}>{t('share.linkTitle')}</span>
            <input className={styles.link} readOnly value={shareLink} onFocus={(event) => event.currentTarget.select()} />
            {copyState === 'ok' ? <p className={styles.note}>{t('share.copied')}</p> : null}
            {copyState === 'fail' ? <p className={styles.error}>{t('share.fail')}</p> : null}
            <div className={styles.row}>
              <Button
                variant="secondary"
                onClick={() => {
                  void copyShareLink(shareLink).then((ok) => setCopyState(ok ? 'ok' : 'fail'))
                }}
              >
                {t('create.copyLink')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const ok = shareExternally(shareLink)
                  if (!ok) setCopyState('fail')
                }}
              >
                {t('share.action')}
              </Button>
            </div>
          </section>
        ) : null}
        <Button fullWidth onClick={onOpen}>
          {t('create.openEvent')}
        </Button>
        <Button variant="ghost" fullWidth onClick={onToFeed}>
          {t('create.toFeed')}
        </Button>
      </div>
    </div>
  )
}
