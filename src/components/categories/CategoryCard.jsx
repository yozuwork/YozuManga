import '../manga/MangaCard.css'
import './CategoryCard.css'

function CategoryCard({ category, onNavigate, onDelete }) {
  const typeIcons = `${category.types.includes('manga') ? '📖' : ''}${category.types.includes('book') ? '📚' : ''}`

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onNavigate(category)
    }
  }

  return (
    <article
      className="sticky category-card"
      role="button"
      tabIndex="0"
      onClick={() => onNavigate(category)}
      onKeyDown={handleKeyDown}
    >
      <div className="pin" />
      <button
        className="cat-card-remove"
        type="button"
        title="刪除分類"
        aria-label={`刪除${category.name}`}
        onClick={(event) => {
          event.stopPropagation()
          onDelete(category.name)
        }}
        onKeyDown={(event) => event.stopPropagation()}
      >
        ✕
      </button>
      <div className="cover">
        <span>{category.name}</span>
        <div className="tag">{typeIcons}</div>
      </div>
      <div className="info">
        <h3>{category.name}</h3>
        <div className="meta">{category.count} 個作品・點擊查看</div>
      </div>
    </article>
  )
}

export default CategoryCard
