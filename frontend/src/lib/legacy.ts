export function legacyMiniAppHref(): string {
  return '/'
}

export function openLegacyMiniApp(): void {
  if (typeof window === 'undefined') return
  window.location.assign(legacyMiniAppHref())
}
