import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FiClipboard,
  FiEdit3,
  FiImage,
  FiMaximize,
  FiMove,
  FiTag,
  FiX,
} from 'react-icons/fi'
import './MangaModal.css'
import { useDialog } from '../common/DialogProvider.jsx'
import SearchableSelect from '../common/SearchableSelect.jsx'
import { compressCoverImage } from '../../utils/compressCoverImage.js'
import { getCurrentLocalDateTime } from '../../utils/dateTime.js'

const EMPTY_FORM = {
  title: '',
  originalTitle: '',
  genre: '',
  author: '',
  updateTime: '',
  current: '',
  total: '',
  link: '',
  status: '',
  coverUrl: '',
  coverPosX: 50,
  coverPosY: 50,
  coverFit: 'cover',
  relatedWorkKey: '',
}

function getInitialForm(manga, readingStatuses) {
  if (!manga) {
    return {
      ...EMPTY_FORM,
      status: readingStatuses[0]?.name ?? '',
      updateTime: getCurrentLocalDateTime(),
    }
  }

  return {
    title: manga.title,
    originalTitle: manga.originalTitle ?? '',
    genre: manga.genre ?? '',
    author: manga.author ?? '',
    updateTime:
      manga.updateTimeMode !== 'auto' && manga.updateTime
        ? manga.updateTime
        : getCurrentLocalDateTime(),
    current: manga.current ?? '',
    total: manga.total ?? '',
    link: manga.link ?? '',
    status: readingStatuses.some((status) => status.name === manga.status)
      ? manga.status
      : readingStatuses[0]?.name ?? '',
    coverUrl: manga.coverUrl ?? '',
    coverPosX: manga.coverPosX ?? 50,
    coverPosY: manga.coverPosY ?? 50,
    coverFit: manga.coverFit ?? 'cover',
    relatedWorkKey: manga.relatedWork
      ? `${manga.relatedWork.type}:${manga.relatedWork.id}`
      : '',
  }
}

