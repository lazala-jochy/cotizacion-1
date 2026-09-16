import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api.js'
import AuthLayout from '../../components/AuthLayout.jsx'
import PasswordInput from '../../components/PasswordInput.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.credentials.load().then((saved) => {
      if (saved) {
        setEmail(saved.email || '')
        setPassword(saved.password || '')
        setRemember(true)
      }
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.auth.signIn({ email, password })
      if (remember) {
        await api.credentials.save(email, password)
      } else {
        await api.credentials.clear()
      }
    } catch (err) {
      setError(err.message.includes('Invalid login credentials') ? 'Correo o contraseña incorrectos.' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <h1>Iniciar sesión</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Contraseña
            <PasswordInput
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Recordar usuario y contraseña
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/olvide-password">¿Olvidaste tu contraseña?</Link>
        </p>
        <p className="auth-footer">
          ¿No tienes cuenta? <Link to="/signup">Crea una</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
