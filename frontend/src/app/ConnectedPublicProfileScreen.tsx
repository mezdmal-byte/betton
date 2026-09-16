import { useQuery } from '@tanstack/react-query'
import { getCreatorProfile } from '../api/account'
import { initialsFromName, mapMarketOut, mapUserIdentity } from '../api/adapters'
import { queryKeys } from '../api/query'
import { useI18n } from '../i18n'
import { nanoToTon } from '../lib/money'
import { PublicProfileScreen } from '../screens/PublicProfileScreen'

export function ConnectedPublicProfileScreen({
  userId,
  onBack,
  onOpenMarket,
}: {
  userId: number
  onBack: () => void
  onOpenMarket: (marketId: number) => void
}) {
  const { locale } = useI18n()
  const query = useQuery({
    queryKey: queryKeys.creator(userId),
    queryFn: () => getCreatorProfile(userId),
  })
  const creator = query.data?.creator
  const identity = creator
    ? mapUserIdentity({
        display_name: creator.display_name,
        telegram_username: creator.telegram_username,
        username: creator.telegram_username || creator.display_name,
        photo_url: creator.photo_url,
      })
    : null

  return (
    <PublicProfileScreen
      viewState={query.isPending ? 'loading' : query.isError ? 'error' : 'ready'}
      profile={
        creator && identity
          ? {
              displayName: identity.displayName,
              handle: identity.handle || 'creator',
              initials: identity.initials || initialsFromName(identity.displayName),
              photoUrl: identity.photoUrl,
              marketsCreated: creator.markets_created,
              volumeTon: creator.volume_nano != null ? nanoToTon(creator.volume_nano) : creator.volume,
              fills: creator.fills,
              participants: creator.unique_participants,
              activeMarkets: creator.active_markets,
              completedMarkets: creator.completed_markets,
            }
          : null
      }
      markets={(query.data?.markets ?? []).map((item) => mapMarketOut(item, new Date(), locale))}
      onBack={onBack}
      onOpenMarket={(market) => onOpenMarket(Number(market.id))}
    />
  )
}
