import '../manga/MangaCard.css'
import { FiBook, FiBookOpen, FiTrash2 } from 'react-icons/fi'
import CardSelectionControl from '../common/CardSelectionControl.jsx'
import './CategoryCard.css'

function CategoryCard({
  category,
  onNavigate,
  onDelete,
  selectionMode,
  selected,
  onToggleSelect,
  editMode,
}) {
  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      if (selectionMode) onToggleSelect(category.id)
      else onNavigate(category)
    }
  }

  function handleCardClick() {
    if (selectionMode) onToggleSelect(category.id)
    else onNavigate(category)
  }

  return (
    <article
      className={selected ? 'sticky category-card card-selected' : 'sticky category-card'}
      role="button"
      tabIndex="0"
      aria-pressed={selectionMode ? selected : undefined}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
    >
      <div className="pin" />
      {selectionMode && (
        <CardSelectionControl
          selected={selected}
          label={`${selected ? '取消選取' : '選取'}${category.name}`}
          onToggle={() => onToggleSelect(category.id)}
        />
      )}
      {editMode && (
        <button
          className={selectionMode ? 'cat-card-remove with-selection' : 'cat-card-remove'}
          type="button"
          title="刪除分類"
          aria-label={`刪除${category.name}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onDelete(category)
          }}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <FiTrash2 aria-hidden="true" />
        </button>
      )}
      <div className="cover">
        <span>{category.name}</span>
        <div className="tag category-type-icons" aria-label={typeIconsLabel(category.types)}>
          {category.types.includes('manga') && <FiBookOpen aria-hidden="true" />}
          {category.types.includes('book') && <FiBook aria-hidden="true" />}
        </div>
      </div>
      <div className="info">
        <h3>{category.name}</h3>
        <div className="meta">{category.count} 個作品・點擊查看</div>
      </div>
    </article>
  )
}

function typeIconsLabel(types) {
  return [types.includes('manga') ? '追漫' : '', types.includes('book') ? '實體書' : '']
    .filter(Boolean)
    .join('、')
}

export default CategoryCard
