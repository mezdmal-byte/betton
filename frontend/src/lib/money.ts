export const NANO_PER_TON = 1_000_000_000

export function nanoToTon(nano: number | null | undefined): number {
  if (nano == null || !Number.isFinite(nano)) return 0
  return nano / NANO_PER_TON
}

export function moneyJsonValue(ton: number): string {
  if (!Number.isFinite(ton)) return '0'
  const nano = Math.round(ton * NANO_PER_TON)
  const sign = nano < 0 ? '-' : ''
  const abs = Math.abs(nano)
  const whole = Math.floor(abs / NANO_PER_TON)
  const frac = String(abs % NANO_PER_TON).padStart(9, '0').replace(/0+$/, '')
  return frac ? `${sign}${whole}.${frac}` : `${sign}${whole}`
}
