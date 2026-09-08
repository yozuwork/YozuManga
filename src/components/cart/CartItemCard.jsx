import {
  FiCornerUpRight,
  FiEdit3,
  FiHeart,
  FiMove,
  FiTrash2,
} from 'react-icons/fi'
import './CartItemCard.css'
import useCoverPositionDrag from '../../hooks/useCoverPositionDrag.js'

const formatLabels = {
  physical: '實體書',
  digital: '電子書',
  either: '實體／電子皆可',
}

const legacyPriorityLabels = {
  high: '準備購買',
  medium: '有興趣',
  low: '先收藏',
}

function CartItemCard({
  item,
  relatedWorks,
  readingStatuses,
  onEdit,
  onDelete,
  onNavigateRelated,
  onUpdateCoverPosition,
  editMode,
}) {
  const linkedWorks = (item.relatedWorks ?? [])
    .map((relation) => relatedWorks.find(
      (work) => work.id === relation.id && work.type === relation.type,
    ) ?? relation)
  const linkedCover = linkedWorks.find((work) => work.coverUrl)?.coverUrl
  const coverUrl = item.coverUrl || linkedCover
  const coverPosition = useCoverPositionDrag(
    { ...item, coverUrl, coverFit: item.coverFit ?? 'cover' },
    onUpdateCoverPosition,
    editMode,
  )
  const coverStyle = coverUrl
    ? {
        backgroundImage: `url("${coverUrl.replace(/"/g, '\\"')}")`,
        backgroundPosition: `${coverPosition.position.x}% ${coverPosition.position.y}%`,
        backgroundSize: item.coverFit ?? 'cover',
      }
    : undefined
  const itemStatuses = item.statuses?.length
    ? item.statuses
    : item.status ? [item.status] : [legacyPriorityLabels[item.priority] ?? '有興趣']

  function handleCardClick() {
    if (coverPosition.isAdjusting) {
      coverPosition.cancelAdjusting()
      return
    }
    onEdit(item)
  }

  return (
    <article
      className="sticky cart-card"
      role="button"
      tabIndex="0"
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onEdit(item)
        }
      }}
    >
      <div className="pin" />
      {editMode && (
        <button
          className="card-remove"
          type="button"
          aria-label={`刪除${item.title}`}
          title="刪除購物車項目"
          onClick={(event) => {
            event.stopPropagation()
            onDelete(item)
          }}
        >
          <FiTrash2 aria-hidden="true" />
        </button>
      )}
      {editMode && coverUrl && item.coverFit !== 'contain' && (
        <button
          className="card-cover-position active"
          type="button"
          title="封面可直接拖曳調整顯示範圍"
          aria-label="封面可直接拖曳調整顯示範圍"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <FiMove aria-hidden="true" />
        </button>
      )}
      <div
        className={editMode && coverUrl && item.coverFit !== 'contain'
          ? 'cover cart-cover repositioning'
          : 'cover cart-cover'}
        style={coverStyle}
        onPointerDown={coverPosition.handlePointerDown}
        onPointerMove={coverPosition.handlePointerMove}
        onPointerUp={coverPosition.handlePointerEnd}
        onPointerCancel={coverPosition.handlePointerCancel}
        onClick={coverPosition.handleCoverClick}
      >
        {!coverUrl && <span>{item.title}</span>}
        {coverPosition.isAdjusting && <span className="cover-position-hint">拖曳調整顯示範圍</span>}
        <div className="status-tags">
          {itemStatuses.map((status) => (
            <span
              className={`tag ${readingStatuses.find((itemStatus) => itemStatus.name === status)?.color ?? 'marker'}`}
              key={status}
            >
              {status}
            </span>
          ))}
        </div>
      </div>
      <div className="info cart-info">
        <h3>{item.title}</h3>
        {item.author && <div className="author-line icon-label"><FiEdit3 aria-hidden="true" /> {item.author}</div>}
        <div className="cart-badges">
          <span><FiHeart aria-hidden="true" /> {formatLabels[item.format] ?? formatLabels.physical}</span>
          {item.volumeNote && <span>{item.volumeNote}</span>}
        </div>
        {item.note && <p className="cart-note">{item.note}</p>}
        <div className="cart-card-actions">
          {linkedWorks.map((work) => (
            <button
              className="related-work-btn"
              type="button"
              key={`${work.type}:${work.id}`}
              title={`前往${work.title}`}
              onClick={(event) => {
                event.stopPropagation()
                onNavigateRelated(work)
              }}
            >
              <FiCornerUpRight aria-hidden="true" />
              <span>{work.type === 'book' ? '實體書傳送門' : '追漫傳送門'}</span>
            </button>
          ))}
        </div>
      </div>
    </article>
  )
}

export default CartItemCard
