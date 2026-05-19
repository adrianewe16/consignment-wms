import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ')
}

export function formatThb(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export const DATE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This month', days: -1 },
  { label: 'All time', days: -2 },
]

export function getPresetDates(preset: number): { from: string; to: string } {
  const today = new Date()
  const to = today.toISOString().split('T')[0]

  if (preset === 0) return { from: to, to }
  if (preset === -2) return { from: '2000-01-01', to }
  if (preset === -1) {
    const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    return { from, to }
  }
  const from = new Date(today)
  from.setDate(from.getDate() - preset)
  return { from: from.toISOString().split('T')[0], to }
}
