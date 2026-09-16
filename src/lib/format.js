export function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: currency || 'DOP' }).format(amount || 0)
  } catch {
    return `${Number(amount || 0).toFixed(2)} ${currency || ''}`
  }
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })
}

export const STATUS_OPTIONS = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'rechazada', label: 'Rechazada' }
]

export const MONTH_OPTIONS = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' }
]

export function yearOptionsFrom(quotes) {
  const years = new Set(quotes.map((q) => q.issue_date?.slice(0, 4)).filter(Boolean))
  years.add(String(new Date().getFullYear()))
  return [...years].sort((a, b) => b.localeCompare(a))
}

export function matchesMonthYear(quote, month, year) {
  if (!quote.issue_date) return !month && !year
  if (year && quote.issue_date.slice(0, 4) !== year) return false
  if (month && String(Number(quote.issue_date.slice(5, 7))) !== month) return false
  return true
}
