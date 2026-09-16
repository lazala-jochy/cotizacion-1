import { IconFileText } from './icons.jsx'

export default function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <div className="auth-brand-mark">
          <IconFileText size={22} />
          Cotizador
        </div>
        <p className="auth-brand-tagline">
          Crea, envía y da seguimiento a tus cotizaciones desde cualquier equipo, con tu equipo.
        </p>
      </div>
      <div className="auth-panel">{children}</div>
    </div>
  )
}
