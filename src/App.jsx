import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import QuotesList from './pages/QuotesList.jsx'
import QuoteEditor from './pages/QuoteEditor.jsx'
import Clients from './pages/Clients.jsx'
import Products from './pages/Products.jsx'
import Settings from './pages/Settings.jsx'
import Login from './pages/auth/Login.jsx'
import SignUp from './pages/auth/SignUp.jsx'
import RecoverPassword from './pages/auth/RecoverPassword.jsx'
import { SettingsProvider, useSettings } from './lib/SettingsContext.jsx'
import { AuthProvider, useAuth } from './lib/AuthContext.jsx'

function DocumentTitle() {
  const { settings } = useSettings()
  useEffect(() => {
    document.title = settings.company_name ? `${settings.company_name} · Cotizador` : 'Cotizador'
  }, [settings.company_name])
  return null
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
            <Route path="/configuracion" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
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
