import { apiRequest } from './client'
import type { AccountOut, UserOut } from './types'

export async function authTelegram(): Promise<UserOut> {
  const { data } = await apiRequest<UserOut>('/auth/telegram', {
    method: 'POST',
    jsonBody: {},
  })
  return data
}

export async function getAccount(userId: number): Promise<AccountOut> {
  const { data } = await apiRequest<AccountOut>(`/users/${userId}/account`)
  return data
}
