type AuthExpiryListener = () => void

const listeners = new Set<AuthExpiryListener>()
let expired = false

export function isAuthExpiredFlag(): boolean {
  return expired
}

export function markAuthExpired(): void {
  if (expired) return
  expired = true
  for (const listener of listeners) listener()
}

export function subscribeAuthExpired(listener: AuthExpiryListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function resetAuthExpired(): void {
  expired = false
}
