import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FiClipboard,
  FiEdit3,
  FiHeart,
  FiImage,
  FiMaximize,
  FiMove,
  FiPlus,
  FiX,
} from 'react-icons/fi'
import MultiSelectTags from '../common/MultiSelectTags.jsx'
import { useDialog } from '../common/DialogProvider.jsx'
import { compressCoverImage } from '../../utils/compressCoverImage.js'
import { getCurrentLocalDateTime } from '../../utils/dateTime.js'
import '../manga/MangaModal.css'
import './CartItemModal.css'

const EMPTY_FORM = {
  title: '',
  author: '',
  format: 'physical',
  purchaseVolumes: [''],
  statuses: [],
  purchased: false,
  purchasedDate: '',
  note: '',
  sourceUrls: [''],
  coverUrl: '',
  coverPosX: 50,
  coverPosY: 50,
  coverFit: 'cover',
  relatedWorkKeys: [],
}

function getInitialForm(item, defaultTemplate) {
  if (!item) return { ...EMPTY_FORM, ...defaultTemplate }
  return {
    title: item.title ?? '',
    author: item.author ?? '',
    format: item.format ?? 'physical',
    purchaseVolumes: item.purchaseVolumes?.length
      ? item.purchaseVolumes.map(String)
      : item.volumeNote
        ? item.volumeNote.split(/[,，、]/).map((value) => value.trim()).filter(Boolean)
        : [''],
    statuses: item.statuses?.length
      ? item.statuses
      : item.status ? [item.status] : [{ high: '準備購買', medium: '有興趣', low: '先收藏' }[item.priority] ?? '有興趣'],
    purchased: Boolean(item.purchased),
    purchasedDate: item.purchasedDate ?? (item.purchased ? getCurrentLocalDateTime().slice(0, 10) : ''),
    note: item.note ?? '',
    sourceUrls: item.sourceUrls?.length
      ? item.sourceUrls
      : item.sourceUrl ? [item.sourceUrl] : [''],
    coverUrl: item.coverUrl ?? '',
    coverPosX: item.coverPosX ?? 50,
    coverPosY: item.coverPosY ?? 50,
    coverFit: item.coverFit ?? 'cover',
    relatedWorkKeys: (item.relatedWorks ?? []).map((work) => `${work.type}:${work.id}`),
  }
}

