export function newRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `req-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`
}

export function orderFingerprint(input: {
  marketId: number | string
  outcome: number
  money: string | number
  odds: string | number
  kind: string
}): string {
  return JSON.stringify({
    marketId: String(input.marketId),
    outcome: Number(input.outcome),
    money: String(input.money),
    odds: String(input.odds),
    kind: input.kind,
  })
}

export class IdempotencyKeys {
  private readonly keys = new Map<string, string>()

  forFingerprint(fingerprint: string): string {
    const existing = this.keys.get(fingerprint)
    if (existing) return existing
    const id = newRequestId()
    this.keys.set(fingerprint, id)
    return id
  }

  peek(fingerprint: string): string | undefined {
    return this.keys.get(fingerprint)
  }

  clear(fingerprint: string): void {
    this.keys.delete(fingerprint)
  }
}
