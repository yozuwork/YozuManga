import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FiClipboard,
  FiEdit3,
  FiGlobe,
  FiImage,
  FiMaximize,
  FiMove,
  FiTag,
  FiX,
} from 'react-icons/fi'
import '../manga/MangaModal.css'
import './BookModal.css'
import { useDialog } from '../common/DialogProvider.jsx'
import MultiSelectTags from '../common/MultiSelectTags.jsx'
import { compressCoverImage } from '../../utils/compressCoverImage.js'
import { getCurrentLocalDateTime } from '../../utils/dateTime.js'

const EMPTY_FORM = {
  title: '',
  originalTitle: '',
  genres: [],
  author: '',
  updateTime: '',
  publisher: '',
  shelf: '',
  jpCurrent: '',
  jpTotal: '',
  twCurrent: '',
  twTotal: '',
  statuses: [],
  coverUrl: '',
  coverPosX: 50,
  coverPosY: 50,
  coverFit: 'cover',
  relatedWorkKeys: [],
}

function getInitialForm(book, readingStatuses) {
  const fallbackStatus = readingStatuses[0]?.name ?? ''
  if (!book) {
    return {
      ...EMPTY_FORM,
      statuses: fallbackStatus ? [fallbackStatus] : [],
      updateTime: getCurrentLocalDateTime(),
    }
  }

  return {
    title: book.title,
    originalTitle: book.originalTitle ?? '',
    genres: book.genres?.length ? book.genres : book.genre ? [book.genre] : [],
    author: book.author ?? '',
    updateTime:
      book.updateTimeMode !== 'auto' && book.updateTime
        ? book.updateTime
        : getCurrentLocalDateTime(),
    publisher: book.publisher ?? '',
    shelf: book.shelf ?? '',
    jpCurrent: book.jp?.current ?? '',
    jpTotal: book.jp?.total ?? '',
    twCurrent: book.tw?.current ?? '',
    twTotal: book.tw?.total ?? '',
    statuses: (book.statuses?.length ? book.statuses : book.status ? [book.status] : [fallbackStatus])
      .filter((name) => readingStatuses.some((status) => status.name === name)),
    coverUrl: book.coverUrl ?? '',
    coverPosX: book.coverPosX ?? 50,
    coverPosY: book.coverPosY ?? 50,
    coverFit: book.coverFit ?? 'cover',
    relatedWorkKeys: (book.relatedWorks?.length
      ? book.relatedWorks
      : book.relatedWork ? [book.relatedWork] : [])
      .map((work) => `${work.type}:${work.id}`),
  }
}

