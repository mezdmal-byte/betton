import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { listCreatedMarkets } from '../api/account'
import { mapMarketOut } from '../api/adapters'
import { queryKeys } from '../api/query'
import { rememberShareToken } from '../api/share'
import { Button } from '../components/Button/Button'
import { IconButton } from '../components/IconButton/IconButton'
import { StatusMessage } from '../components/StatusMessage/StatusMessage'
import { errorDetail } from '../api/errors'
import { useI18n } from '../i18n'
import styles from '../screens/ProfileScreen.module.css'

export function ConnectedMyMarketsScreen({
  userId,
  onBack,
  onOpenMarket,
}: {
  userId?: number
  onBack: () => void
  onOpenMarket: (marketId: number) => void
}) {
  const { t, locale } = useI18n()
  const query = useQuery({
    queryKey: userId ? queryKeys.createdMarkets(userId) : ['users', 'markets', 'idle'],
    queryFn: () => listCreatedMarkets(userId as number),
    enabled: Boolean(userId),
  })

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label={t('back')} size="md" onClick={onBack}>
          <ChevronLeft size={22} />
        </IconButton>
        <strong>{t('profile.events')}</strong>
      </header>
      <div className={styles.body}>
        {!userId ? (
          <StatusMessage tone="warning" title={t('err.openInTg')}>
            {t('err.openInTgBody')}
          </StatusMessage>
        ) : query.isPending ? (
          <StatusMessage tone="loading" title={t('loading')}>
            {t('loading.events')}
          </StatusMessage>
        ) : query.isError ? (
          <StatusMessage tone="error" title={t('err.request')}>
            {errorDetail(query.error)}
          </StatusMessage>
        ) : (query.data ?? []).length === 0 ? (
          <StatusMessage title={t('empty.eventsTitle')}>{t('empty.eventsBody')}</StatusMessage>
        ) : (
          (query.data ?? []).map((market) => {
            if (market.share_token) rememberShareToken(market.id, market.share_token)
            const view = mapMarketOut(market, new Date(), locale)
            return (
              <button key={market.id} type="button" className={styles.menuItem} onClick={() => onOpenMarket(market.id)}>
                <span>
                  {view.question}
                  <br />
                  <small>
                    {view.closeLabel}
                    {market.visibility === 'unlisted' ? ` · ${t('type.unlisted')}` : ''}
                  </small>
                </span>
              </button>
            )
          })
        )}
        <Button variant="secondary" onClick={onBack}>
          {t('back')}
        </Button>
      </div>
    </div>
  )
}
