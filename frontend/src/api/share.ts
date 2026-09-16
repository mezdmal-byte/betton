const tokens = new Map<string, string>()

export function rememberShareToken(marketId: number | string, token: string | null | undefined): void {
  const cleaned = (token || '').trim()
  if (!cleaned) return
  tokens.set(String(marketId), cleaned)
}

export function shareTokenFor(marketId: number | string): string | null {
  return tokens.get(String(marketId)) ?? null
}