function CartItemModal({
  isOpen,
  item,
  relatedWorks,
  readingStatuses,
  defaultTemplate,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [coverHeight, setCoverHeight] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isCoverFocused, setIsCoverFocused] = useState(false)
  const [isProcessingCover, setIsProcessingCover] = useState(false)
  const { showMessage } = useDialog()
  const titleInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const coverBannerRef = useRef(null)
  const dragRef = useRef(null)
  const resizeRef = useRef(null)
  const relationOptions = useMemo(() => relatedWorks
    .map((work) => ({
      value: `${work.type}:${work.id}`,
      label: work.title,
      meta: work.type === 'book' ? '實體書' : '電子書',
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'zh-Hant')), [relatedWorks])

  const applyCoverFile = useCallback(async (file) => {
    setIsProcessingCover(true)
    try {
      const coverUrl = await compressCoverImage(file)
      setForm((current) => ({
        ...current,
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
    setForm(getInitialForm(item, defaultTemplate))
    setCoverHeight(null)
    setIsDragging(false)
    setIsResizing(false)
    setIsCoverFocused(false)
    const focusFrame = requestAnimationFrame(() => titleInputRef.current?.focus())
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    function handlePaste(event) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)) return
      const imageItem = [...(event.clipboardData?.items ?? [])].find((entry) =>
        entry.type?.startsWith('image/'),
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
        setForm((current) => ({
          ...current,
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
      cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('paste', handlePaste)
    }
  }, [applyCoverFile, defaultTemplate, isOpen, item, onClose])

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''
    await applyCoverFile(file)
  }

  function toggleCoverFit(event) {
    event.stopPropagation()
    setForm((current) => ({
      ...current,
      coverFit: current.coverFit === 'cover' ? 'contain' : 'cover',
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
    setForm((current) => ({
      ...current,
      coverPosX: Math.min(100, Math.max(0, dragRef.current.startPosX + deltaX)),
      coverPosY: Math.min(100, Math.max(0, dragRef.current.startPosY + deltaY)),
    }))
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
    setCoverHeight(Math.min(
      360,
      Math.max(90, resizeRef.current.startHeight + event.clientY - resizeRef.current.startY),
    ))
  }

  function endCoverResize() {
    resizeRef.current = null
    setIsResizing(false)
  }

  function handleChange(event) {
    const { name, value, checked, type } = event.target
    if (name === 'purchased') {
      setForm((current) => ({
        ...current,
        purchased: checked,
        purchasedDate: checked
          ? current.purchasedDate || getCurrentLocalDateTime().slice(0, 10)
          : '',
      }))
      return
    }
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function updatePurchaseVolume(index, value) {
    setForm((current) => ({
      ...current,
      purchaseVolumes: current.purchaseVolumes.map((volume, volumeIndex) =>
        volumeIndex === index ? value : volume,
      ),
    }))
  }

  function addPurchaseVolume() {
    setForm((current) => ({
      ...current,
      purchaseVolumes: [...current.purchaseVolumes, ''],
    }))
  }

  function removePurchaseVolume(index) {
    setForm((current) => ({
      ...current,
      purchaseVolumes: current.purchaseVolumes.length === 1
        ? ['']
        : current.purchaseVolumes.filter((_, volumeIndex) => volumeIndex !== index),
    }))
  }

  function updateSourceUrl(index, value) {
    setForm((current) => ({
      ...current,
      sourceUrls: current.sourceUrls.map((url, urlIndex) => urlIndex === index ? value : url),
    }))
  }

  function addSourceUrl() {
    setForm((current) => ({ ...current, sourceUrls: [...current.sourceUrls, ''] }))
  }

  function removeSourceUrl(index) {
    setForm((current) => ({
      ...current,
      sourceUrls: current.sourceUrls.filter((_, urlIndex) => urlIndex !== index),
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (isProcessingCover) return
    const title = form.title.trim()
    if (!title) {
      titleInputRef.current?.focus()
      return
    }
    const selectedRelatedWorks = form.relatedWorkKeys
      .map((key) => relatedWorks.find((work) => `${work.type}:${work.id}` === key))
      .filter(Boolean)
      .map((work) => ({ id: work.id, type: work.type, title: work.title }))

    const purchaseVolumes = form.purchaseVolumes.map((value) => value.trim()).filter(Boolean)
    const sourceUrls = form.sourceUrls.map((value) => value.trim()).filter(Boolean)

    onSave({
      title,
      author: form.author.trim(),
      format: form.format,
      purchaseVolumes,
      volumeNote: purchaseVolumes.join('、'),
      status: form.statuses?.[0] ?? '',
      statuses: form.statuses ?? [],
      purchased: form.purchased,
      purchasedDate: form.purchased ? form.purchasedDate : '',
      note: form.note.trim(),
      sourceUrls,
      sourceUrl: sourceUrls[0] ?? '',
      coverUrl: form.coverUrl.trim(),
      coverPosX: form.coverPosX,
      coverPosY: form.coverPosY,
      coverFit: form.coverFit,
      relatedWorks: selectedRelatedWorks,
    })
  }

  return (
    <div
      className={isOpen ? 'modal-backdrop open' : 'modal-backdrop'}
      aria-hidden={!isOpen}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="modal-card cart-modal" role="dialog" aria-modal="true" aria-label={item ? '編輯購物車項目' : '新增購物車項目'}>
        <button className="modal-close" type="button" aria-label="關閉" onClick={onClose}>
          <FiX aria-hidden="true" />
        </button>
        <div
          ref={coverBannerRef}
          className={[
            'cover-banner',
            form.coverUrl ? 'has-image' : '',
            isDragging ? 'dragging' : '',
          ].filter(Boolean).join(' ')}
          style={{
            height: coverHeight ? `${coverHeight}px` : undefined,
            backgroundImage: form.coverUrl
              ? `url("${form.coverUrl.replace(/"/g, '\\"')}")`
              : undefined,
            backgroundPosition: `${form.coverPosX}% ${form.coverPosY}%`,
            backgroundSize: form.coverFit,
          }}
          role="button"
          tabIndex="0"
          aria-label="封面預覽，可上傳、貼上或拖曳圖片"
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
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
        <div
          className="modal-inner cart-modal-inner"
          style={{ minHeight: coverHeight ? `calc(100% - ${coverHeight}px)` : undefined }}
        >
          <div className="modal-eyebrow icon-label">
            {item ? <FiEdit3 aria-hidden="true" /> : <FiHeart aria-hidden="true" />}
            {item ? '編輯興趣書單' : '新增感興趣的書'}
          </div>
          <form className="manga-form" onSubmit={handleSubmit}>
            <textarea
              ref={titleInputRef}
              className="title-input"
              name="title"
              rows="1"
              value={form.title}
              placeholder="輸入書名…"
              required
              onChange={handleChange}
              onKeyDown={(event) => event.key === 'Enter' && event.preventDefault()}
            />

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="cart-author">作者</label>
                <input id="cart-author" name="author" value={form.author} placeholder="作者名稱" onChange={handleChange} />
              </div>
              <div className="form-field">
                <label htmlFor="cart-format">想看的形式</label>
                <select id="cart-format" name="format" value={form.format} onChange={handleChange}>
                  <option value="physical">實體書</option>
                  <option value="digital">電子書</option>
                  <option value="either">實體／電子皆可</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="cart-volume-0">購物卷集</label>
              <div className="cart-volume-list">
                {form.purchaseVolumes.map((volume, index) => (
                  <div className="cart-volume-row" key={index}>
                    <input
                      id={`cart-volume-${index}`}
                      value={volume}
                      inputMode="numeric"
                      placeholder={index === 0 ? '例如：4' : `第 ${index + 1} 個卷集`}
                      aria-label={`購物卷集 ${index + 1}`}
                      onChange={(event) => updatePurchaseVolume(index, event.target.value)}
                    />
                    {form.purchaseVolumes.length > 1 && (
                      <button
                        className="cart-volume-remove"
                        type="button"
                        aria-label={`移除第 ${index + 1} 個卷集`}
                        onClick={() => removePurchaseVolume(index)}
                      >
                        <FiX aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button className="cart-volume-add button-with-icon" type="button" onClick={addPurchaseVolume}>
                <FiPlus aria-hidden="true" /> 新增卷集
              </button>
            </div>

            <div className="form-field">
              <label htmlFor="cart-statuses">興趣標籤</label>
              <MultiSelectTags
                id="cart-statuses"
                values={form.statuses ?? []}
                options={readingStatuses.map((status) => ({
                  value: status.name,
                  label: status.name,
                  color: status.color,
                }))}
                placeholder="選擇一個或多個標籤…"
                onChange={(statuses) => setForm((current) => ({ ...current, statuses }))}
              />
            </div>

            <div className="cart-purchase-state">
              <label className="cart-purchased-check" htmlFor="cart-purchased">
                <input
                  id="cart-purchased"
                  name="purchased"
                  type="checkbox"
                  checked={form.purchased}
                  onChange={handleChange}
                />
                <span>已購買</span>
              </label>
              {form.purchased && (
                <div className="form-field cart-purchased-date">
                  <label htmlFor="cart-purchased-date">購買日期</label>
                  <input
                    id="cart-purchased-date"
                    name="purchasedDate"
                    type="date"
                    value={form.purchasedDate}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="cart-related">關聯實體書／電子書</label>
              <MultiSelectTags
                id="cart-related"
                values={form.relatedWorkKeys}
                options={relationOptions}
                placeholder="輸入書名搜尋並建立關聯…"
                onChange={(relatedWorkKeys) => setForm((current) => ({ ...current, relatedWorkKeys }))}
              />
            </div>

            <div className="form-field">
              <label htmlFor="cart-source-url-0">作品連結（選填）</label>
              <div className="cart-link-list">
                {form.sourceUrls.map((url, index) => (
                  <div className="cart-link-row" key={index}>
                    <input
                      id={`cart-source-url-${index}`}
                      type="url"
                      value={url}
                      placeholder="https://…"
                      aria-label={`作品連結 ${index + 1}`}
                      onChange={(event) => updateSourceUrl(index, event.target.value)}
                    />
                    {index === 0 ? (
                      <button
                        className="cart-link-action add"
                        type="button"
                        title="新增作品連結"
                        aria-label="新增作品連結"
                        onClick={addSourceUrl}
                      >
                        <FiPlus aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        className="cart-link-action remove"
                        type="button"
                        title="刪除這個作品連結"
                        aria-label={`刪除作品連結 ${index + 1}`}
                        onClick={() => removeSourceUrl(index)}
                      >
                        <FiX aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="cart-cover">封面圖片網址</label>
              <input id="cart-cover" name="coverUrl" type="url" value={form.coverUrl} placeholder="未填時會嘗試使用關聯作品封面" onChange={handleChange} />
            </div>

            <div className="form-field">
              <label htmlFor="cart-note">備註</label>
              <textarea id="cart-note" className="cart-note-input" name="note" rows="3" value={form.note} placeholder="版本、特典、感興趣的原因…" onChange={handleChange} />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" type="button" onClick={onClose}>取消</button>
              <button className="btn-submit" type="submit" disabled={isProcessingCover}>
                {isProcessingCover ? '處理圖片中…' : item ? '儲存變更' : '加入書單'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

export default CartItemModal
