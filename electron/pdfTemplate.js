const { logoToDataUri } = require('./logoUtils')

function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: currency || 'DOP' }).format(amount || 0)
  } catch {
    return `${Number(amount || 0).toFixed(2)} ${currency || ''}`
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })
}

const STATUS_LABELS = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada'
}

function buildQuoteHtml({ quote, client, settings }) {
  const logoUri = logoToDataUri(settings.company_logo_path)
  const itemsRows = quote.items
    .map(
      (item) => `
    <tr>
      <td>${item.description}</td>
      <td class="num">${item.quantity}</td>
      <td class="num">${formatMoney(item.unit_price, quote.currency)}</td>
      <td class="num">${formatMoney(item.subtotal, quote.currency)}</td>
    </tr>
  `
    )
    .join('')

  return `
    <!doctype html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <style>
        * { box-sizing: border-box; }
        body { font-family: Helvetica, Arial, sans-serif; color: #1f2933; padding: 32px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #1f2933; padding-bottom: 16px; }
        .header img { max-height: 64px; max-width: 200px; object-fit: contain; margin-bottom: 6px; }
        .company { font-size: 12px; line-height: 1.5; }
        .company h2 { margin: 0 0 4px; font-size: 18px; }
        .quote-meta { text-align: right; font-size: 12px; }
        .quote-meta h1 { margin: 0 0 4px; font-size: 20px; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; background: #e4e7eb; font-size: 11px; margin-top: 4px; }
        .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #616e7c; margin: 20px 0 6px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { padding: 8px 6px; border-bottom: 1px solid #e4e7eb; font-size: 12px; text-align: left; }
        th { background: #f5f7fa; font-size: 11px; text-transform: uppercase; color: #616e7c; }
        .num { text-align: right; }
        .totals { width: 260px; margin-left: auto; margin-top: 16px; font-size: 13px; }
        .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
        .totals .total { font-weight: bold; font-size: 16px; border-top: 2px solid #1f2933; margin-top: 6px; padding-top: 8px; }
        .notes { margin-top: 24px; font-size: 12px; color: #616e7c; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company">
          ${logoUri ? `<img src="${logoUri}" />` : ''}
          <h2>${settings.company_name || ''}</h2>
          ${settings.company_tax_id ? `<div>${settings.company_tax_id}</div>` : ''}
          ${settings.company_address ? `<div>${settings.company_address}</div>` : ''}
          ${settings.company_phone ? `<div>${settings.company_phone}</div>` : ''}
          ${settings.company_email ? `<div>${settings.company_email}</div>` : ''}
        </div>
        <div class="quote-meta">
          <h1>Cotización ${quote.folio}</h1>
          <div>Fecha: ${formatDate(quote.issue_date)}</div>
          ${quote.valid_until ? `<div>Válida hasta: ${formatDate(quote.valid_until)}</div>` : ''}
          <div class="badge">${STATUS_LABELS[quote.status] || quote.status}</div>
        </div>
      </div>

      <div class="section-title">Cliente</div>
      <div>
        <strong>${client ? client.name : 'Sin cliente'}</strong><br/>
        ${client && client.tax_id ? `${client.tax_id}<br/>` : ''}
        ${client && client.address ? `${client.address}<br/>` : ''}
        ${client && client.email ? `${client.email}<br/>` : ''}
        ${client && client.phone ? `${client.phone}` : ''}
      </div>

      <div class="section-title">Detalle</div>
      <table>
        <thead>
          <tr>
            <th>Descripción</th>
            <th class="num">Cantidad</th>
            <th class="num">Precio unitario</th>
            <th class="num">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="totals">
        <div><span>Subtotal</span><span>${formatMoney(quote.subtotal, quote.currency)}</span></div>
        <div><span>Impuesto${quote.is_tax_exempt ? ' (exento de ITBIS)' : ` (${quote.tax_rate}%)`}</span><span>${formatMoney(quote.tax_amount, quote.currency)}</span></div>
        <div class="total"><span>Total</span><span>${formatMoney(quote.total, quote.currency)}</span></div>
      </div>

      ${quote.notes ? `<div class="notes"><strong>Notas:</strong><br/>${quote.notes}</div>` : ''}
    </body>
    </html>
  `
}

module.exports = { buildQuoteHtml }
