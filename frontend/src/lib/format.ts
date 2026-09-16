export function formatOdds(odds: number | null | undefined): string {
  if (odds == null || Number.isNaN(odds)) return '—'
  return odds.toFixed(2)
}

export function formatTon(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  if (amount >= 1000) {
    const compact = amount / 1000
    const label = Number.isInteger(compact) ? String(compact) : compact.toFixed(1)
    return `${label}K TON`
  }
  return `${formatInteger(amount)} TON`
}

export function formatInteger(value: number): string {
  return String(Math.round(value))
}

export function formatTonFull(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  return `${new Intl.NumberFormat('ru-RU').format(Math.round(amount))} TON`
}

export function formatPayout(amount: number, odds: number): string {
  return `${formatInteger(amount * odds)} TON`
}
