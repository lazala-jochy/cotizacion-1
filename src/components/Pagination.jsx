import { IconChevronLeft, IconChevronRight } from './icons.jsx'

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <div className="pagination">
      <button className="btn" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        <IconChevronLeft size={15} />
        Anterior
      </button>
      <span className="pagination-label">
        Página {page} de {totalPages}
      </span>
      <button className="btn" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        Siguiente
        <IconChevronRight size={15} />
      </button>
    </div>
  )
}
