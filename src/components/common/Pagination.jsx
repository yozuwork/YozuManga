import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import './Pagination.css'

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const pages = new Set([1, totalPages])
  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page > 1 && page < totalPages) pages.add(page)
  }

  const sortedPages = [...pages].sort((a, b) => a - b)
  const result = []
  sortedPages.forEach((page, index) => {
    if (index > 0 && page - sortedPages[index - 1] > 1) result.push(`gap-${page}`)
    result.push(page)
  })
  return result
}

function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange }) {
  if (totalPages <= 1) return null

  const firstItem = (currentPage - 1) * pageSize + 1
  const lastItem = Math.min(currentPage * pageSize, totalItems)

  function changePage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return
    onPageChange(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <nav className="pagination" aria-label="資料分頁">
      <div className="pagination-summary">第 {firstItem}–{lastItem} 筆，共 {totalItems} 筆</div>
      <div className="pagination-buttons">
        <button
          type="button"
          disabled={currentPage === 1}
          aria-label="上一頁"
          onClick={() => changePage(currentPage - 1)}
        >
          <FiChevronLeft aria-hidden="true" />
        </button>
        {getPageNumbers(currentPage, totalPages).map((page) =>
          typeof page === 'number' ? (
            <button
              className={page === currentPage ? 'active' : ''}
              type="button"
              aria-label={`第 ${page} 頁`}
              aria-current={page === currentPage ? 'page' : undefined}
              key={page}
              onClick={() => changePage(page)}
            >
              {page}
            </button>
          ) : (
            <span className="pagination-gap" aria-hidden="true" key={page}>…</span>
          ),
        )}
        <button
          type="button"
          disabled={currentPage === totalPages}
          aria-label="下一頁"
          onClick={() => changePage(currentPage + 1)}
        >
          <FiChevronRight aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}

export default Pagination