function BookModal({
  isOpen,
  book,
  readingStatuses,
  genreOptions,
  relatedWorks,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(() => getInitialForm(null, readingStatuses))
  const [coverHeight, setCoverHeight] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isCoverFocused, setIsCoverFocused] = useState(false)
  const [isUpdateTimeEdited, setIsUpdateTimeEdited] = useState(false)
  const [isProcessingCover, setIsProcessingCover] = useState(false)
  const { showMessage } = useDialog()
  const titleInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const coverBannerRef = useRef(null)
  const dragRef = useRef(null)
  const resizeRef = useRef(null)
  const relationOptions = relatedWorks
    .filter((work) => !(work.type === 'book' && work.id === book?.id))
    .map((work) => ({
      value: `${work.type}:${work.id}`,
      label: work.title,
      meta: work.type === 'book' ? '實體書' : '追漫',
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'zh-Hant'))

  const applyCoverFile = useCallback(async (file) => {
    setIsProcessingCover(true)
    try {
      const coverUrl = await compressCoverImage(file)
      setForm((currentForm) => ({
        ...currentForm,
        coverUrl,
        coverPosX: 50,
        coverPosY: 50,
        coverFit: 'cover',
      }))
    } catch (error) {
      showMessage(error.message || '圖片處理失敗。', { title: '圖片處理失敗', variant: 'error' })
    } finally {
      setIsProcessingCover(false)
    }
  }, [showMessage])

  useEffect(() => {
    if (!isOpen) return undefined

    setForm(getInitialForm(book, readingStatuses))
    setIsUpdateTimeEdited(false)
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
      setIsUpdateTimeEdited(false)
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
        applyCoverFile(imageFile)
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
  }, [applyCoverFile, isOpen, onClose, readingStatuses])

  function handleFieldChange(event) {
    const { name, value } = event.target
    if (name === 'updateTime') setIsUpdateTimeEdited(true)
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''
    await applyCoverFile(file)
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
    setIsUpdateTimeEdited(false)
    setCoverHeight(null)
    setIsDragging(false)
    setIsResizing(false)
    setIsCoverFocused(false)
    onClose()
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (isProcessingCover) return
    const title = form.title.trim()
    if (!title) {
      titleInputRef.current?.focus()
      return
    }

    const toNumber = (value) => Number.parseInt(value, 10) || 0
    const toOptionalNumber = (value) => (value === '' ? null : Number.parseInt(value, 10) || 0)
    const keepManualUpdateTime = isUpdateTimeEdited
      ? Boolean(form.updateTime)
      : Boolean(book?.updateTime && book.updateTimeMode !== 'auto')
    const selectedRelatedWorks = form.relatedWorkKeys
      .map((key) => relatedWorks.find((work) => `${work.type}:${work.id}` === key))
      .filter(Boolean)
      .map((work) => ({ id: work.id, type: work.type, title: work.title }))

    onSave({
      title,
      originalTitle: form.originalTitle.trim(),
      genre: form.genres[0] ?? '',
      genres: form.genres,
      author: form.author.trim(),
      updateTime: keepManualUpdateTime ? form.updateTime : getCurrentLocalDateTime(),
      updateTimeMode: keepManualUpdateTime ? 'manual' : 'auto',
      publisher: form.publisher.trim(),
      shelf: form.shelf.trim(),
      status: form.statuses[0] ?? '',
      statuses: form.statuses,
      jp: { current: toNumber(form.jpCurrent), total: toOptionalNumber(form.jpTotal) },
      tw: { current: toNumber(form.twCurrent), total: toOptionalNumber(form.twTotal) },
      coverUrl: form.coverUrl,
      coverPosX: form.coverPosX,
      coverPosY: form.coverPosY,
      coverFit: form.coverFit,
      legacySingleEdition: false,
      progressClass: '',
      relatedWork: selectedRelatedWorks[0] ?? null,
      relatedWorks: selectedRelatedWorks,
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
        <button className="modal-close" type="button" aria-label="關閉" onClick={resetAndClose}>
          <FiX aria-hidden="true" />
        </button>

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
            className="cover-btn button-with-icon"
            type="button"
            disabled={isProcessingCover}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => fileInputRef.current?.click()}
          >
            {form.coverUrl ? <FiEdit3 aria-hidden="true" /> : <FiImage aria-hidden="true" />}
            {isProcessingCover ? '處理圖片中…' : form.coverUrl ? '更換封面' : '新增封面'}
          </button>
          {form.coverUrl && (
            <button
              className="cover-fit-btn button-with-icon"
              type="button"
              title="切換填滿／顯示全圖"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={toggleCoverFit}
            >
              <FiMaximize aria-hidden="true" />
              {form.coverFit === 'cover' ? '顯示全圖' : '填滿裁切'}
            </button>
          )}
          <span className="cover-drag-hint icon-label"><FiMove aria-hidden="true" /> 拖曳可調整顯示位置</span>
          {!form.coverUrl && (
            <span className="cover-paste-hint">
              <FiClipboard aria-hidden="true" />
              {isCoverFocused ? '已就緒，貼上圖片或圖片網址吧！' : '也可直接貼上圖片或圖片網址（Ctrl/Cmd+V）'}
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
          <div className="modal-eyebrow icon-label">
            {book ? <FiEdit3 aria-hidden="true" /> : <FiTag aria-hidden="true" />}
            {book ? '編輯書本' : '新增書本'}
          </div>
          <form className="book-form" onSubmit={handleSubmit}>
            <textarea
              ref={titleInputRef}
              className="title-input"
              name="title"
              rows="1"
              value={form.title}
              placeholder="輸入書名…"
              required
              onChange={handleFieldChange}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.preventDefault()
              }}
            />

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="book-original-title">原作名稱</label>
                <input
                  id="book-original-title"
                  name="originalTitle"
                  value={form.originalTitle}
                  placeholder="例如：原文或日文名稱"
                  onChange={handleFieldChange}
                />
              </div>
              <div className="form-field">
                <label htmlFor="book-update-time">更新時間</label>
                <input
                  id="book-update-time"
                  name="updateTime"
                  type="datetime-local"
                  value={form.updateTime}
                  onChange={handleFieldChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="book-genres">分類</label>
                <MultiSelectTags
                  id="book-genres"
                  values={form.genres}
                  options={genreOptions}
                  placeholder=""
                  onChange={(genres) => setForm((currentForm) => ({ ...currentForm, genres }))}
                />
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

            <EditionFields label="JP 日版" prefix="jp" form={form} onChange={handleFieldChange} />
            <EditionFields label="TW 台版" prefix="tw" form={form} onChange={handleFieldChange} />

            <div className="form-field">
              <label htmlFor="book-statuses">閱讀狀態</label>
              <MultiSelectTags
                id="book-statuses"
                values={form.statuses}
                options={readingStatuses.map((status) => ({
                  value: status.name,
                  label: status.name,
                  color: status.color,
                }))}
                placeholder="選擇一個或多個閱讀狀態…"
                onChange={(statuses) => setForm((currentForm) => ({ ...currentForm, statuses }))}
              />
            </div>

            <div className="form-field">
              <label htmlFor="book-related-work">關聯作品</label>
              <MultiSelectTags
                id="book-related-work"
                values={form.relatedWorkKeys}
                options={relationOptions}
                placeholder="輸入書名搜尋追漫或實體書…"
                onChange={(relatedWorkKeys) =>
                  setForm((currentForm) => ({ ...currentForm, relatedWorkKeys }))
                }
              />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" type="button" onClick={resetAndClose}>取消</button>
              <button className="btn-submit" type="submit" disabled={isProcessingCover}>
                {isProcessingCover ? '處理圖片中…' : book ? '儲存變更' : '貼上書架'}
              </button>
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
      <div className="edition-label icon-label"><FiGlobe aria-hidden="true" /> {label}</div>
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
