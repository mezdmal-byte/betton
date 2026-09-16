export const NANO_PER_TON = 1_000_000_000

export function nanoToTon(nano: number | null | undefined): number {
  if (nano == null || !Number.isFinite(nano)) return 0
  return nano / NANO_PER_TON
}
