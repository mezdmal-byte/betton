import { apiRequest } from './client'
import type { PositionOut, SettlementOut, TransactionOut } from './types'

export async function listPositions(userId: number): Promise<PositionOut[]> {
  const { data } = await apiRequest<PositionOut[]>(`/users/${userId}/positions`)
  return Array.isArray(data) ? data : []
}

export async function listTransactions(userId: number): Promise<TransactionOut[]> {
  const { data } = await apiRequest<TransactionOut[]>(`/users/${userId}/transactions`)
  return Array.isArray(data) ? data : []
}

export async function listSettlements(userId: number): Promise<SettlementOut[]> {
  const { data } = await apiRequest<SettlementOut[]>(`/users/${userId}/settlements`)
  return Array.isArray(data) ? data : []
}
