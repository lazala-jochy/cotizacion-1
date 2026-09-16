import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { formatPhoneDO, formatTaxId } from '../../lib/masks.js'
import AuthLayout from '../../components/AuthLayout.jsx'
import PasswordInput from '../../components/PasswordInput.jsx'

const initialForm = {
  companyName: '',
  companyTaxId: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  companyLogoPath: '',
  email: '',
  password: '',
  confirmPassword: ''
}

function mapError(message) {
  if (message.includes('already registered')) return 'Ya existe una cuenta con ese correo.'
  if (message.includes('DUPLICATE_COMPANY_NAME')) return 'Ya existe una empresa registrada con ese nombre.'
  if (message.includes('DUPLICATE_COMPANY_TAX_ID')) return 'Ya existe una empresa registrada con ese RNC.'
  if (message.includes('DUPLICATE_COMPANY_EMAIL')) return 'Ya existe una empresa registrada con ese correo de empresa.'
  return message
}

export default function SignUp() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [logoPreview, setLogoPreview] = useState(null)
  const [checkingStep1, setCheckingStep1] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  useEffect(() => {
    if (!form.companyLogoPath) {
      setLogoPreview(null)
      return
    }
    let cancelled = false
    api.files.getLogoDataUri(form.companyLogoPath).then((uri) => {
      if (!cancelled) setLogoPreview(uri || null)
    })
    return () => {
      cancelled = true
    }
  }, [form.companyLogoPath])

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  async function handlePickLogo() {
    const result = await api.files.pickLogo()
    if (!result) return
    setForm({ ...form, companyLogoPath: result.path })
    setLogoPreview(result.dataUri || null)
  }

  function handleRemoveLogo() {
    setForm({ ...form, companyLogoPath: '' })
    setLogoPreview(null)
  }

  async function handleNext() {
    setError('')
    if (!form.companyName.trim()) {
      setError('El nombre de la empresa es obligatorio.')
      return
    }

    setCheckingStep1(true)
    try {
      const [nameOk, taxIdOk, emailOk] = await Promise.all([
        api.auth.checkCompanyName(form.companyName),
        api.auth.checkCompanyTaxId(form.companyTaxId),
        api.auth.checkCompanyEmail(form.companyEmail)
      ])
      const nextErrors = {}
      if (!nameOk) nextErrors.companyName = 'Ya existe una empresa registrada con ese nombre.'
      if (!taxIdOk) nextErrors.companyTaxId = 'Ya existe una empresa registrada con ese RNC.'
      if (!emailOk) nextErrors.companyEmail = 'Ya existe una empresa registrada con ese correo.'
      setFieldErrors(nextErrors)
      if (Object.keys(nextErrors).length === 0) setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setCheckingStep1(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const data = await api.auth.signUp({
        email: form.email,
        password: form.password,
        companyName: form.companyName,
        companyTaxId: form.companyTaxId,
        companyAddress: form.companyAddress,
        companyPhone: form.companyPhone,
        companyEmail: form.companyEmail,
        companyLogoPath: form.companyLogoPath
      })
      if (!data.session) setAwaitingConfirmation(true)
    } catch (err) {
      setError(mapError(err.message))
    } finally {
      setLoading(false)
    }
  }

  if (awaitingConfirmation) {
    return (
      <AuthLayout>
        <div className="auth-card">
          <h1>Revisa tu correo</h1>
          <p className="card-hint">
            Te enviamos un enlace de confirmación a <strong>{form.email}</strong>. Confírmalo para poder iniciar
            sesión.
          </p>
          <Link className="btn" to="/login">
            Ir a iniciar sesión
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="auth-card auth-card-wide">
        <h1>Crear cuenta</h1>
        <p className="card-hint">
          {step === 1 ? 'Registra los datos de tu empresa para empezar a cotizar.' : 'Crea tu usuario para iniciar sesión.'}
        </p>
        <div className="auth-progress">
          <span className={`auth-progress-seg ${step >= 1 ? 'active' : ''}`} />
          <span className={`auth-progress-seg ${step >= 2 ? 'active' : ''}`} />
        </div>
        <p className="card-hint">Paso {step} de 2 · {step === 1 ? 'Datos de la empresa' : 'Tu cuenta de acceso'}</p>

        {step === 1 ? (
          <div className="auth-form">
            <label>
              Razón Social / Nombre de la empresa
              <input
                required
                value={form.companyName}
                onChange={(e) => {
                  update('companyName')(e)
                  setFieldErrors({ ...fieldErrors, companyName: null })
                }}
              />
              {fieldErrors.companyName && <p className="field-error">{fieldErrors.companyName}</p>}
            </label>

            <div className="field-row">
              <label>
                RNC
                <input
                  required
                  value={form.companyTaxId}
                  onChange={(e) => {
                    setForm({ ...form, companyTaxId: formatTaxId(e.target.value) })
                    setFieldErrors({ ...fieldErrors, companyTaxId: null })
                  }}
                  placeholder="130-00000-1"
                  inputMode="numeric"
                />
                {fieldErrors.companyTaxId && <p className="field-error">{fieldErrors.companyTaxId}</p>}
              </label>
              <label>
                Teléfono
                <input
                  value={form.companyPhone}
                  onChange={(e) => setForm({ ...form, companyPhone: formatPhoneDO(e.target.value) })}
                  placeholder="809-000-0000"
                  inputMode="numeric"
                />
              </label>
            </div>

            <label>
              Dirección
              <input value={form.companyAddress} onChange={update('companyAddress')} />
            </label>

            <label>
              Email de la empresa
              <input
                type="email"
                value={form.companyEmail}
                onChange={(e) => {
                  update('companyEmail')(e)
                  setFieldErrors({ ...fieldErrors, companyEmail: null })
                }}
              />
              {fieldErrors.companyEmail && <p className="field-error">{fieldErrors.companyEmail}</p>}
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

            {error && <p className="auth-error">{error}</p>}

            <button type="button" className="btn btn-primary" onClick={handleNext} disabled={checkingStep1}>
              {checkingStep1 ? 'Verificando...' : 'Siguiente'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Tu email (para iniciar sesión)
              <input type="email" required value={form.email} onChange={update('email')} />
            </label>

            <div className="field-row">
              <label>
                Contraseña
                <PasswordInput required value={form.password} onChange={update('password')} autoComplete="new-password" />
              </label>
              <label>
                Confirmar contraseña
                <PasswordInput
                  required
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  autoComplete="new-password"
                />
              </label>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <div className="field-row">
              <button type="button" className="btn" onClick={() => setStep(1)}>
                Atrás
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </div>
          </form>
        )}

        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
