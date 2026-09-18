import { useQuery } from '@tanstack/react-query'
import { getCreatorProfile } from '../api/account'
import { mapCreatorStats } from '../api/adapters'
import { queryKeys } from '../api/query'
import { ProfileScreen } from '../screens/ProfileScreen'
import type { AccountFixture } from '../types/account'

export function ConnectedProfileScreen({
  account,
  accountState,
  userId,
  onBack,
  onMenu,
}: {
  account: AccountFixture
  accountState: 'ready' | 'unauthenticated'
  userId?: number
  onBack: () => void
  onMenu: (id: string) => void
}) {
  const creator = useQuery({
    queryKey: userId ? queryKeys.creator(userId) : ['creators', 'idle'],
    queryFn: () => getCreatorProfile(userId as number),
    enabled: Boolean(userId) && accountState === 'ready',
  })
  const stats = mapCreatorStats(creator.data?.creator)
  const merged: AccountFixture = {
    ...account,
    eventsCreated: stats.eventsCreated,
    createdVolumeTon: stats.createdVolumeTon,
  }

  return (
    <ProfileScreen account={merged} accountState={accountState} onBack={onBack} onMenu={onMenu} />
  )
}
