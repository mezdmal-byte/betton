import { getTelegramWebApp, type TelegramWebApp } from './webapp'

const edges = ['top', 'bottom', 'left', 'right'] as const
const hostEvents = ['viewportChanged', 'safeAreaChanged', 'contentSafeAreaChanged', 'fullscreenChanged', 'fullscreenFailed'] as const
const fullscreenRequests = new WeakSet<TelegramWebApp>()

function pixels(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0
}

/** V1 layout only. Host fields are geometry, never authentication or money data. */
export function syncTelegramViewport(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => undefined
  const host = getTelegramWebApp()
  const root = document.documentElement
  const style = root.style
  const previousProperties = new Map<string, { value: string; priority: string }>()
  const previousAttributes = new Map<string, string | null>()
  const setProperty = (name: string, value: string) => {
    if (!previousProperties.has(name)) previousProperties.set(name, { value: style.getPropertyValue(name), priority: style.getPropertyPriority(name) })
    style.setProperty(name, value)
  }
  const setAttribute = (name: string, value: string) => {
    if (!previousAttributes.has(name)) previousAttributes.set(name, root.getAttribute(name))
    root.setAttribute(name, value)
  }

  const update = () => {
    const inHost = Boolean(host?.initData?.trim())
    const stableHeight = (inHost ? pixels(host?.viewportStableHeight) : 0) || pixels(window.innerHeight)
    const viewport = window.visualViewport
    // The host's stable height pins chrome during sheet animations. Only an
    // editing keyboard may reduce it to the browser's visible viewport.
    const editing = document.activeElement?.matches('input, textarea, select, [contenteditable="true"]') ?? false
    const keyboard = Boolean(editing && viewport && viewport.scale === 1 && viewport.height < stableHeight - 120)
    const height = keyboard && viewport ? Math.min(stableHeight, viewport.height + viewport.offsetTop) : stableHeight
    let verticalInsets = 0
    for (const edge of edges) {
      const system = inHost ? pixels(host?.safeAreaInset?.[edge]) : 0
      const content = inHost ? pixels(host?.contentSafeAreaInset?.[edge]) : 0
      // Reserve system UI and Telegram controls separately.
      setProperty(`--betton-system-${edge}`, `${system}px`)
      setProperty(`--betton-content-${edge}`, `${content}px`)
      if (edge === 'top' || edge === 'bottom') verticalInsets += system + content
    }
    setProperty('--betton-viewport-height', `${height}px`)
    setAttribute('data-betton-host', String(inHost))
    setAttribute('data-betton-fullscreen', String(inHost && Boolean(host?.isFullscreen)))
    setAttribute('data-betton-keyboard', String(keyboard))
    setAttribute('data-betton-compact', String(height - verticalInsets <= 700))
  }

  const subscribed: string[] = []
  for (const event of hostEvents) {
    try { if (host?.onEvent) { host.onEvent(event, update); subscribed.push(event) } } catch { /* Older host. */ }
  }
  window.addEventListener('resize', update)
  window.visualViewport?.addEventListener('resize', update)
  window.visualViewport?.addEventListener('scroll', update)
  document.addEventListener('focusin', update)
  document.addEventListener('focusout', update)
  update()

  // SDK methods also exist in an ordinary browser. Request only from a real
  // Mini App context, once per host lifetime, and never retry a denied request.
  if (host?.initData?.trim() && host.requestFullscreen && !host.isFullscreen && !fullscreenRequests.has(host)) {
    try {
      if (host.isVersionAtLeast?.('8.0')) {
        fullscreenRequests.add(host)
        host.requestFullscreen()
      }
    } catch { /* Compact layout remains usable when fullscreen is refused. */ }
  }

  return () => {
    for (const event of subscribed) { try { host?.offEvent?.(event, update) } catch { /* Host gone. */ } }
    window.removeEventListener('resize', update)
    window.visualViewport?.removeEventListener('resize', update)
    window.visualViewport?.removeEventListener('scroll', update)
    document.removeEventListener('focusin', update)
    document.removeEventListener('focusout', update)
    for (const [name, previous] of previousProperties) {
      if (previous.value) style.setProperty(name, previous.value, previous.priority)
      else style.removeProperty(name)
    }
    for (const [name, previous] of previousAttributes) {
      if (previous === null) root.removeAttribute(name)
      else root.setAttribute(name, previous)
    }
  }
}
