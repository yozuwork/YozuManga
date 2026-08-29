import { useEffect, useRef, useState } from 'react'

function clamp(value) {
  return Math.min(100, Math.max(0, value))
}

export default function useCoverPositionDrag(item, onSave, enabled = true) {
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [position, setPosition] = useState({
    x: item.coverPosX ?? 50,
    y: item.coverPosY ?? 50,
  })
  const dragRef = useRef(null)
  const ignoreClickRef = useRef(false)
  const positionRef = useRef(position)

  useEffect(() => {
    if (dragRef.current) return
    const nextPosition = { x: item.coverPosX ?? 50, y: item.coverPosY ?? 50 }
    positionRef.current = nextPosition
    setPosition(nextPosition)
  }, [item.coverPosX, item.coverPosY])

  useEffect(() => {
    if (enabled) return
    dragRef.current = null
    setIsAdjusting(false)
  }, [enabled])

  function toggleAdjusting(event) {
    event.stopPropagation()
    setIsAdjusting((value) => !value)
  }

  function handlePointerDown(event) {
    if (!enabled || !item.coverUrl || item.coverFit === 'contain') return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsAdjusting(true)
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      position,
      moved: false,
    }
  }

  function handlePointerMove(event) {
    if (!dragRef.current) return
    event.preventDefault()
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    const deltaX = ((event.clientX - dragRef.current.startX) / rect.width) * 100
    const deltaY = ((event.clientY - dragRef.current.startY) / rect.height) * 100
    if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) dragRef.current.moved = true
    const nextPosition = {
      x: clamp(dragRef.current.position.x + deltaX),
      y: clamp(dragRef.current.position.y + deltaY),
    }
    positionRef.current = nextPosition
    setPosition(nextPosition)
  }

  function handlePointerEnd(event) {
    if (!dragRef.current) return
    const didMove = dragRef.current.moved
    dragRef.current = null
    setIsAdjusting(false)
    if (didMove) {
      event.preventDefault()
      event.stopPropagation()
      ignoreClickRef.current = true
      onSave(item.id, {
        coverPosX: positionRef.current.x,
        coverPosY: positionRef.current.y,
      })
    }
  }

  function handlePointerCancel(event) {
    if (!dragRef.current) return
    event.stopPropagation()
    dragRef.current = null
    const originalPosition = { x: item.coverPosX ?? 50, y: item.coverPosY ?? 50 }
    positionRef.current = originalPosition
    setPosition(originalPosition)
    setIsAdjusting(false)
  }

  function handleCoverClick(event) {
    if (!ignoreClickRef.current) return
    event.preventDefault()
    event.stopPropagation()
    ignoreClickRef.current = false
  }

  function cancelAdjusting() {
    dragRef.current = null
    const originalPosition = { x: item.coverPosX ?? 50, y: item.coverPosY ?? 50 }
    positionRef.current = originalPosition
    setPosition(originalPosition)
    setIsAdjusting(false)
  }

  return {
    isAdjusting,
    position,
    toggleAdjusting,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
    handlePointerCancel,
    handleCoverClick,
    cancelAdjusting,
  }
}
