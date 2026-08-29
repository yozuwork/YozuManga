import { FiCheckSquare, FiTrash2, FiX } from 'react-icons/fi'
import './SelectionToolbar.css'

function SelectionToolbar({
  isSelecting,
  selectedCount,
  visibleIds,
  onSelectAll,
  onDelete,
  onCancel,
}) {
  if (!isSelecting) return null

  return (
    <div className="selection-toolbar active" aria-label="多選工具列">
      <strong>已選取 {selectedCount} 項</strong>
      <div className="selection-actions">
        <button
          className="selection-button button-with-icon"
          type="button"
          disabled={visibleIds.length === 0}
          onClick={() => onSelectAll(visibleIds)}
        >
          <FiCheckSquare aria-hidden="true" /> 全選目前項目
        </button>
        <button
          className="selection-button danger button-with-icon"
          type="button"
          disabled={selectedCount === 0}
          onClick={onDelete}
        >
          <FiTrash2 aria-hidden="true" /> 刪除選取項目
        </button>
        <button className="selection-button button-with-icon" type="button" onClick={onCancel}>
          <FiX aria-hidden="true" /> 取消
        </button>
      </div>
    </div>
  )
}

export default SelectionToolbar
