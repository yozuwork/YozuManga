import { useEffect, useRef, useState } from 'react'
import usePagination, { DEFAULT_PAGE_SIZE } from './usePagination.js'

const DISPLAY_MODE_KEY = 'yozu-library-display-mode'
const VALID_MODES = new Set(['12', '36', '48', 'waterfall'])

function getInitialMode() {
  try {
    const savedMode = window.localStorage.getItem(DISPLAY_MODE_KEY)
    return VALID_MODES.has(savedMode) ? savedMode : '12'
  } catch {
    return '12'
  }
}

export default function useListDisplay(items, resetKey) {
  const [mode, setModeState] = useState(getInitialMode)
  const [waterfallCount, setWaterfallCount] = useState(DEFAULT_PAGE_SIZE)
  const loadMoreRef = useRef(null)
  const isWaterfall = mode === 'waterfall'
  const pageSize = isWaterfall ? DEFAULT_PAGE_SIZE : Number(mode)
  const pagination = usePagination(items, `${resetKey}\u0000${mode}`, pageSize)
  const displayItems = isWaterfall
    ? items.slice(0, waterfallCount)
    : pagination.pageItems
  const hasMore = isWaterfall && waterfallCount < items.length

  function setMode(nextMode) {
    if (!VALID_MODES.has(nextMode)) return
    setModeState(nextMode)
    try {
      window.localStorage.setItem(DISPLAY_MODE_KEY, nextMode)
    } catch {
      // 無法使用 localStorage 時，仍保留本次頁面的選擇。
    }
  }

  useEffect(() => {
    setWaterfallCount(DEFAULT_PAGE_SIZE)
  }, [mode, resetKey])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!isWaterfall || !hasMore || !target) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setWaterfallCount((count) => Math.min(count + DEFAULT_PAGE_SIZE, items.length))
      },
      { rootMargin: '300px 0px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, isWaterfall, items.length, waterfallCount])

  return {
    mode,
    setMode,
    isWaterfall,
    displayItems,
    hasMore,
    loadMoreRef,
    pageSize,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    setCurrentPage: pagination.setCurrentPage,
  }
}
