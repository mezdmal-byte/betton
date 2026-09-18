import { useState } from 'react'
import { Check, ChevronLeft, Link2 } from 'lucide-react'
import { copyShareLink, shareExternally } from '../api/share'
import type { MarketOut } from '../api/types'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
import { IconButton } from '../components/IconButton/IconButton'
import { useT } from '../i18n'
import styles from './CreateMarketResult.module.css'

export function CreateMarketResult({
  market,
  shareLink,
  onOpen,
  onBack,
  onToFeed,
  onNavChange,
}: {
  market: MarketOut
  shareLink: string
  onOpen: () => void
  onBack: () => void
  onToFeed: () => void
  onNavChange?: (id: NavId) => void
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
  const category =
    market.category === 'sport'
      ? t('cat.sport')
      : market.category === 'politics'
        ? t('cat.politics')
        : market.category === 'crypto'
          ? t('cat.crypto')
          : t('cat.other')

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label={t('back')} size="md" onClick={onBack}>
          <ChevronLeft size={22} />
        </IconButton>
        <strong>{t('create.title')}</strong>
      </header>

      <div className={styles.body}>
        <section className={styles.hero}>
          <span className={styles.successIcon} aria-hidden="true">
            <Check size={24} strokeWidth={2.2} />
          </span>
          <h1>{title}</h1>
          <p>{body}</p>
          {pending ? <span className={styles.pendingBadge}>{t('status.pending')}</span> : null}
        </section>

        <section className={styles.marketCard}>
          <span>{category}</span>
          <strong>{market.question}</strong>
          <small>{unlisted ? t('type.unlisted') : pending ? t('status.pending') : t('status.open')}</small>
        </section>

        {showShare ? (
          <section className={styles.share}>
            <div className={styles.shareTitle}>
              <Link2 size={16} aria-hidden="true" />
              <span>{t('share.linkTitle')}</span>
            </div>
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
      </div>

      <div className={styles.actions}>
        <Button fullWidth onClick={onOpen}>
          {pending ? t('profile.events') : t('create.openEvent')}
        </Button>
        <Button variant="ghost" fullWidth onClick={onToFeed}>
          {t('create.toFeed')}
        </Button>
      </div>
      <BottomNavigation active="create" onChange={onNavChange} />
    </div>
  )
}
