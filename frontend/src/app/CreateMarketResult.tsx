import { Button } from '../components/Button/Button'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
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
  const pending = market.status === 'pending'
  const unlisted = market.visibility === 'unlisted'
  return (
    <div className={styles.overlay}>
      <div className={styles.result}>
        <StatusMessage
          title={pending ? 'Отправлено на проверку' : unlisted ? 'Событие открыто по ссылке' : 'Событие создано'}
        >
          {pending
            ? 'Рынок появится в ленте после одобрения модератором. Залог для P2P не нужен.'
            : unlisted
              ? 'Сохраните ссылку. Доступ идёт через существующий share_token / X-Market-Share-Token.'
              : 'Событие создано.'}
        </StatusMessage>
        {unlisted && market.share_token ? (
          <StatusMessage title="Share token">{market.share_token}</StatusMessage>
        ) : null}
        {shareLink ? <StatusMessage title="Ссылка">{shareLink}</StatusMessage> : null}
        <Button fullWidth onClick={onOpen}>
          Открыть событие
        </Button>
        {shareLink && onCopy ? (
          <Button variant="secondary" fullWidth onClick={onCopy}>
            Скопировать ссылку
          </Button>
        ) : null}
        <Button variant="ghost" fullWidth onClick={onBack}>
          К ленте
        </Button>
      </div>
    </div>
  )
}
