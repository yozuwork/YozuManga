import {
  FiCalendar,
  FiCheckCircle,
  FiCornerUpRight,
  FiEdit3,
  FiExternalLink,
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

const chineseDigits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']

function numberToChinese(number) {
  if (number < 10) return chineseDigits[number]
  if (number < 20) return `十${number % 10 ? chineseDigits[number % 10] : ''}`
  if (number < 100) {
    return `${chineseDigits[Math.floor(number / 10)]}十${number % 10 ? chineseDigits[number % 10] : ''}`
  }
  if (number < 1000) {
    const remainder = number % 100
    return `${chineseDigits[Math.floor(number / 100)]}百${
      remainder ? `${remainder < 10 ? '零' : ''}${numberToChinese(remainder)}` : ''
    }`
  }
  return String(number)
}

function getVolumeLabel(value) {
  const text = String(value).trim()
  if (/^\d+$/.test(text)) return `第${numberToChinese(Number(text))}卷`
  return text
}

function formatPurchasedDate(value) {
  if (!value) return ''
  return value.replace(/-/g, '/')
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
  const purchaseVolumes = item.purchaseVolumes?.length
    ? item.purchaseVolumes
    : item.volumeNote
      ? item.volumeNote.split(/[,，、]/).map((value) => value.trim()).filter(Boolean)
      : []
  const sourceUrls = item.sourceUrls?.length
    ? item.sourceUrls
    : item.sourceUrl ? [item.sourceUrl] : []
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
      className={item.purchased ? 'sticky cart-card purchased' : 'sticky cart-card'}
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
          {!item.purchased && itemStatuses.map((status) => (
            <span
              className={`tag ${readingStatuses.find((itemStatus) => itemStatus.name === status)?.color ?? 'marker'}`}
              key={status}
            >
              {status}
            </span>
          ))}
          {item.purchased && (
            <span className="tag mint cart-purchased-tag">
              <FiCheckCircle aria-hidden="true" /> 已購買
            </span>
          )}
        </div>
      </div>
      <div className="info cart-info">
        <h3>{item.title}</h3>
        {item.author && <div className="author-line icon-label"><FiEdit3 aria-hidden="true" /> {item.author}</div>}
        <div className="cart-badges">
          <span><FiHeart aria-hidden="true" /> {formatLabels[item.format] ?? formatLabels.physical}</span>
          {purchaseVolumes.map((volume, index) => (
            <span key={`${volume}-${index}`}>{getVolumeLabel(volume)}</span>
          ))}
        </div>
        {item.purchased && item.purchasedDate && (
          <div className="cart-purchased-date-line icon-label">
            <FiCalendar aria-hidden="true" /> 購買日期 {formatPurchasedDate(item.purchasedDate)}
          </div>
        )}
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
          {sourceUrls.map((sourceUrl, index) => (
            <a
              className="cart-source-link"
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              key={`${sourceUrl}-${index}`}
              onClick={(event) => event.stopPropagation()}
            >
              <FiExternalLink aria-hidden="true" />
              {sourceUrls.length > 1 ? `作品連結 ${index + 1}` : '作品連結'}
            </a>
          ))}
        </div>
      </div>
    </article>
  )
}

export default CartItemCard