function MangaModal({
  isOpen,
  manga,
  readingStatuses,
  genreOptions,
  onClose,
  onSave,
  relatedWorks,
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
    .filter((work) => !(work.type === 'manga' && work.id === manga?.id))
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

    setForm(getInitialForm(manga, readingStatuses))
    setIsUpdateTimeEdited(false)
    setCoverHeight(null)
    setIsDragging(false)
    setIsResizing(false)
    setIsCoverFocused(false)

    const focusFrame = requestAnimationFrame(() => titleInputRef.current?.focus())
    return () => cancelAnimationFrame(focusFrame)
  }, [isOpen, manga, readingStatuses])

  useEffect(() => {
    if (!isOpen) return undefined

    function handleKeyDown(event) {
      if (event.key !== 'Escape') return

      setForm(getInitialForm(null, readingStatuses))
      setIsUpdateTimeEdited(false)
      setCoverHeight(null)
      setIsDragging(false)
      setIsResizing(false)
      setIsCoverFocused(false)
      onClose()
    }

    function handlePaste(event) {
      const targetTag = event.target?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag)) return

      const items = event.clipboardData?.items
      if (items) {
        for (const item of items) {
          if (!item.type?.startsWith('image/')) continue

          const file = item.getAsFile()
          if (!file) continue

          event.preventDefault()
          applyCoverFile(file)
          return
        }
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

    const nextHeight = Math.min(
      360,
      Math.max(90, resizeRef.current.startHeight + event.clientY - resizeRef.current.startY),
    )
    setCoverHeight(nextHeight)
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

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) resetAndClose()
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (isProcessingCover) return
    const title = form.title.trim()
    if (!title) {
      titleInputRef.current?.focus()
      return
    }

    const keepManualUpdateTime = isUpdateTimeEdited
      ? Boolean(form.updateTime)
      : Boolean(manga?.updateTime && manga.updateTimeMode !== 'auto')
    const relatedWork = relatedWorks.find(
      (work) => `${work.type}:${work.id}` === form.relatedWorkKey,
    )

    onSave({
      title,
      originalTitle: form.originalTitle.trim(),
      genre: form.genre.trim(),
      author: form.author.trim(),
      updateTime: keepManualUpdateTime ? form.updateTime : getCurrentLocalDateTime(),
      updateTimeMode: keepManualUpdateTime ? 'manual' : 'auto',
      current: Number.parseInt(form.current, 10) || 0,
      total: form.total === '' ? null : Number.parseInt(form.total, 10) || 0,
      link: form.link.trim(),
      status: form.status,
      coverUrl: form.coverUrl,
      coverPosX: form.coverPosX,
      coverPosY: form.coverPosY,
      coverFit: form.coverFit,
      relatedWork: relatedWork
        ? { id: relatedWork.id, type: relatedWork.type, title: relatedWork.title }
        : null,
    })
  }

  const coverClassName = [
    'cover-banner',
    form.coverUrl ? 'has-image' : '',
    isDragging ? 'dragging' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const escapedCoverUrl = form.coverUrl.replace(/"/g, '\\"')
  const coverStyle = {
    height: coverHeight ? `${coverHeight}px` : undefined,
    backgroundImage: form.coverUrl ? `url("${escapedCoverUrl}")` : undefined,
    backgroundPosition: `${form.coverPosX}% ${form.coverPosY}%`,
    backgroundSize: form.coverFit,
  }

  return (
    <div
      className={isOpen ? 'modal-backdrop open' : 'modal-backdrop'}
      aria-hidden={!isOpen}
      onMouseDown={handleBackdropClick}
    >
      <section className="modal-card" role="dialog" aria-modal="true" aria-label={manga ? '編輯追漫' : '新增追漫'}>
        <button className="modal-close" type="button" aria-label="關閉" onClick={resetAndClose}>
          <FiX aria-hidden="true" />
        </button>

        <div
          ref={coverBannerRef}
          className={coverClassName}
          style={coverStyle}
          role="button"
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
              {isCoverFocused
                ? '已就緒，貼上圖片或圖片網址吧！'
                : '也可直接貼上圖片或圖片網址（Ctrl/Cmd+V）'}
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />

        <div
          className="modal-inner"
          style={{ minHeight: coverHeight ? `calc(100% - ${coverHeight}px)` : undefined }}
        >
          <div className="modal-eyebrow icon-label">
            {manga ? <FiEdit3 aria-hidden="true" /> : <FiTag aria-hidden="true" />}
            {manga ? '編輯追漫作品' : '新增追漫作品'}
          </div>

          <form className="manga-form" onSubmit={handleSubmit}>
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
                <label htmlFor="manga-original-title">原作名稱</label>
                <input
                  id="manga-original-title"
                  name="originalTitle"
                  value={form.originalTitle}
                  placeholder="例如：原文或日文名稱"
                  onChange={handleFieldChange}
                />
              </div>
              <div className="form-field">
                <label htmlFor="manga-update-time">更新時間</label>
                <input
                  id="manga-update-time"
                  name="updateTime"
                  type="datetime-local"
                  value={form.updateTime}
                  onChange={handleFieldChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="manga-genre">分類</label>
                <select id="manga-genre" name="genre" value={form.genre} onChange={handleFieldChange}>
                  <option value="">未分類</option>
                  {form.genre && !genreOptions.includes(form.genre) && (
                    <option value={form.genre}>{form.genre}（未收錄分類）</option>
                  )}
                  {genreOptions.map((genre) => (
                    <option value={genre} key={genre}>{genre}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="manga-author">作者</label>
                <input
                  id="manga-author"
                  name="author"
                  value={form.author}
                  placeholder="例如：尾田榮一郎"
                  onChange={handleFieldChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="manga-current">目前已讀話數</label>
                <input
                  id="manga-current"
                  name="current"
                  type="number"
                  min="0"
                  value={form.current}
                  placeholder="0"
                  onChange={handleFieldChange}
                />
              </div>
              <div className="form-field">
                <label htmlFor="manga-total">總話數（留白＝連載中）</label>
                <input
                  id="manga-total"
                  name="total"
                  type="number"
                  min="0"
                  value={form.total}
                  placeholder="例如：120"
                  onChange={handleFieldChange}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="manga-link">作品連結（選填）</label>
              <input
                id="manga-link"
                name="link"
                type="url"
                value={form.link}
                placeholder="https://…"
                onChange={handleFieldChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="manga-status">閱讀狀態</label>
              <select id="manga-status" name="status" value={form.status} onChange={handleFieldChange}>
                {readingStatuses.map((status) => (
                  <option value={status.name} key={status.name}>{status.name}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="manga-related-work">關聯作品</label>
              <SearchableSelect
                id="manga-related-work"
                value={form.relatedWorkKey}
                options={relationOptions}
                placeholder="輸入書名搜尋追漫或實體書…"
                onChange={(relatedWorkKey) =>
                  setForm((currentForm) => ({ ...currentForm, relatedWorkKey }))
                }
              />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" type="button" onClick={resetAndClose}>取消</button>
              <button className="btn-submit" type="submit" disabled={isProcessingCover}>
                {isProcessingCover ? '處理圖片中…' : manga ? '儲存變更' : '貼上書架'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

export default MangaModal
