import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { formatMoney, formatDate, STATUS_OPTIONS, MONTH_OPTIONS, yearOptionsFrom, matchesMonthYear } from '../lib/format.js'
import { useSettings } from '../lib/SettingsContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Pagination from '../components/Pagination.jsx'
import { IconPlus, IconPencil, IconCopy, IconDownload, IconTrash, IconInbox } from '../components/icons.jsx'

const PAGE_SIZE = 10

export default function QuotesList() {
  const navigate = useNavigate()
  const { settings } = useSettings()
  const [quotes, setQuotes] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    const data = await api.quotes.list({ search, status })
    setQuotes(data)
  }, [search, status])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [search, status, month, year])

  const yearOptions = useMemo(() => yearOptionsFrom(quotes), [quotes])
  const visibleQuotes = useMemo(
    () => quotes.filter((q) => matchesMonthYear(q, month, year)),
    [quotes, month, year]
  )

  const totalPages = Math.max(1, Math.ceil(visibleQuotes.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageQuotes = useMemo(
    () => visibleQuotes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [visibleQuotes, currentPage]
  )

  async function handleDuplicate(id) {
    await api.quotes.duplicate(id)
    load()
  }

  async function handleExportPdf(id) {
    const quote = await api.quotes.get(id)
    const client = quote.client_id ? await api.clients.get(quote.client_id) : null
    await api.pdf.export({ quote, client, settings })
  }

  async function confirmDelete() {
    await api.quotes.delete(pendingDelete)
    setPendingDelete(null)
    load()
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Cotizaciones</h1>
          <p className="page-subtitle">
            {visibleQuotes.length} {visibleQuotes.length === 1 ? 'cotización' : 'cotizaciones'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/cotizaciones/nueva')}>
          <IconPlus size={16} />
          Nueva cotización
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Buscar por folio o cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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

      <table className="data-table">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {pageQuotes.map((quote) => (
            <tr key={quote.id}>
              <td>{quote.folio}</td>
              <td>{quote.client_name || 'Sin cliente'}</td>
              <td>{formatDate(quote.issue_date)}</td>
              <td>{formatMoney(quote.total, quote.currency)}</td>
              <td>
                <StatusBadge status={quote.status} />
              </td>
              <td className="row-actions">
                <button
                  className="btn btn-link"
                  title="Editar"
                  onClick={() => navigate(`/cotizaciones/${quote.id}`)}
                >
                  <IconPencil size={15} />
                </button>
                <button className="btn btn-link" title="Duplicar" onClick={() => handleDuplicate(quote.id)}>
                  <IconCopy size={15} />
                </button>
                <button className="btn btn-link" title="Exportar PDF" onClick={() => handleExportPdf(quote.id)}>
                  <IconDownload size={15} />
                </button>
                <button
                  className="btn btn-link btn-danger"
                  title="Eliminar"
                  onClick={() => setPendingDelete(quote.id)}
                >
                  <IconTrash size={15} />
                </button>
              </td>
            </tr>
          ))}
          {visibleQuotes.length === 0 && (
            <tr>
              <td colSpan={6} className="empty-state">
                <IconInbox size={32} className="empty-state-icon" />
                <p>No hay cotizaciones que coincidan con los filtros.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar cotización"
        message="Esta acción no se puede deshacer. ¿Deseas continuar?"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
