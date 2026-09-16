import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { formatTaxId } from '../../lib/masks.js'
import AuthLayout from '../../components/AuthLayout.jsx'
import PasswordInput from '../../components/PasswordInput.jsx'

function mapError(message) {
  if (message.includes('INVALID_CREDENTIALS')) {
    return 'No encontramos una cuenta con ese correo y ese RNC juntos. Verifica ambos datos.'
  }
  return message
}

export default function RecoverPassword() {
  const [email, setEmail] = useState('')
  const [companyTaxId, setCompanyTaxId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      await api.auth.recoverPassword({ email, companyTaxId, newPassword })
      setDone(true)
    } catch (err) {
      setError(mapError(err.message))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="auth-card">
          <h1>Contraseña actualizada</h1>
          <p className="card-hint">Ya puedes iniciar sesión con tu nueva contraseña.</p>
          <Link className="btn btn-primary" to="/login">
            Ir a iniciar sesión
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <h1>Recuperar contraseña</h1>
        <p className="card-hint">
          Verificamos tu identidad con tu correo de acceso y el RNC de tu empresa — sin enviar ningún correo.
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Tu email (con el que inicias sesión)
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            RNC de tu empresa
            <input
              required
              value={companyTaxId}
              onChange={(e) => setCompanyTaxId(formatTaxId(e.target.value))}
              placeholder="130-00000-1"
              inputMode="numeric"
            />
          </label>
          <label>
            Nueva contraseña
            <PasswordInput
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirmar nueva contraseña
            <PasswordInput
              required
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Verificando...' : 'Restablecer contraseña'}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/login">Volver a iniciar sesión</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
