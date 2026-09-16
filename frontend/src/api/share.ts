const tokens = new Map<string, string>()

export function rememberShareToken(marketId: number | string, token: string | null | undefined): void {
  const cleaned = (token || '').trim()
  if (!cleaned) return
  tokens.set(String(marketId), cleaned)
}

export function shareTokenFor(marketId: number | string): string | null {
  return tokens.get(String(marketId)) ?? null
}

export function telegramShareUrl(botUsername: string | null | undefined, shareToken: string | null | undefined): string {
  const uname = (botUsername || '').replace(/^@/, '').trim()
  const token = (shareToken || '').trim()
  if (!uname || !token) return ''
  return `https://t.me/${uname}?start=market_${token}`
}

export async function copyShareLink(link: string): Promise<boolean> {
  if (!link) return false
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link)
      return true
    }
  } catch {
    return false
  }
  return false
}
