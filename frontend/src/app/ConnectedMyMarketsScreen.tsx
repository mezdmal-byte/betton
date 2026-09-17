import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listCreatedMarkets } from '../api/account'
import { mapMarketOut } from '../api/adapters'
import { errorDetail } from '../api/errors'
import { queryKeys } from '../api/query'
import { rememberShareToken } from '../api/share'
import { useI18n } from '../i18n'
import { MyEventsScreen } from '../screens/MyEventsScreen'

export function ConnectedMyMarketsScreen({ userId, onBack, onOpenMarket }: { userId?: number; onBack: () => void; onOpenMarket: (marketId: number) => void }) {
  const { locale } = useI18n()
  const query = useQuery({ queryKey: userId ? queryKeys.createdMarkets(userId) : ['users', 'markets', 'idle'], queryFn: () => listCreatedMarkets(userId as number), enabled: Boolean(userId) })

  useEffect(() => {
    for (const market of query.data ?? []) if (market.share_token) rememberShareToken(market.id, market.share_token)
  }, [query.data])

  const markets = useMemo(() => (query.data ?? []).map((market) => mapMarketOut(market, new Date(), locale)), [query.data, locale])
  const viewState = !userId ? 'unauthenticated' : query.isPending ? 'loading' : query.isError ? 'error' : 'ready'

  return <MyEventsScreen markets={markets} viewState={viewState} errorMessage={query.isError ? errorDetail(query.error) : null} onBack={onBack} onOpenMarket={(market) => onOpenMarket(Number(market.id))} />
}
