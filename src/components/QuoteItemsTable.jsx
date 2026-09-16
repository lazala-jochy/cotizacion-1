import { formatMoney } from '../lib/format.js'
import { IconPlus, IconTrash } from './icons.jsx'

export default function QuoteItemsTable({ items, products, currency, onChange, onRemove, onAdd }) {
  function updateItem(index, patch) {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    onChange(next)
  }

  function handleProductSelect(index, productId) {
    const product = products.find((p) => String(p.id) === String(productId))
    if (!product) {
      updateItem(index, { product_id: null })
      return
    }
    updateItem(index, {
      product_id: product.id,
      description: product.name,
      unit_price: product.unit_price
    })
  }

  return (
    <table className="items-table">
      <thead>
        <tr>
          <th>Producto/Servicio</th>
          <th>Descripción</th>
          <th>Cantidad</th>
          <th>Precio unitario</th>
          <th>Subtotal</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={index}>
            <td>
              <select value={item.product_id || ''} onChange={(e) => handleProductSelect(index, e.target.value)}>
                <option value="">Texto libre</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                placeholder="Descripción"
              />
            </td>
            <td>
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.quantity}
                onChange={(e) => updateItem(index, { quantity: e.target.value })}
              />
            </td>
            <td>
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.unit_price}
                onChange={(e) => updateItem(index, { unit_price: e.target.value })}
              />
            </td>
            <td className="num">{formatMoney(Number(item.quantity) * Number(item.unit_price), currency)}</td>
            <td>
              <button type="button" className="btn btn-link btn-danger" title="Quitar" onClick={() => onRemove(index)}>
                <IconTrash size={15} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={6}>
            <button type="button" className="btn" onClick={onAdd}>
              <IconPlus size={15} />
              Agregar ítem
            </button>
          </td>
        </tr>
      </tfoot>
    </table>
  )
}
