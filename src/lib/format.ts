// Pure formatting helpers — safe to import from client components.

export const USD_TO_PKR = 280

export function formatCurrency(amount: number, currency = 'PKR') {
  const value = Number.isFinite(amount) ? amount : 0
  try {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    // Fallback for unknown currency codes
    return `${currency} ${value.toLocaleString('en-PK')}`
  }
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-PK').format(Number.isFinite(value) ? value : 0)
}
