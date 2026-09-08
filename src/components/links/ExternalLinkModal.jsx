import { useCallback, useEffect, useRef, useState } from 'react'
import { FiClipboard, FiEdit3, FiImage, FiLink, FiMaximize, FiMove, FiX } from 'react-icons/fi'
import { useDialog } from '../common/DialogProvider.jsx'
import MultiSelectTags from '../common/MultiSelectTags.jsx'
import { compressCoverImage } from '../../utils/compressCoverImage.js'
import '../manga/MangaModal.css'
import '../cart/CartItemModal.css'

const EMPTY_FORM = {
  title: '', url: '', pageName: '', description: '', tags: [], coverUrl: '',
  coverPosX: 50, coverPosY: 50, coverFit: 'cover',
}

function initialForm(item) {
  if (!item) return EMPTY_FORM
  return {
    title: item.title ?? '',
    url: item.url ?? '',
    pageName: item.pageName ?? item.siteName ?? '',
    description: item.description ?? '',
    tags: item.tags?.length ? item.tags : item.statuses ?? [],
    coverUrl: item.coverUrl ?? '',
    coverPosX: item.coverPosX ?? 50,
    coverPosY: item.coverPosY ?? 50,
    coverFit: item.coverFit ?? 'cover',
  }
}

function ExternalLinkModal({ isOpen, item, linkTags, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [coverHeight, setCoverHeight] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isCoverFocused, setIsCoverFocused] = useState(false)
  const [isProcessingCover, setIsProcessingCover] = useState(false)
  const { showMessage } = useDialog()
  const titleRef = useRef(null)
  const fileRef = useRef(null)
  const bannerRef = useRef(null)
  const dragRef = useRef(null)
  const resizeRef = useRef(null)

  const applyCoverFile = useCallback(async (file) => {
    setIsProcessingCover(true)
    try {
      const coverUrl = await compressCoverImage(file)
      setForm((current) => ({ ...current, coverUrl, coverPosX: 50, coverPosY: 50, coverFit: 'cover' }))
    } catch (error) {
      showMessage(error.message || '圖片處理失敗。', { title: '圖片處理失敗', variant: 'error' })
    } finally {
      setIsProcessingCover(false)
    }
  }, [showMessage])

  useEffect(() => {
    if (!isOpen) return undefined
    setForm(initialForm(item))
    setCoverHeight(null)
    setIsDragging(false)
    setIsResizing(false)
    setIsCoverFocused(false)
    const frame = requestAnimationFrame(() => titleRef.current?.focus())
    function keyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    function paste(event) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) return
      const image = [...(event.clipboardData?.items ?? [])]
        .find((entry) => entry.type?.startsWith('image/'))?.getAsFile()
      if (image) {
        event.preventDefault()
        applyCoverFile(image)
        return
      }
      const text = event.clipboardData?.getData('text')?.trim() ?? ''
      if (/^https?:\/\//i.test(text)) {
        event.preventDefault()
        setForm((current) => ({ ...current, coverUrl: text, coverPosX: 50, coverPosY: 50, coverFit: 'cover' }))
      }
    }
    window.addEventListener('keydown', keyDown)
    window.addEventListener('paste', paste)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('paste', paste)
    }
  }, [applyCoverFile, isOpen, item, onClose])

  function change(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function pointerDown(event) {
    if (!form.coverUrl) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY, px: form.coverPosX, py: form.coverPosY }
    setIsDragging(true)
  }

  function pointerMove(event) {
    if (!dragRef.current) return
    const rect = event.currentTarget.getBoundingClientRect()
    setForm((current) => ({
      ...current,
      coverPosX: Math.min(100, Math.max(0, dragRef.current.px + ((event.clientX - dragRef.current.x) / rect.width) * 100)),
      coverPosY: Math.min(100, Math.max(0, dragRef.current.py + ((event.clientY - dragRef.current.y) / rect.height) * 100)),
    }))
  }

  function endDrag() {
    dragRef.current = null
    setIsDragging(false)
  }

  function resizeDown(event) {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    resizeRef.current = { y: event.clientY, height: bannerRef.current?.getBoundingClientRect().height ?? 150 }
    setIsResizing(true)
  }

  function resizeMove(event) {
    if (!resizeRef.current) return
    setCoverHeight(Math.min(360, Math.max(90, resizeRef.current.height + event.clientY - resizeRef.current.y)))
  }

  function endResize() {
    resizeRef.current = null
    setIsResizing(false)
  }

  function submit(event) {
    event.preventDefault()
    if (isProcessingCover || !form.title.trim() || !form.url.trim()) return
    onSave({
      title: form.title.trim(), url: form.url.trim(), pageName: form.pageName.trim(),
      description: form.description.trim(), tags: form.tags, statuses: form.tags,
      status: form.tags[0] ?? '', coverUrl: form.coverUrl.trim(), coverPosX: form.coverPosX,
      coverPosY: form.coverPosY, coverFit: form.coverFit,
    })
  }

  return (
    <div className={isOpen ? 'modal-backdrop open' : 'modal-backdrop'} aria-hidden={!isOpen} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-label={item ? '編輯外部連結' : '新增外部連結'}>
        <button className="modal-close" type="button" aria-label="關閉" onClick={onClose}><FiX /></button>
        <div
          ref={bannerRef}
          className={['cover-banner', form.coverUrl ? 'has-image' : '', isDragging ? 'dragging' : ''].filter(Boolean).join(' ')}
          style={{
            height: coverHeight ? `${coverHeight}px` : undefined,
            backgroundImage: form.coverUrl ? `url("${form.coverUrl.replace(/"/g, '\\"')}")` : undefined,
            backgroundPosition: `${form.coverPosX}% ${form.coverPosY}%`, backgroundSize: form.coverFit,
          }}
          tabIndex="0"
          onFocus={() => setIsCoverFocused(true)}
          onBlur={() => setIsCoverFocused(false)}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
        >
          <button className="cover-btn button-with-icon" type="button" disabled={isProcessingCover} onPointerDown={(event) => event.stopPropagation()} onClick={() => fileRef.current?.click()}>
            {form.coverUrl ? <FiEdit3 /> : <FiImage />} {isProcessingCover ? '處理圖片中…' : form.coverUrl ? '更換封面' : '新增封面'}
          </button>
          {form.coverUrl && (
            <button className="cover-fit-btn button-with-icon" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => {
              event.stopPropagation()
              setForm((current) => ({ ...current, coverFit: current.coverFit === 'cover' ? 'contain' : 'cover' }))
            }}><FiMaximize /> {form.coverFit === 'cover' ? '顯示全圖' : '填滿裁切'}</button>
          )}
          <span className="cover-drag-hint icon-label"><FiMove /> 拖曳可調整顯示位置</span>
          {!form.coverUrl && <span className="cover-paste-hint"><FiClipboard /> {isCoverFocused ? '已就緒，貼上圖片或網址吧！' : '也可直接貼上圖片（Ctrl/Cmd+V）'}</span>}
          <div className={isResizing ? 'cover-resize-handle resizing' : 'cover-resize-handle'} onPointerDown={resizeDown} onPointerMove={resizeMove} onPointerUp={endResize} onPointerCancel={endResize} />
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={async (event) => {
          const file = event.target.files?.[0]
          if (file) await applyCoverFile(file)
          event.target.value = ''
        }} />
        <div className="modal-inner" style={{ minHeight: coverHeight ? `calc(100% - ${coverHeight}px)` : undefined }}>
          <div className="modal-eyebrow icon-label"><FiLink /> {item ? '編輯外部連結' : '新增外部連結'}</div>
          <form className="manga-form" onSubmit={submit}>
            <textarea ref={titleRef} className="title-input" name="title" rows="1" value={form.title} placeholder="輸入連結名稱…" required onChange={change} onKeyDown={(event) => event.key === 'Enter' && event.preventDefault()} />
            <div className="form-field"><label htmlFor="external-url">網址</label><input id="external-url" name="url" type="url" value={form.url} placeholder="https://…" required onChange={change} /></div>
            <div className="form-field"><label htmlFor="external-page-name">分頁名稱</label><input id="external-page-name" name="pageName" value={form.pageName} placeholder="例如：新書資訊、作品列表" onChange={change} /></div>
            <div className="form-field"><label htmlFor="external-tags">分類標籤</label><MultiSelectTags id="external-tags" values={form.tags} options={linkTags.map((tag) => ({ value: tag.name, label: tag.name, color: tag.color }))} placeholder="選擇一個或多個標籤…" onChange={(tags) => setForm((current) => ({ ...current, tags }))} /></div>
            <div className="form-field"><label htmlFor="external-description">說明</label><textarea id="external-description" className="cart-note-input" name="description" rows="4" value={form.description} placeholder="記下這個網站的用途…" onChange={change} /></div>
            <div className="modal-actions"><button className="btn-cancel" type="button" onClick={onClose}>取消</button><button className="btn-submit" type="submit" disabled={isProcessingCover}>{item ? '儲存變更' : '新增連結'}</button></div>
          </form>
        </div>
      </section>
    </div>
  )
}

export default ExternalLinkModal
