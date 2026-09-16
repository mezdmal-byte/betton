import { useQuery } from '@tanstack/react-query'
import { authTelegram, getAccount } from '../api/account'
import { isAuthExpired } from '../api/client'
import { queryKeys } from '../api/query'

export function useSession(hasInitData: boolean) {
  const query = useQuery({
    queryKey: queryKeys.session,
    queryFn: authTelegram,
    enabled: hasInitData,
  })

  return {
    user: query.data ?? null,
    isLoading: hasInitData && query.isPending,
    isExpired: isAuthExpired(query.error),
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useAccount(userId: number | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.account(userId) : ['users', 'account', 'idle'],
    queryFn: () => getAccount(userId as number),
    enabled: Boolean(userId),
  })
}
