import { Button } from '../components/Button/Button'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { useT } from '../i18n'
import type { MarketOut } from '../api/types'
import styles from './ConnectedApp.module.css'

export function CreateMarketResult({
  market,
  shareLink,
  onOpen,
  onBack,
  onCopy,
}: {
  market: MarketOut
  shareLink: string
  onOpen: () => void
  onBack: () => void
  onCopy?: () => void
}) {
  const t = useT()
  const pending = market.status === 'pending'
  const unlisted = market.visibility === 'unlisted'
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
    <div className={styles.overlay}>
      <div className={styles.result}>
        <StatusMessage title={title}>{body}</StatusMessage>
        {shareLink ? <StatusMessage title={t('share')}>{shareLink}</StatusMessage> : null}
        <Button fullWidth onClick={onOpen}>
          {t('create.openEvent')}
        </Button>
        {shareLink && onCopy ? (
          <Button variant="secondary" fullWidth onClick={onCopy}>
            {t('create.copyLink')}
          </Button>
        ) : null}
        <Button variant="ghost" fullWidth onClick={onBack}>
          {t('create.toFeed')}
        </Button>
      </div>
    </div>
  )
}
