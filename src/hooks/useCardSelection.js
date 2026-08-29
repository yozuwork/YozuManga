import { useEffect, useMemo, useState } from 'react'

export default function useCardSelection(items) {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const itemIds = useMemo(() => items.map((item) => item.id), [items])
  const itemIdKey = itemIds.join('\u0000')

  useEffect(() => {
    const validIds = new Set(itemIds)
    setSelectedIds((current) => {
      const next = new Set([...current].filter((id) => validIds.has(id)))
      return next.size === current.size ? current : next
    })
  }, [itemIdKey])

  function startSelecting() {
    setIsSelecting(true)
  }

  function stopSelecting() {
    setIsSelecting(false)
    setSelectedIds(new Set())
  }

  function toggleSelected(id) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll(ids = itemIds) {
    setSelectedIds((current) => {
      const next = new Set(current)
      ids.forEach((id) => next.add(id))
      return next
    })
  }

  function clearSelected() {
    setSelectedIds(new Set())
  }

  return {
    isSelecting,
    selectedIds,
    selectedCount: selectedIds.size,
    startSelecting,
    stopSelecting,
    toggleSelected,
    selectAll,
    clearSelected,
  }
}
