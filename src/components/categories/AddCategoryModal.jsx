import { useEffect, useRef, useState } from 'react'
import { FiBook, FiBookOpen, FiPlus, FiTag, FiX } from 'react-icons/fi'
import '../manga/MangaModal.css'
import './AddCategoryModal.css'

function AddCategoryModal({ isOpen, categories, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [useManga, setUseManga] = useState(true)
  const [useBook, setUseBook] = useState(false)
  const nameInputRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined
    setName('')
    setUseManga(true)
    setUseBook(false)
    const focusFrame = requestAnimationFrame(() => nameInputRef.current?.focus())

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  function resetAndClose() {
    setName('')
    setUseManga(true)
    setUseBook(false)
    onClose()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      nameInputRef.current?.focus()
      return
    }
    if (categories.some((category) => category.name === trimmedName)) {
      setName('')
      nameInputRef.current?.focus()
      return
    }

    const types = []
    if (useManga) types.push('manga')
    if (useBook) types.push('book')
    const didSave = await onAdd({
      name: trimmedName,
      types: types.length ? types : ['manga'],
      count: 0,
    })
    if (didSave !== false) resetAndClose()
  }

  return (
    <div
      className={isOpen ? 'modal-backdrop open' : 'modal-backdrop'}
      aria-hidden={!isOpen}
      onMouseDown={(event) => event.target === event.currentTarget && resetAndClose()}
    >
      <section className="modal-card" role="dialog" aria-modal="true" aria-label="新增分類">
        <button className="modal-close" type="button" aria-label="關閉" onClick={resetAndClose}>
          <FiX aria-hidden="true" />
        </button>
        <form className="category-modal-inner" onSubmit={handleSubmit}>
          <div className="modal-eyebrow icon-label"><FiTag aria-hidden="true" /> 新增分類</div>
          <input
            ref={nameInputRef}
            className="title-input category-title-input"
            value={name}
            placeholder="輸入分類名稱…"
            required
            onChange={(event) => setName(event.target.value)}
          />

          <div className="form-field category-type-field">
            <span className="field-label">套用範圍</span>
            <div className="checkbox-grid">
              <label className="type-check">
                <input type="checkbox" checked={useManga} onChange={(event) => setUseManga(event.target.checked)} />
                <FiBookOpen aria-hidden="true" /> 追漫
              </label>
              <label className="type-check">
                <input type="checkbox" checked={useBook} onChange={(event) => setUseBook(event.target.checked)} />
                <FiBook aria-hidden="true" /> 實體書
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn-cancel" type="button" onClick={resetAndClose}>取消</button>
            <button className="btn-submit button-with-icon" type="submit">
              <FiPlus aria-hidden="true" /> 新增分類
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default AddCategoryModal
