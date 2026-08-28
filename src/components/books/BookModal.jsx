import { useEffect, useRef, useState } from 'react'
import '../manga/MangaModal.css'
import './BookModal.css'

const EMPTY_FORM = {
  title: '',
  genre: '',
  author: '',
  publisher: '',
  shelf: '',
  jpCurrent: '',
  jpTotal: '',
  twCurrent: '',
  twTotal: '',
  status: '',
  coverUrl: '',
  coverPosX: 50,
  coverPosY: 50,
  coverFit: 'cover',
}

function getInitialForm(book, readingStatuses) {
  const fallbackStatus = readingStatuses[0]?.name ?? ''
  if (!book) return { ...EMPTY_FORM, status: fallbackStatus }

  return {
    title: book.title,
    genre: book.genre ?? '',
    author: book.author ?? '',
    publisher: book.publisher ?? '',
    shelf: book.shelf ?? '',
    jpCurrent: book.jp?.current ?? '',
    jpTotal: book.jp?.total ?? '',
    twCurrent: book.tw?.current ?? '',
    twTotal: book.tw?.total ?? '',
    status: readingStatuses.some((status) => status.name === book.status)
      ? book.status
      : fallbackStatus,
    coverUrl: book.coverUrl ?? '',
    coverPosX: book.coverPosX ?? 50,
    coverPosY: book.coverPosY ?? 50,
    coverFit: book.coverFit ?? 'cover',
  }
}

