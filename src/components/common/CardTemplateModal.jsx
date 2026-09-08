import { useEffect, useState } from 'react'
import { FiCopy, FiX } from 'react-icons/fi'
import MultiSelectTags from './MultiSelectTags.jsx'
import './CardTemplateModal.css'

const titles = {
  manga: '追漫卡片模板',
  book: '實體書卡片模板',
  cart: '興趣書單卡片模板',
}

function CardTemplateModal({ isOpen, type, template, readingStatuses = [], onClose, onSave }) {
  const [form, setForm] = useState(template)

  useEffect(() => {
    if (!isOpen) return undefined
    setForm(template)
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, template])

  if (!isOpen) return null

  const statusOptions = readingStatuses.map((status) => ({
    value: status.name,
    label: status.name,
    color: status.color,
  }))

  return (
    <div className="template-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="template-modal" role="dialog" aria-modal="true" aria-label={titles[type]}>
        <button className="template-close" type="button" aria-label="關閉" onClick={onClose}>
          <FiX aria-hidden="true" />
        </button>
        <div className="template-heading">
          <FiCopy aria-hidden="true" />
          <div>
            <h2>{titles[type]}</h2>
            <p>只套用到之後新增的卡片，不會修改現有資料。</p>
          </div>
        </div>

        {(type === 'manga' || type === 'book') && (
          <div className="form-field">
            <label htmlFor={`${type}-template-status`}>預設閱讀狀態</label>
            <MultiSelectTags
              id={`${type}-template-status`}
              values={form.statuses ?? []}
              options={statusOptions}
              placeholder="選擇新增卡片的預設狀態…"
              onChange={(statuses) => setForm((current) => ({ ...current, statuses }))}
            />
          </div>
        )}

        {type === 'manga' && (
          <div className="form-field">
            <label htmlFor="manga-template-serialization">預設連載狀態</label>
            <select
              id="manga-template-serialization"
              value={form.serializationStatus ?? '連載中'}
              onChange={(event) => setForm((current) => ({
                ...current,
                serializationStatus: event.target.value,
              }))}
            >
              <option value="連載中">連載中</option>
              <option value="已完結">已完結</option>
              <option value="休刊中">休刊中</option>
            </select>
          </div>
        )}

        {type === 'cart' && (
          <>
            <div className="form-field">
              <label htmlFor="cart-template-format">預設想看形式</label>
              <select
                id="cart-template-format"
                value={form.format ?? 'physical'}
                onChange={(event) => setForm((current) => ({ ...current, format: event.target.value }))}
              >
                <option value="physical">實體書</option>
                <option value="digital">電子書</option>
                <option value="either">實體／電子皆可</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="cart-template-status">預設興趣標籤</label>
              <MultiSelectTags
                id="cart-template-status"
                values={form.statuses ?? []}
                options={statusOptions}
                placeholder="選擇新增卡片的預設標籤…"
                onChange={(statuses) => setForm((current) => ({ ...current, statuses }))}
              />
            </div>
          </>
        )}

        <div className="template-actions">
          <button type="button" onClick={onClose}>取消</button>
          <button className="primary" type="button" onClick={() => onSave(form)}>儲存模板</button>
        </div>
      </section>
    </div>
  )
}

export default CardTemplateModal
