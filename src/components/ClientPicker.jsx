import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api.js'
import NewClientModal from './NewClientModal.jsx'
import { IconX, IconPlus, IconUsers } from './icons.jsx'

export default function ClientPicker({ clients, value, onChange, onClientCreated }) {
  const selected = clients.find((c) => c.id === value) || null
  const [query, setQuery] = useState(selected?.name || '')
  const [open, setOpen] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    setQuery(selected ? selected.name : '')
  }, [selected?.id])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const trimmed = query.trim()
  const matches = trimmed.length >= 2 ? clients.filter((c) => c.name.toLowerCase().includes(trimmed.toLowerCase())).slice(0, 8) : []

  function handleInputChange(e) {
    setQuery(e.target.value)
    setOpen(true)
    if (value) onChange('')
  }

  function handleSelect(client) {
    onChange(client.id)
    setQuery(client.name)
    setOpen(false)
  }

  function handleClear() {
    onChange('')
    setQuery('')
  }

  async function handleCreate(formValues) {
    const client = await api.clients.create(formValues)
    onClientCreated(client)
    onChange(client.id)
    setQuery(client.name)
    setShowNewModal(false)
    setOpen(false)
  }

  return (
    <div className="client-picker" ref={containerRef}>
      <div className="client-picker-input">
        <IconUsers size={15} className="client-picker-input-icon" />
        <input
          type="text"
          value={query}
          placeholder="Escribe al menos 2 letras..."
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
        />
        {value && (
          <button type="button" className="client-picker-clear" onClick={handleClear} aria-label="Quitar cliente">
            <IconX size={14} />
          </button>
        )}
      </div>

      {open && trimmed.length >= 2 && (
        <div className="client-picker-dropdown">
          {matches.map((c) => (
            <button type="button" key={c.id} className="client-picker-option" onClick={() => handleSelect(c)}>
              <span className="client-picker-name">{c.name}</span>
              {(c.email || c.phone) && <span className="client-picker-meta">{c.email || c.phone}</span>}
            </button>
          ))}
          {matches.length === 0 && <div className="client-picker-empty">Ningún cliente coincide con “{trimmed}”.</div>}
          <button type="button" className="client-picker-option client-picker-create" onClick={() => setShowNewModal(true)}>
            <IconPlus size={14} />
            Crear cliente “{trimmed}”
          </button>
        </div>
      )}

      {showNewModal && (
        <NewClientModal initialName={trimmed} onSave={handleCreate} onCancel={() => setShowNewModal(false)} />
      )}
    </div>
  )
}
