import { useEffect, useState } from 'react'

export const DEFAULT_PAGE_SIZE = 12

export default function usePagination(items, resetKey, pageSize = DEFAULT_PAGE_SIZE) {
  const [requestedPage, setRequestedPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(requestedPage, totalPages)
  const startIndex = (currentPage - 1) * pageSize

  useEffect(() => {
    setRequestedPage(1)
  }, [resetKey])

  useEffect(() => {
    if (requestedPage > totalPages) setRequestedPage(totalPages)
  }, [requestedPage, totalPages])

  return {
    currentPage,
    totalPages,
    pageItems: items.slice(startIndex, startIndex + pageSize),
    setCurrentPage: setRequestedPage,
  }
}
