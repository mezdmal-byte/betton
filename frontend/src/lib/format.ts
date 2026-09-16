function isWholeNumber(value: number): boolean {
  return Number.isFinite(value) && Math.abs(value - Math.round(value)) < 1e-9
}

function formatTonFraction(amount: number): string {
  const fixed = amount.toFixed(4)
  if (!fixed.includes('.')) return fixed
  return fixed.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '')
}

export function formatOdds(odds: number | null | undefined): string {
  if (odds == null || Number.isNaN(odds)) return '—'
  return odds.toFixed(2)
}

export function formatTon(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  if (amount === 0) return '0 TON'
  if (amount > 0 && amount < 0.0001) return '<0.0001 TON'
  if (amount < 0 && amount > -0.0001) return '−<0.0001 TON'
  if (Math.abs(amount) >= 1000) {
    const compact = amount / 1000
    const label = isWholeNumber(compact) ? String(Math.round(compact)) : compact.toFixed(1)
    return `${label}K TON`
  }
  if (isWholeNumber(amount)) return `${Math.round(amount)} TON`
  return `${formatTonFraction(amount)} TON`
}

export function formatInteger(value: number): string {
  return String(Math.round(value))
}

export function formatTonFull(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  if (amount === 0) return '0 TON'
  if (amount > 0 && amount < 0.0001) return '<0.0001 TON'
  if (amount < 0 && amount > -0.0001) return '−<0.0001 TON'
  if (isWholeNumber(amount)) {
    return `${new Intl.NumberFormat('ru-RU').format(Math.round(amount))} TON`
  }
  return `${formatTonFraction(amount)} TON`
}

export function formatPayout(amount: number, odds: number): string {
  return `${formatInteger(amount * odds)} TON`
}
