import { useEffect, useRef } from 'react'
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiTrash2,
  FiX,
} from 'react-icons/fi'
import './DialogModal.css'

const variantIcons = {
  danger: FiTrash2,
  error: FiAlertCircle,
  info: FiInfo,
  success: FiCheckCircle,
  warning: FiAlertTriangle,
}

function DialogModal({ dialog, onClose }) {
  const primaryButtonRef = useRef(null)
  const cancelButtonRef = useRef(null)

  useEffect(() => {
    if (!dialog) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusFrame = requestAnimationFrame(() => {
      const preferredButton = dialog.mode === 'confirm'
        ? cancelButtonRef.current
        : primaryButtonRef.current
      preferredButton?.focus()
    })

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose(dialog.mode === 'confirm' ? false : true)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [dialog, onClose])

  if (!dialog) return null

  const Icon = variantIcons[dialog.variant] ?? FiInfo

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose(dialog.mode === 'confirm' ? false : true)
        }
      }}
    >
      <section
        className={`dialog-card ${dialog.variant}`}
        role={dialog.mode === 'confirm' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
      >
        <button
          className="dialog-close"
          type="button"
          aria-label="關閉"
          onClick={() => onClose(dialog.mode === 'confirm' ? false : true)}
        >
          <FiX aria-hidden="true" />
        </button>

        <div className="dialog-icon" aria-hidden="true"><Icon /></div>
        <h2 id="dialog-title">{dialog.title}</h2>
        <p id="dialog-message">{dialog.message}</p>

        <div className="dialog-actions">
          {dialog.mode === 'confirm' && (
            <button
              ref={cancelButtonRef}
              className="dialog-cancel"
              type="button"
              onClick={() => onClose(false)}
            >
              {dialog.cancelLabel}
            </button>
          )}
          <button
            ref={primaryButtonRef}
            className="dialog-confirm"
            type="button"
            onClick={() => onClose(true)}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}

export default DialogModal
