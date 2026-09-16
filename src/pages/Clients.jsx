import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import Pagination from '../components/Pagination.jsx'
import { formatPhoneDO, formatTaxId } from '../lib/masks.js'
import { IconPlus, IconPencil, IconTrash, IconInbox } from '../components/icons.jsx'

const PAGE_SIZE = 10

function emptyForm() {
  return { name: '', tax_id: '', email: '', phone: '', address: '', notes: '' }
}

export default function Clients() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [page, setPage] = useState(1)

  async function load() {
    setClients(await api.clients.list(search))
  }

  useEffect(() => {
    load()
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(clients.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageClients = useMemo(
    () => clients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [clients, currentPage]
  )

  function openNew() {
    setForm(emptyForm())
  }

  function openEdit(client) {
    setForm({ ...client })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.id) {
      await api.clients.update(form.id, form)
    } else {
      await api.clients.create(form)
    }
    setForm(null)
    load()
  }

  async function confirmDelete() {
    await api.clients.delete(pendingDelete)
    setPendingDelete(null)
    load()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Clientes</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <IconPlus size={16} />
          Nuevo cliente
        </button>
      </div>

      <div className="filters">
        <input type="text" placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>RNC</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {pageClients.map((client) => (
            <tr key={client.id}>
              <td>{client.name}</td>
              <td>{client.tax_id}</td>
              <td>{client.email}</td>
              <td>{client.phone}</td>
              <td className="row-actions">
                <button className="btn btn-link" title="Editar" onClick={() => openEdit(client)}>
                  <IconPencil size={15} />
                </button>
                <button className="btn btn-link btn-danger" title="Eliminar" onClick={() => setPendingDelete(client.id)}>
                  <IconTrash size={15} />
                </button>
              </td>
            </tr>
          ))}
          {clients.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-state">
                <IconInbox size={32} className="empty-state-icon" />
                <p>No hay clientes todavía.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />

      {form && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{form.id ? 'Editar cliente' : 'Nuevo cliente'}</h3>
            <form onSubmit={handleSubmit} className="modal-form">
              <label>
                Razón Social / Nombre
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
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
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </label>
              <label>
                Notas
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setForm(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar cliente"
        message="Esta acción no se puede deshacer. ¿Deseas continuar?"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