function BookModal({ isOpen, book, readingStatuses, genreOptions, onClose, onSave }) {
  const [form, setForm] = useState(() => getInitialForm(null, readingStatuses))
  const [coverHeight, setCoverHeight] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isCoverFocused, setIsCoverFocused] = useState(false)
  const titleInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const coverBannerRef = useRef(null)
  const dragRef = useRef(null)
  const resizeRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    setForm(getInitialForm(book, readingStatuses))
    setCoverHeight(null)
    setIsDragging(false)
    setIsResizing(false)
    setIsCoverFocused(false)
    const focusFrame = requestAnimationFrame(() => titleInputRef.current?.focus())
    return () => cancelAnimationFrame(focusFrame)
  }, [book, isOpen, readingStatuses])

  useEffect(() => {
    if (!isOpen) return undefined

    function resetLocalState() {
      setForm(getInitialForm(null, readingStatuses))
      setCoverHeight(null)
      setIsDragging(false)
      setIsResizing(false)
      setIsCoverFocused(false)
    }

    function handleKeyDown(event) {
      if (event.key !== 'Escape') return
      resetLocalState()
      onClose()
    }

    function handlePaste(event) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) return

      const imageItem = [...(event.clipboardData?.items ?? [])].find((item) =>
        item.type?.startsWith('image/'),
      )
      const imageFile = imageItem?.getAsFile()
      if (imageFile) {
        event.preventDefault()
        const reader = new FileReader()
        reader.onload = () => {
          setForm((currentForm) => ({
            ...currentForm,
            coverUrl: String(reader.result),
            coverPosX: 50,
            coverPosY: 50,
            coverFit: 'cover',
          }))
        }
        reader.readAsDataURL(imageFile)
        return
      }

      const pastedText = event.clipboardData?.getData('text')?.trim() ?? ''
      if (/^https?:\/\//i.test(pastedText)) {
        event.preventDefault()
        setForm((currentForm) => ({
          ...currentForm,
          coverUrl: pastedText,
          coverPosX: 50,
          coverPosY: 50,
          coverFit: 'cover',
        }))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('paste', handlePaste)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('paste', handlePaste)
    }
  }, [isOpen, onClose, readingStatuses])

  function handleFieldChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setForm((currentForm) => ({
        ...currentForm,
        coverUrl: String(reader.result),
        coverPosX: 50,
        coverPosY: 50,
        coverFit: 'cover',
      }))
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function toggleCoverFit(event) {
    event.stopPropagation()
    setForm((currentForm) => ({
      ...currentForm,
      coverFit: currentForm.coverFit === 'cover' ? 'contain' : 'cover',
    }))
  }

  function handleCoverPointerDown(event) {
    if (!form.coverUrl) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startPosX: form.coverPosX,
      startPosY: form.coverPosY,
    }
    setIsDragging(true)
  }

  function handleCoverPointerMove(event) {
    if (!dragRef.current) return

    const rect = event.currentTarget.getBoundingClientRect()
    const deltaX = ((event.clientX - dragRef.current.startX) / rect.width) * 100
    const deltaY = ((event.clientY - dragRef.current.startY) / rect.height) * 100
    const coverPosX = Math.min(100, Math.max(0, dragRef.current.startPosX + deltaX))
    const coverPosY = Math.min(100, Math.max(0, dragRef.current.startPosY + deltaY))
    setForm((currentForm) => ({ ...currentForm, coverPosX, coverPosY }))
  }

  function endCoverDrag() {
    dragRef.current = null
    setIsDragging(false)
  }

  function handleResizePointerDown(event) {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    resizeRef.current = {
      startY: event.clientY,
      startHeight: coverBannerRef.current?.getBoundingClientRect().height ?? 150,
    }
    setIsResizing(true)
  }

  function handleResizePointerMove(event) {
    if (!resizeRef.current) return
    setCoverHeight(
      Math.min(
        360,
        Math.max(90, resizeRef.current.startHeight + event.clientY - resizeRef.current.startY),
      ),
    )
  }

  function endCoverResize() {
    resizeRef.current = null
    setIsResizing(false)
  }

  function resetAndClose() {
    setForm(getInitialForm(null, readingStatuses))
    setCoverHeight(null)
    setIsDragging(false)
    setIsResizing(false)
    setIsCoverFocused(false)
    onClose()
  }

  function handleSubmit(event) {
    event.preventDefault()
    const title = form.title.trim()
    if (!title) {
      titleInputRef.current?.focus()
      return
    }

    const toNumber = (value) => Number.parseInt(value, 10) || 0
    const toOptionalNumber = (value) => (value === '' ? null : Number.parseInt(value, 10) || 0)
    onSave({
      title,
      genre: form.genre.trim(),
      author: form.author.trim(),
      publisher: form.publisher.trim(),
      shelf: form.shelf.trim(),
      status: form.status,
      jp: { current: toNumber(form.jpCurrent), total: toOptionalNumber(form.jpTotal) },
      tw: { current: toNumber(form.twCurrent), total: toOptionalNumber(form.twTotal) },
      coverUrl: form.coverUrl,
      coverPosX: form.coverPosX,
      coverPosY: form.coverPosY,
      coverFit: form.coverFit,
      legacySingleEdition: false,
      progressClass: '',
    })
  }

  const coverClassName = [
    'cover-banner',
    form.coverUrl ? 'has-image' : '',
    isDragging ? 'dragging' : '',
  ].filter(Boolean).join(' ')
  const escapedCoverUrl = form.coverUrl.replace(/"/g, '\\"')

  return (
    <div
      className={isOpen ? 'modal-backdrop open' : 'modal-backdrop'}
      aria-hidden={!isOpen}
      onMouseDown={(event) => event.target === event.currentTarget && resetAndClose()}
    >
      <section className="modal-card" role="dialog" aria-modal="true" aria-label={book ? '編輯書本' : '新增書本'}>
        <button className="modal-close" type="button" aria-label="關閉" onClick={resetAndClose}>✕</button>

        <div
          ref={coverBannerRef}
          className={coverClassName}
          style={{
            height: coverHeight ? `${coverHeight}px` : undefined,
            backgroundImage: form.coverUrl ? `url("${escapedCoverUrl}")` : undefined,
            backgroundPosition: `${form.coverPosX}% ${form.coverPosY}%`,
            backgroundSize: form.coverFit,
          }}
          tabIndex="0"
          aria-label="封面預覽，可貼上或拖曳圖片"
          onFocus={() => setIsCoverFocused(true)}
          onBlur={() => setIsCoverFocused(false)}
          onPointerDown={handleCoverPointerDown}
          onPointerMove={handleCoverPointerMove}
          onPointerUp={endCoverDrag}
          onPointerCancel={endCoverDrag}
          onPointerLeave={endCoverDrag}
        >
          <button
            className="cover-btn"
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => fileInputRef.current?.click()}
          >
            {form.coverUrl ? '✎ 更換封面' : '＋ 新增封面'}
          </button>
          {form.coverUrl && (
            <button
              className="cover-fit-btn"
              type="button"
              title="切換填滿／顯示全圖"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={toggleCoverFit}
            >
              {form.coverFit === 'cover' ? '⛶ 顯示全圖' : '⛶ 填滿裁切'}
            </button>
          )}
          <span className="cover-drag-hint">🖱️ 拖曳可調整顯示位置</span>
          {!form.coverUrl && (
            <span className="cover-paste-hint">
              {isCoverFocused ? '✅ 已就緒，貼上圖片或圖片網址吧！' : '📋 也可直接貼上圖片或圖片網址（Ctrl/Cmd+V）'}
            </span>
          )}
          <div
            className={isResizing ? 'cover-resize-handle resizing' : 'cover-resize-handle'}
            title="拖曳調整封面高度"
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={endCoverResize}
            onPointerCancel={endCoverResize}
          />
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />

        <div className="modal-inner" style={{ minHeight: coverHeight ? `calc(100% - ${coverHeight}px)` : undefined }}>
          <div className="modal-eyebrow">{book ? '✎ 編輯書本' : '📌 新增書本'}</div>
          <form className="book-form" onSubmit={handleSubmit}>
            <input
              ref={titleInputRef}
              className="title-input"
              name="title"
              value={form.title}
              placeholder="輸入書名…"
              required
              onChange={handleFieldChange}
            />

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="book-genre">分類</label>
                <select id="book-genre" name="genre" value={form.genre} onChange={handleFieldChange}>
                  <option value="">未分類</option>
                  {form.genre && !genreOptions.includes(form.genre) && <option value={form.genre}>{form.genre}（未收錄分類）</option>}
                  {genreOptions.map((genre) => <option value={genre} key={genre}>{genre}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="book-author">作者</label>
                <input id="book-author" name="author" value={form.author} placeholder="例如：尾田榮一郎" onChange={handleFieldChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="book-publisher">出版社</label>
                <input id="book-publisher" name="publisher" value={form.publisher} placeholder="例如：尖端出版" onChange={handleFieldChange} />
              </div>
              <div className="form-field">
                <label htmlFor="book-shelf">書架位置</label>
                <input id="book-shelf" name="shelf" value={form.shelf} placeholder="例如：書架 A-3" onChange={handleFieldChange} />
              </div>
            </div>

            <EditionFields label="🇯🇵 日版" prefix="jp" form={form} onChange={handleFieldChange} />
            <EditionFields label="🇹🇼 台版" prefix="tw" form={form} onChange={handleFieldChange} />

            <div className="form-field">
              <label htmlFor="book-status">閱讀狀態</label>
              <select id="book-status" name="status" value={form.status} onChange={handleFieldChange}>
                {readingStatuses.map((status) => <option value={status.name} key={status.name}>{status.name}</option>)}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" type="button" onClick={resetAndClose}>取消</button>
              <button className="btn-submit" type="submit">{book ? '儲存變更' : '貼上書架'}</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

function EditionFields({ label, prefix, form, onChange }) {
  const currentName = `${prefix}Current`
  const totalName = `${prefix}Total`
  return (
    <div className="edition-group">
      <div className="edition-label">{label}</div>
      <div className="form-row">
        <div className="form-field">
          <label htmlFor={`book-${currentName}`}>已收冊數</label>
          <input id={`book-${currentName}`} name={currentName} type="number" min="0" value={form[currentName]} placeholder="0" onChange={onChange} />
        </div>
        <div className="form-field">
          <label htmlFor={`book-${totalName}`}>全套冊數（留白＝收集中）</label>
          <input id={`book-${totalName}`} name={totalName} type="number" min="0" value={form[totalName]} placeholder="例如：25" onChange={onChange} />
        </div>
      </div>
    </div>
  )
}

export default BookModal
