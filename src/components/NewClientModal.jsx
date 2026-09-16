import { useState } from 'react'
import { formatPhoneDO, formatTaxId } from '../lib/masks.js'

function emptyForm(initialName) {
  return { name: initialName || '', tax_id: '', email: '', phone: '', address: '', notes: '' }
}

export default function NewClientModal({ initialName, onSave, onCancel }) {
  const [form, setForm] = useState(() => emptyForm(initialName))
  const [saving, setSaving] = useState(false)

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Nuevo cliente</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Razón Social / Nombre
            <input required autoFocus value={form.name} onChange={update('name')} />
          </label>
          <label>
            RNC
            <input
              value={form.tax_id}
              onChange={(e) => setForm({ ...form, tax_id: formatTaxId(e.target.value) })}
              placeholder="130-00000-1"
              inputMode="numeric"
            />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={update('email')} />
          </label>
          <label>
            Teléfono
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: formatPhoneDO(e.target.value) })}
              placeholder="809-000-0000"
              inputMode="numeric"
            />
          </label>
          <label>
            Dirección
            <input value={form.address} onChange={update('address')} />
          </label>
          <label>
            Notas
            <textarea value={form.notes} onChange={update('notes')} />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
