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
  const query = useQuery({
    queryKey: userId ? queryKeys.createdMarkets(userId) : ['users', 'markets', 'idle'],
    queryFn: () => listCreatedMarkets(userId as number),
    enabled: Boolean(userId),
  })

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconButton label="Назад" size="md" onClick={onBack}>
          <ChevronLeft size={22} />
        </IconButton>
        <strong>Мои события</strong>
      </header>
      <div className={styles.body}>
        {!userId ? (
          <StatusMessage tone="warning" title="Откройте BetTON через Telegram">
            Список созданных событий доступен после входа.
          </StatusMessage>
        ) : query.isPending ? (
          <StatusMessage tone="loading" title="Загрузка">
            Обновляем события.
          </StatusMessage>
        ) : query.isError ? (
          <StatusMessage tone="error" title="Не удалось загрузить">
            {errorDetail(query.error)}
          </StatusMessage>
        ) : (query.data ?? []).length === 0 ? (
          <StatusMessage title="Нет созданных событий">Создайте событие — оно появится здесь.</StatusMessage>
        ) : (
          (query.data ?? []).map((market) => {
            if (market.share_token) rememberShareToken(market.id, market.share_token)
            const view = mapMarketOut(market)
            return (
              <button key={market.id} type="button" className={styles.menuItem} onClick={() => onOpenMarket(market.id)}>
                <span>
                  {view.question}
                  <br />
                  <small>
                    {view.closeLabel}
                    {market.visibility === 'unlisted' ? ' · по ссылке' : ''}
                    {market.share_token ? ` · ${market.share_token}` : ''}
                  </small>
                </span>
              </button>
            )
          })
        )}
        <Button variant="secondary" onClick={onBack}>
          Назад
        </Button>
      </div>
    </div>
  )
}
