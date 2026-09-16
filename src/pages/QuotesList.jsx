import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'
import { formatMoney, formatDate, STATUS_OPTIONS } from '../lib/format.js'
import { useSettings } from '../lib/SettingsContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { IconPlus, IconPencil, IconCopy, IconDownload, IconTrash, IconInbox } from '../components/icons.jsx'

export default function QuotesList() {
  const navigate = useNavigate()
  const { settings } = useSettings()
  const [quotes, setQuotes] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)

  const load = useCallback(async () => {
    const data = await api.quotes.list({ search, status })
    setQuotes(data)
  }, [search, status])

  useEffect(() => {
    load()
  }, [load])

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
            {quotes.length} {quotes.length === 1 ? 'cotización' : 'cotizaciones'}
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
          {quotes.map((quote) => (
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
          {quotes.length === 0 && (
            <tr>
              <td colSpan={6} className="empty-state">
                <IconInbox size={32} className="empty-state-icon" />
                <p>No hay cotizaciones todavía.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>

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
