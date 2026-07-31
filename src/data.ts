export const money = (value: number | null | undefined) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(Number.isFinite(value) ? Number(value) : 0)

export const percent = (value: number | null | undefined) =>
  Number.isFinite(value) ? `${Number(value).toFixed(1)}%` : '—'
