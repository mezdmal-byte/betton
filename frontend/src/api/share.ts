import { getTelegramWebApp } from '../telegram/webapp'

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

export function publicWebappBase(webapp?: string | null): string {
  const raw = (webapp || '').trim().replace(/\/+$/, '')
  if (raw) return raw
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '')
  }
  return ''
}

export function webappShareUrl(shareToken: string | null | undefined, webapp?: string | null): string {
  const token = (shareToken || '').trim()
  if (!token) return ''
  const base = publicWebappBase(webapp)
  if (!base) return ''
  return `${base}/v2/?share=${encodeURIComponent(token)}`
}

export function marketShareUrl(input: {
  shareToken?: string | null
  botUsername?: string | null
  webapp?: string | null
}): string {
  const token = (input.shareToken || '').trim()
  if (!token) return ''
  return telegramShareUrl(input.botUsername, token) || webappShareUrl(token, input.webapp)
}

export async function copyShareLink(link: string): Promise<boolean> {
  if (!link) return false
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link)
      return true
    }
  } catch {
    // Telegram WebView often blocks clipboard; fall through.
  }
  try {
    if (typeof document === 'undefined') return false
    const el = document.createElement('textarea')
    el.value = link
    el.setAttribute('readonly', 'true')
    el.style.position = 'fixed'
    el.style.left = '-9999px'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}

export function shareExternally(link: string): boolean {
  if (!link) return false
  const encoded = encodeURIComponent(link)
  const telegramShare = `https://t.me/share/url?url=${encoded}`
  const webApp = getTelegramWebApp()
  try {
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(telegramShare)
      return true
    }
    if (webApp?.openLink) {
      webApp.openLink(link)
      return true
    }
  } catch {
    return false
  }
  try {
    if (typeof window !== 'undefined') {
      window.open(telegramShare, '_blank', 'noopener,noreferrer')
      return true
    }
  } catch {
    return false
  }
  return false
}
