import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import QuotesList from './pages/QuotesList.jsx'
import QuoteEditor from './pages/QuoteEditor.jsx'
import Clients from './pages/Clients.jsx'
import Products from './pages/Products.jsx'
import Settings from './pages/Settings.jsx'
import Reports from './pages/Reports.jsx'
import Login from './pages/auth/Login.jsx'
import SignUp from './pages/auth/SignUp.jsx'
import RecoverPassword from './pages/auth/RecoverPassword.jsx'
import AuthLayout from './components/AuthLayout.jsx'
import { SettingsProvider, useSettings } from './lib/SettingsContext.jsx'
import { AuthProvider, useAuth } from './lib/AuthContext.jsx'

function DocumentTitle() {
  const { settings } = useSettings()
  useEffect(() => {
    document.title = settings.company_name ? `${settings.company_name} · Cotizador` : 'Cotizador'
  }, [settings.company_name])
  return null
}

function AppShell() {
  const { settings } = useSettings()
  const { signOut } = useAuth()

  if (settings.active === false) {
    return (
      <AuthLayout>
        <div className="auth-card">
          <h1>Cuenta desactivada</h1>
          <p className="card-hint">
            El acceso de tu empresa a Cotizador fue desactivado. Contacta al administrador para más información.
          </p>
          <button className="btn" onClick={signOut}>
            Cerrar sesión
          </button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <>
      <DocumentTitle />
      <div className="app-shell">
        <Sidebar />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<QuotesList />} />
            <Route path="/cotizaciones/nueva" element={<QuoteEditor />} />
            <Route path="/cotizaciones/:id" element={<QuoteEditor />} />
            <Route path="/clientes" element={<Clients />} />
            <Route path="/productos" element={<Products />} />
            <Route path="/reportes" element={<Reports />} />
            <Route path="/configuracion" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </>
  )
}

function AuthGate() {
  const { session, loading } = useAuth()

  if (loading) return null

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/olvide-password" element={<RecoverPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <SettingsProvider>
      <AppShell />
    </SettingsProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AuthGate />
      </HashRouter>
    </AuthProvider>
  )
}
