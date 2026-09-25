import { CircleHelp, Link2 } from 'lucide-react'
import { useState } from 'react'
import { copyShareLink, shareExternally } from '../api/share'
import type { MarketOut } from '../api/types'
import type { NavId } from '../components/BottomNavigation/BottomNavigation'
import { BottomNavigation } from '../components/BottomNavigation/BottomNavigation'
import { Button } from '../components/Button/Button'
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
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'fail'>('idle')
  const pending = market.status === 'pending'
  const rejected = market.status === 'rejected'
  const resolved = market.status === 'resolved'
  const cancelled = market.status === 'cancelled'
  const closed = market.status === 'closed'
  const unlisted = market.visibility === 'unlisted'
  const showShare = Boolean(shareLink) && !pending && !rejected
  const title = pending
    ? 'На модерации'
    : rejected
      ? 'Рынок отклонён'
      : resolved
        ? 'Рынок рассчитан'
        : cancelled
          ? 'Рынок отменён'
          : closed
            ? 'Рынок закрыт'
            : unlisted
              ? 'Unlisted рынок создан'
              : 'Публичный рынок создан'

  const statusLine = pending
    ? 'Статус · Pending moderation'
    : rejected
      ? 'Статус · Rejected'
      : resolved
        ? 'Статус · Resolved'
        : cancelled
          ? 'Статус · Voided / cancelled'
          : closed
            ? 'Статус · Closed'
            : 'Статус · Open'

  const accentTone = rejected || cancelled ? 'danger' : pending || closed ? 'warning' : 'success'

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.contextRow}>
          <button type="button" onClick={onBack}>← Назад</button>
          <span className={styles.brand}><b>Bet</b><b>TON</b></span>
        </div>
        <h1>{title}</h1>
      </header>

      <main className={styles.body}>
        <section className={styles.details}>
          <div className={styles['tone_' + accentTone]}>Market ID · M-{market.id}</div>
          <div>{statusLine}</div>
          <div>Видимость · {unlisted ? 'Unlisted' : 'Public'}</div>
          <div>
            {pending
              ? 'Не виден в публичной ленте'
              : rejected
                ? market.rejection_reason || 'Требуется правка перед повторной отправкой'
                : cancelled
                  ? market.cancellation_reason || 'Торги остановлены, расчёт отменён'
                  : market.status === 'open'
                    ? 'Торги P2P открыты'
                    : 'Торги завершены'}
          </div>
        </section>

        {pending ? (
          <section className={styles.notice}>
            <CircleHelp size={16} strokeWidth={1.7} aria-hidden="true" />
            <p>Обычно проверка занимает до 24 часов. Статус можно отслеживать в «Мои рынки».</p>
          </section>
        ) : market.status === 'open' ? (
          <section className={styles.notice}>
            <CircleHelp size={16} strokeWidth={1.7} aria-hidden="true" />
            <p>
              {unlisted
                ? 'Рынок доступен только по точной ссылке.'
                : 'Рынок доступен в поиске, категории и публичной ленте.'}
            </p>
          </section>
        ) : null}

        {showShare ? (
          <section className={styles.share}>
            <div className={styles.shareTitle}>
              <Link2 size={16} aria-hidden="true" />
              <span>{t('share.linkTitle')}</span>
            </div>
            <input readOnly value={shareLink} onFocus={(event) => event.currentTarget.select()} />
            {copyState === 'ok' ? <p className={styles.successText}>{t('share.copied')}</p> : null}
            {copyState === 'fail' ? <p className={styles.errorText}>{t('share.fail')}</p> : null}
            <div className={styles.shareActions}>
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
                  if (!shareExternally(shareLink)) setCopyState('fail')
                }}
              >
                {t('share.action')}
              </Button>
            </div>
          </section>
        ) : null}

        <div className={styles.actions}>
          <Button fullWidth onClick={onOpen}>
            {pending || rejected ? 'Мои рынки' : 'Открыть рынок'}
          </Button>
          <Button variant="secondary" fullWidth onClick={onToFeed}>
            {t('create.toFeed')}
          </Button>
        </div>
      </main>

      <BottomNavigation active="create" onChange={onNavChange} />
    </div>
  )
}
