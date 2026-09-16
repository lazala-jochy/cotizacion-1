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
