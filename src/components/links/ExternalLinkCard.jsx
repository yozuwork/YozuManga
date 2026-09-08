import { FiEdit3, FiExternalLink, FiGlobe, FiMove, FiTrash2 } from 'react-icons/fi'
import useCoverPositionDrag from '../../hooks/useCoverPositionDrag.js'
import './ExternalLinkCard.css'

function getHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function ExternalLinkCard({
  link,
  linkTags,
  onEdit,
  onDelete,
  onUpdateCoverPosition,
  editMode,
}) {
  const coverPosition = useCoverPositionDrag(link, onUpdateCoverPosition, editMode)
  const coverStyle = link.coverUrl ? {
    backgroundImage: `url("${link.coverUrl.replace(/"/g, '\\"')}")`,
    backgroundPosition: `${coverPosition.position.x}% ${coverPosition.position.y}%`,
    backgroundSize: link.coverFit ?? 'cover',
  } : undefined
  const tags = link.tags?.length ? link.tags : link.statuses?.length ? link.statuses : []

  function handleCardClick() {
    if (coverPosition.isAdjusting) {
      coverPosition.cancelAdjusting()
      return
    }
    onEdit(link)
  }

  return (
    <article
      className="sticky external-link-card"
      role="button"
      tabIndex="0"
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onEdit(link)
        }
      }}
    >
      <div className="pin" />
      {editMode && (
        <button
          className="card-remove"
          type="button"
          title="刪除外部連結"
          aria-label={`刪除${link.title}`}
          onClick={(event) => {
            event.stopPropagation()
            onDelete(link)
          }}
        >
          <FiTrash2 aria-hidden="true" />
        </button>
      )}
      {editMode && link.coverUrl && link.coverFit !== 'contain' && (
        <button
          className="card-cover-position active"
          type="button"
          title="封面可直接拖曳調整顯示範圍"
          onClick={(event) => event.stopPropagation()}
        >
          <FiMove aria-hidden="true" />
        </button>
      )}
      <div
        className={editMode && link.coverUrl && link.coverFit !== 'contain'
          ? 'cover link-cover repositioning'
          : 'cover link-cover'}
        style={coverStyle}
        onPointerDown={coverPosition.handlePointerDown}
        onPointerMove={coverPosition.handlePointerMove}
        onPointerUp={coverPosition.handlePointerEnd}
        onPointerCancel={coverPosition.handlePointerCancel}
        onClick={coverPosition.handleCoverClick}
      >
        {!link.coverUrl && <span>{link.title}</span>}
        {coverPosition.isAdjusting && <span className="cover-position-hint">拖曳調整顯示範圍</span>}
        <div className="status-tags">
          {tags.map((tag) => (
            <span className={`tag ${linkTags.find((item) => item.name === tag)?.color ?? 'marker'}`} key={tag}>{tag}</span>
          ))}
        </div>
      </div>
      <div className="info link-info">
        <h3>{link.title}</h3>
        {(link.pageName || link.siteName || getHost(link.url)) && (
          <div className="link-site icon-label"><FiGlobe aria-hidden="true" /> {link.pageName || link.siteName || getHost(link.url)}</div>
        )}
        {link.description && <p>{link.description}</p>}
        <a
          className="read-link-btn"
          href={link.url}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
        >
          <FiExternalLink aria-hidden="true" /> 開啟外部連結
        </a>
      </div>
    </article>
  )
}

export default ExternalLinkCard
