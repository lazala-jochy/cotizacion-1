import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { useSettings } from '../lib/SettingsContext.jsx'
import { formatPhoneDO, formatTaxId } from '../lib/masks.js'
import { IconBriefcase, IconFileText } from '../components/icons.jsx'

export default function Settings() {
  const { settings, refresh } = useSettings()
  const [form, setForm] = useState(settings)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)

  useEffect(() => {
    if (!form.company_logo_path) {
      setLogoPreview(null)
      return
    }
    let cancelled = false
    api.files.getLogoDataUri(form.company_logo_path).then((uri) => {
      if (!cancelled) setLogoPreview(uri || null)
    })
    return () => {
      cancelled = true
    }
  }, [form.company_logo_path])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.settings.update(form)
      await refresh()
      setSavedAt(true)
    } finally {
      setSaving(false)
    }
  }

  async function handlePickLogo() {
    const result = await api.files.pickLogo()
    if (!result) return
    setForm({ ...form, company_logo_path: result.path })
    setLogoPreview(result.dataUri || null)
  }

  function handleRemoveLogo() {
    setForm({ ...form, company_logo_path: '' })
    setLogoPreview(null)
  }

  function update(field) {
    return (e) => {
      setSavedAt(false)
      setForm({ ...form, [field]: e.target.value })
    }
  }

  function updateMasked(field, formatter) {
    return (e) => {
      setSavedAt(false)
      setForm({ ...form, [field]: formatter(e.target.value) })
    }
  }

  return (
    <div className="page settings-page">
      <div className="page-header">
        <div>
          <h1>Configuración</h1>
          <p className="page-subtitle">Estos datos se usan en cada cotización nueva y en el PDF que se exporta.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="settings-grid">
          <section className="settings-card">
            <header className="settings-card-header">
              <span className="settings-card-icon"><IconBriefcase size={20} /></span>
              <div>
                <h2>Datos de la empresa</h2>
                <p className="card-hint">Aparecen en el encabezado del PDF de la cotización.</p>
              </div>
            </header>

            <div className="settings-card-body">
              <label>
                Nombre de la empresa
                <input value={form.company_name} onChange={update('company_name')} />
              </label>

              <label>
                Dirección
                <input value={form.company_address} onChange={update('company_address')} />
              </label>

              <div className="field-row">
                <label>
                  RNC
                  <input
                    value={form.company_tax_id}
                    onChange={updateMasked('company_tax_id', formatTaxId)}
                    placeholder="130-00000-1"
                    inputMode="numeric"
                  />
                </label>
                <label>
                  Teléfono
                  <input
                    value={form.company_phone}
                    onChange={updateMasked('company_phone', formatPhoneDO)}
                    placeholder="809-000-0000"
                    inputMode="numeric"
                  />
                </label>
              </div>

              <label>
                Email
                <input type="email" value={form.company_email} onChange={update('company_email')} />
              </label>

              <label>
                Logo
                <div className="logo-picker">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo de la empresa" className="logo-preview" />
                  ) : (
                    <div className="logo-placeholder">Sin logo</div>
                  )}
                  <div className="logo-actions">
                    <button type="button" className="btn" onClick={handlePickLogo}>
                      {logoPreview ? 'Cambiar imagen...' : 'Seleccionar imagen...'}
                    </button>
                    {logoPreview && (
                      <button type="button" className="btn btn-link btn-danger" onClick={handleRemoveLogo}>
                        Quitar logo
                      </button>
                    )}
                  </div>
                </div>
              </label>
            </div>
          </section>

          <section className="settings-card">
            <header className="settings-card-header">
              <span className="settings-card-icon"><IconFileText size={20} /></span>
              <div>
                <h2>Cotizaciones</h2>
                <p className="card-hint">Valores predeterminados al crear una cotización nueva.</p>
              </div>
            </header>

            <div className="settings-card-body">
              <p className="card-hint currency-note">
                Moneda: <strong>Peso dominicano (RD$)</strong>
              </p>

              <div className="field-row">
                <label>
                  Tasa de impuesto default (%)
                  <input type="number" min="0" step="0.01" value={form.tax_rate} onChange={update('tax_rate')} />
                </label>
                <label>
                  Prefijo de folio
                  <input value={form.folio_prefix} onChange={update('folio_prefix')} />
                </label>
              </div>

              <label>
                Último folio emitido
                <input type="number" min="0" value={form.folio_counter} onChange={update('folio_counter')} />
              </label>

              <p className="card-hint folio-preview">
                Próximo folio: <strong>{form.folio_prefix || 'COT'}-{String((parseInt(form.folio_counter, 10) || 0) + 1).padStart(4, '0')}</strong>
              </p>
            </div>
          </section>
        </div>

        <div className="settings-footer">
          {savedAt && <span className="save-indicator">✓ Guardado</span>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </form>
    </div>
  )
}
