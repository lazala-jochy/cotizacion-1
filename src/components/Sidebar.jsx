import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { api } from '../lib/api.js'
import { useSettings } from '../lib/SettingsContext.jsx'
import { useAuth } from '../lib/AuthContext.jsx'
import { IconFileText, IconUsers, IconBox, IconBarChart, IconSettings, IconLogOut } from './icons.jsx'

const links = [
  { to: '/', label: 'Cotizaciones', Icon: IconFileText, end: true },
  { to: '/clientes', label: 'Clientes', Icon: IconUsers },
  { to: '/productos', label: 'Productos', Icon: IconBox },
  { to: '/reportes', label: 'Reportes', Icon: IconBarChart },
  { to: '/configuracion', label: 'Configuración', Icon: IconSettings }
]

export default function Sidebar() {
  const { settings } = useSettings()
  const { signOut } = useAuth()
  const [version, setVersion] = useState('')

  useEffect(() => {
    api.app.getVersion().then(setVersion)
  }, [])

  return (
    <nav className="sidebar">
      <div className="sidebar-title">
        <div className="sidebar-company">{settings.company_name || 'Mi Empresa'}</div>
        <div className="sidebar-tagline">Cotizador</div>
      </div>
      <ul>
        {links.map((link) => (
          <li key={link.to}>
            <NavLink to={link.to} end={link.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <link.Icon size={17} className="sidebar-icon" />
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <button type="button" className="sidebar-logout" onClick={signOut}>
        <IconLogOut size={16} />
        Cerrar sesión
      </button>
      {version && <div className="sidebar-version">v{version}</div>}
    </nav>
  )
}
