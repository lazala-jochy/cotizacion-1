import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { formatMoney, STATUS_OPTIONS, MONTH_OPTIONS, yearOptionsFrom, matchesMonthYear } from '../lib/format.js'
import { useSettings } from '../lib/SettingsContext.jsx'
import { IconRefresh } from '../components/icons.jsx'

function emptyTotals() {
  return STATUS_OPTIONS.reduce((acc, opt) => {
    acc[opt.value] = { count: 0, total: 0 }
    return acc
  }, {})
}

export default function Reports() {
  const { settings } = useSettings()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.quotes.list({})
      setQuotes(data)
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const yearOptions = useMemo(() => yearOptionsFrom(quotes), [quotes])
  const visibleQuotes = useMemo(
    () => quotes.filter((q) => matchesMonthYear(q, month, year)),
    [quotes, month, year]
  )

  const byStatus = emptyTotals()
  let grandCount = 0
  let grandTotal = 0

  for (const quote of visibleQuotes) {
    const bucket = byStatus[quote.status]
    if (bucket) {
      bucket.count += 1
      bucket.total += Number(quote.total) || 0
    }
    grandCount += 1
    grandTotal += Number(quote.total) || 0
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Reportes</h1>
          <p className="page-subtitle">
            Resumen de cotizaciones por estado.
            {lastUpdated && ` Actualizado a las ${lastUpdated.toLocaleTimeString('es')}.`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={load} disabled={loading}>
          <IconRefresh size={16} />
          {loading ? 'Actualizando...' : 'Actualizar ahora'}
        </button>
      </div>

      <div className="filters">
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">Todos los meses</option>
          {MONTH_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Todos los años</option>
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-card-total">
          <p className="stat-card-label">Total general</p>
          <p className="stat-card-count">{grandCount}</p>
          <p className="stat-card-amount">{formatMoney(grandTotal, settings.currency)}</p>
        </div>

        {STATUS_OPTIONS.map((opt) => (
          <div key={opt.value} className={`stat-card stat-card-${opt.value}`}>
            <p className="stat-card-label">{opt.label}</p>
            <p className="stat-card-count">{byStatus[opt.value].count}</p>
            <p className="stat-card-amount">{formatMoney(byStatus[opt.value].total, settings.currency)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
