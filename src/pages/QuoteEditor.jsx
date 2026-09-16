import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api.js'
import { formatMoney, STATUS_OPTIONS } from '../lib/format.js'
import { useSettings } from '../lib/SettingsContext.jsx'
import QuoteItemsTable from '../components/QuoteItemsTable.jsx'
import ClientPicker from '../components/ClientPicker.jsx'
import { IconArrowLeft, IconDownload, IconSave } from '../components/icons.jsx'

function emptyItem() {
  return { product_id: null, description: '', quantity: 1, unit_price: 0 }
}

export default function QuoteEditor() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { settings } = useSettings()

  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [clientId, setClientId] = useState('')
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [validUntil, setValidUntil] = useState('')
  const [status, setStatus] = useState('borrador')
  const [taxRate, setTaxRate] = useState(settings.tax_rate)
  const [isTaxExempt, setIsTaxExempt] = useState(false)
  const [currency, setCurrency] = useState(settings.currency)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([emptyItem()])
  const [folio, setFolio] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.clients.list().then(setClients)
    api.products.list().then(setProducts)
  }, [])

  useEffect(() => {
    if (!isEditing) return
    api.quotes.get(id).then((quote) => {
      if (!quote) return
      setFolio(quote.folio)
      setClientId(quote.client_id || '')
      setIssueDate(quote.issue_date)
      setValidUntil(quote.valid_until || '')
      setStatus(quote.status)
      setTaxRate(quote.tax_rate)
      setIsTaxExempt(Boolean(quote.is_tax_exempt))
      setCurrency(quote.currency)
      setNotes(quote.notes || '')
      setItems(quote.items.length ? quote.items : [emptyItem()])
    })
  }, [id, isEditing])

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0)
    const taxAmount = isTaxExempt ? 0 : subtotal * ((Number(taxRate) || 0) / 100)
    return { subtotal, taxAmount, total: subtotal + taxAmount }
  }, [items, taxRate, isTaxExempt])

  const buildPayload = useCallback(
    () => ({
      client_id: clientId || null,
      issue_date: issueDate,
      valid_until: validUntil || null,
      status,
      tax_rate: Number(taxRate) || 0,
      currency,
      notes,
      items: items.filter((item) => item.description.trim() !== ''),
      is_tax_exempt: isTaxExempt
    }),
    [clientId, issueDate, validUntil, status, taxRate, currency, notes, items, isTaxExempt]
  )

  async function handleSave() {
    setSaving(true)
    try {
      const payload = buildPayload()
      if (isEditing) {
        await api.quotes.update(id, payload)
      } else {
        const created = await api.quotes.create(payload)
        navigate(`/cotizaciones/${created.id}`, { replace: true })
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleExportPdf() {
    if (!isEditing) {
      await handleSave()
      return
    }
    const quote = await api.quotes.get(id)
    const client = quote.client_id ? await api.clients.get(quote.client_id) : null
    await api.pdf.export({ quote, client, settings })
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEditing ? `Cotización ${folio}` : 'Nueva cotización'}</h1>
        <div className="page-actions">
          <button className="btn" onClick={() => navigate('/')}>
            <IconArrowLeft size={15} />
            Volver
          </button>
          {isEditing && (
            <button className="btn" onClick={handleExportPdf}>
              <IconDownload size={15} />
              Exportar PDF
            </button>
          )}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <IconSave size={15} />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="form-grid">
        <label>
          Cliente
          <ClientPicker
            clients={clients}
            value={clientId}
            onChange={setClientId}
            onClientCreated={(client) => setClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)))}
          />
        </label>
        <label>
          Fecha de emisión
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
        </label>
        <label>
          Válida hasta
          <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
        </label>
        <label>
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tasa de impuesto (%)
          <input
            type="number"
            min="0"
            step="0.01"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            disabled={isTaxExempt}
          />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={isTaxExempt} onChange={(e) => setIsTaxExempt(e.target.checked)} />
          Cotización exenta de ITBIS
        </label>
      </div>

      <h2>Ítems</h2>
      <QuoteItemsTable
        items={items}
        products={products}
        currency={currency}
        onChange={setItems}
        onRemove={(index) => setItems(items.filter((_, i) => i !== index))}
        onAdd={() => setItems([...items, emptyItem()])}
      />

      <div className="totals">
        <div>
          <span>Subtotal</span>
          <span>{formatMoney(totals.subtotal, currency)}</span>
        </div>
        <div>
          <span>Impuesto{isTaxExempt ? ' (exento)' : ''}</span>
          <span>{formatMoney(totals.taxAmount, currency)}</span>
        </div>
        <div className="total">
          <span>Total</span>
          <span>{formatMoney(totals.total, currency)}</span>
        </div>
      </div>

      <label className="notes-field">
        Notas
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
      </label>
    </div>
  )
}
