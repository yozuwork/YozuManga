import { FiCheck, FiCheckSquare, FiEdit3 } from 'react-icons/fi'
import './DisplayModeControl.css'

function DisplayModeControl({ value, onChange }) {
  return (
    <label className="display-mode-control">
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="12">12 筆／頁</option>
        <option value="36">36 筆／頁</option>
        <option value="48">48 筆／頁</option>
        <option value="waterfall">瀑布流</option>
      </select>
    </label>
  )
}

function CardSizeControl({ value, onChange }) {
  return (
    <label className="card-size-control">
      <span>卡片</span>
      <select aria-label="卡片大小" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="large">大</option>
        <option value="medium">中</option>
        <option value="small">小</option>
      </select>
    </label>
  )
}

export function WaterfallStatus({ shownCount, totalItems, hasMore, loadMoreRef }) {
  return (
    <div className="waterfall-status" ref={loadMoreRef} aria-live="polite">
      {hasMore
        ? `已顯示 ${shownCount} 筆，往下滑動載入更多`
        : `已顯示全部 ${totalItems} 筆`}
    </div>
  )
}

export function ListViewActions({
  value,
  onChange,
  cardSize,
  onCardSizeChange,
  onStartSelecting,
  isEditing,
  onToggleEditing,
}) {
  return (
    <div className="list-view-actions">
      {onCardSizeChange && <CardSizeControl value={cardSize} onChange={onCardSizeChange} />}
      <DisplayModeControl value={value} onChange={onChange} />
      {onToggleEditing && (
        <button
          className={isEditing ? 'selection-button edit-toggle active button-with-icon' : 'selection-button edit-toggle button-with-icon'}
          type="button"
          onClick={onToggleEditing}
        >
          {isEditing ? <FiCheck aria-hidden="true" /> : <FiEdit3 aria-hidden="true" />}
          {isEditing ? '完成' : '編輯'}
        </button>
      )}
      {!onToggleEditing && (
        <button
          className="selection-button button-with-icon"
          type="button"
          onClick={onStartSelecting}
        >
          <FiCheckSquare aria-hidden="true" /> 多選
        </button>
      )}
    </div>
  )
}

export default DisplayModeControl
