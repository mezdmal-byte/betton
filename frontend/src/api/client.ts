import { getTelegramInitData } from '../telegram/webapp'

export const SHARE_TOKEN_HEADER = 'X-Market-Share-Token'
export const TOTAL_COUNT_HEADER = 'X-Total-Count'

export type ApiErrorCode =
  | 'auth-expired'
  | 'not-found'
  | 'forbidden'
  | 'network'
  | 'http'

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly detail: string

  constructor(message: string, options: { status: number; code: ApiErrorCode; detail?: string }) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code
    this.detail = options.detail ?? message
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function isAuthExpired(error: unknown): boolean {
  return isApiError(error) && error.code === 'auth-expired'
}

export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (typeof raw !== 'string') return ''
  return raw.replace(/\/+$/, '')
}

export function resolveApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const base = getApiBaseUrl()
  return `${base}${normalized}`
}

export type RequestHeadersInput = {
  initData?: string | null
  shareToken?: string | null
  json?: boolean
}

export function buildRequestHeaders({
  initData,
  shareToken,
  json = false,
}: RequestHeadersInput = {}): Record<string, string> {
  const headers: Record<string, string> = {}
  if (json) headers['Content-Type'] = 'application/json'
  const token = (initData ?? '').trim()
  if (token) headers.Authorization = `tma ${token}`
  const share = (shareToken ?? '').trim()
  if (share) headers[SHARE_TOKEN_HEADER] = share
  return headers
}

export function parseTotalCount(headers: Headers, fallback = 0): number {
  const raw = headers.get(TOTAL_COUNT_HEADER)
  if (raw == null || raw.trim() === '') return fallback
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function codeForStatus(status: number): ApiErrorCode {
  if (status === 401) return 'auth-expired'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not-found'
  return 'http'
}

function messageForStatus(status: number, detail: string): string {
  if (status === 401) return 'Сессия закончилась'
  if (status === 403) return detail || 'Нет доступа'
  if (status === 404) return detail || 'Событие недоступно'
  return detail || 'Не удалось загрузить'
}

async function readDetail(res: Response): Promise<string> {
  const data: unknown = await res.json().catch(() => null)
  if (data && typeof data === 'object' && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail
    if (typeof detail === 'string' && detail.trim()) return detail
  }
  return ''
}

export type ApiRequestOptions = Omit<RequestInit, 'headers' | 'body'> & {
  initData?: string | null
  shareToken?: string | null
  jsonBody?: unknown
  headers?: Record<string, string>
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<{
  data: T
  headers: Headers
  status: number
}> {
  const { initData, shareToken, jsonBody, headers: extraHeaders, ...rest } = options
  const authInitData = initData === undefined ? getTelegramInitData() : initData
  const headers = {
    ...buildRequestHeaders({
      initData: authInitData,
      shareToken,
      json: jsonBody !== undefined,
    }),
    ...extraHeaders,
  }

  let res: Response
  try {
    res = await fetch(resolveApiUrl(path), {
      ...rest,
      headers,
      body: jsonBody !== undefined ? JSON.stringify(jsonBody) : undefined,
    })
  } catch {
    throw new ApiError('Проверьте соединение и попробуйте снова.', {
      status: 0,
      code: 'network',
    })
  }

  if (!res.ok) {
    const detail = await readDetail(res)
    const code = codeForStatus(res.status)
    throw new ApiError(messageForStatus(res.status, detail), {
      status: res.status,
      code,
      detail,
    })
  }

  if (res.status === 204) {
    return { data: undefined as T, headers: res.headers, status: res.status }
  }

  const data = (await res.json()) as T
  return { data, headers: res.headers, status: res.status }
}
