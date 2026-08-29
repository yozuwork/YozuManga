import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import DialogModal from './DialogModal.jsx'

const DialogContext = createContext(null)

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const activeDialogRef = useRef(null)
  const queueRef = useRef([])

  const openDialog = useCallback((options) => new Promise((resolve) => {
    const nextDialog = { ...options, resolve }
    if (activeDialogRef.current) {
      queueRef.current.push(nextDialog)
      return
    }

    activeDialogRef.current = nextDialog
    setDialog(nextDialog)
  }), [])

  const closeDialog = useCallback((result) => {
    const currentDialog = activeDialogRef.current
    if (!currentDialog) return

    currentDialog.resolve(result)
    const nextDialog = queueRef.current.shift() ?? null
    activeDialogRef.current = nextDialog
    setDialog(nextDialog)
  }, [])

  const showMessage = useCallback((message, options = {}) => openDialog({
    mode: 'message',
    message,
    title: options.title ?? '訊息',
    variant: options.variant ?? 'info',
    confirmLabel: options.confirmLabel ?? '知道了',
  }), [openDialog])

  const confirm = useCallback((message, options = {}) => openDialog({
    mode: 'confirm',
    message,
    title: options.title ?? '請確認',
    variant: options.variant ?? 'warning',
    confirmLabel: options.confirmLabel ?? '確定',
    cancelLabel: options.cancelLabel ?? '取消',
  }), [openDialog])

  const value = useMemo(() => ({ confirm, showMessage }), [confirm, showMessage])

  return (
    <DialogContext.Provider value={value}>
      {children}
      <DialogModal dialog={dialog} onClose={closeDialog} />
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) throw new Error('useDialog 必須在 DialogProvider 內使用')
  return context
}
