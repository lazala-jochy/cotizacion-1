import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { formatMoney } from '../lib/format.js'
import { useSettings } from '../lib/SettingsContext.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { IconPlus, IconPencil, IconTrash, IconInbox } from '../components/icons.jsx'

function emptyForm() {
  return { name: '', description: '', unit: 'unidad', unit_price: 0, sku: '' }
}

export default function Products() {
  const { settings } = useSettings()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)

  async function load() {
    setProducts(await api.products.list(search))
  }

  useEffect(() => {
    load()
  }, [search])

  function openNew() {
    setForm(emptyForm())
  }

  function openEdit(product) {
    setForm({ ...product })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = { ...form, unit_price: Number(form.unit_price) || 0 }
    if (form.id) {
      await api.products.update(form.id, payload)
    } else {
      await api.products.create(payload)
    }
    setForm(null)
    load()
  }

  async function confirmDelete() {
    await api.products.delete(pendingDelete)
    setPendingDelete(null)
    load()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Productos y servicios</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <IconPlus size={16} />
          Nuevo producto
        </button>
      </div>

      <div className="filters">
        <input type="text" placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Unidad</th>
            <th>Precio</th>
            <th>SKU</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.unit}</td>
              <td>{formatMoney(product.unit_price, settings.currency)}</td>
              <td>{product.sku}</td>
              <td className="row-actions">
                <button className="btn btn-link" title="Editar" onClick={() => openEdit(product)}>
                  <IconPencil size={15} />
                </button>
                <button className="btn btn-link btn-danger" title="Eliminar" onClick={() => setPendingDelete(product.id)}>
                  <IconTrash size={15} />
                </button>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-state">
                <IconInbox size={32} className="empty-state-icon" />
                <p>No hay productos todavía.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {form && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{form.id ? 'Editar producto' : 'Nuevo producto'}</h3>
            <form onSubmit={handleSubmit} className="modal-form">
              <label>
                Nombre
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>
                Descripción
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
              <label>
                Unidad
                <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </label>
              <label>
                Precio unitario
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unit_price}
                  onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                />
              </label>
              <label>
                SKU
                <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
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
        title="Eliminar producto"
        message="Esta acción no se puede deshacer. ¿Deseas continuar?"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
