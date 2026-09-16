const STATUS_STYLES = {
  borrador: { label: 'Borrador', className: 'badge badge-gray' },
  enviada: { label: 'Enviada', className: 'badge badge-blue' },
  aprobada: { label: 'Aprobada', className: 'badge badge-green' },
  rechazada: { label: 'Rechazada', className: 'badge badge-red' }
}

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.borrador
  return <span className={style.className}>{style.label}</span>
}
