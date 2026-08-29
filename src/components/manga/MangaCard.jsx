import './MangaCard.css'
import { FiCornerUpRight, FiEdit3, FiGlobe, FiMove, FiPlay, FiTrash2 } from 'react-icons/fi'
import CardSelectionControl from '../common/CardSelectionControl.jsx'
import useCoverPositionDrag from '../../hooks/useCoverPositionDrag.js'

function MangaCard({
  manga,
  statusClass,
  onEdit,
  onDelete,
  selectionMode,
  selected,
  onToggleSelect,
  relatedWorks,
  onNavigateRelated,
  onUpdateCoverPosition,
  editMode,
}) {
  const coverPosition = useCoverPositionDrag(manga, onUpdateCoverPosition, editMode)
  const tagClassName = ['tag', statusClass].filter(Boolean).join(' ')
  const totalLabel = manga.total
    ? manga.status === '已完結' && manga.current >= manga.total
      ? '已補完'
      : `/ ${manga.total}`
    : '連載中'
  const progress = Number.isFinite(manga.progress)
    ? manga.progress
    : manga.total
      ? Math.min(100, Math.round((manga.current / manga.total) * 100))
      : manga.current > 0
        ? 100
        : 0
  const coverStyle = manga.coverUrl
    ? {
        backgroundImage: `url("${manga.coverUrl.replace(/"/g, '\\"')}")`,
        backgroundPosition: `${coverPosition.position.x}% ${coverPosition.position.y}%`,
        backgroundSize: manga.coverFit,
      }
    : undefined
  const relatedWork = manga.relatedWork
    ? relatedWorks.find(
        (work) => work.id === manga.relatedWork.id && work.type === manga.relatedWork.type,
      ) ?? manga.relatedWork
    : null

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      if (selectionMode) onToggleSelect(manga.id)
      else onEdit(manga)
    }
  }

  function handleCardClick() {
    if (coverPosition.isAdjusting) {
      coverPosition.cancelAdjusting()
      return
    }
    if (selectionMode) onToggleSelect(manga.id)
    else onEdit(manga)
  }

  return (
    <article
      className={selected ? 'sticky card-selected' : 'sticky'}
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
          label={`${selected ? '取消選取' : '選取'}${manga.title}`}
          onToggle={() => onToggleSelect(manga.id)}
        />
      )}
      {editMode && (
        <button
          className={selectionMode ? 'card-remove with-selection' : 'card-remove'}
          type="button"
          title="刪除追漫作品"
          aria-label={`刪除${manga.title}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onDelete(manga)
          }}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <FiTrash2 aria-hidden="true" />
        </button>
      )}

      {editMode && manga.coverUrl && manga.coverFit !== 'contain' && (
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
        className={editMode && manga.coverUrl && manga.coverFit !== 'contain' ? 'cover repositioning' : 'cover'}
        style={coverStyle}
        onPointerDown={coverPosition.handlePointerDown}
        onPointerMove={coverPosition.handlePointerMove}
        onPointerUp={coverPosition.handlePointerEnd}
        onPointerCancel={coverPosition.handlePointerCancel}
        onClick={coverPosition.handleCoverClick}
      >
        {!manga.coverUrl && <span>{manga.title}</span>}
        {coverPosition.isAdjusting && <span className="cover-position-hint">拖曳調整顯示範圍</span>}
        <div className={tagClassName}>{manga.status}</div>
      </div>

      <div className="info">
        <h3>{manga.title}</h3>
        {manga.originalTitle && (
          <div className="original-title-line icon-label" title={manga.originalTitle}>
            <FiGlobe aria-hidden="true" /> {manga.originalTitle}
          </div>
        )}
        {manga.author && <div className="author-line icon-label"><FiEdit3 aria-hidden="true" /> {manga.author}</div>}
        {manga.genre && <div className="meta">{manga.genre}</div>}
        {relatedWork && (
          <button
            className="related-work-btn"
            type="button"
            title={`前往${relatedWork.title}`}
            onClick={(event) => {
              event.stopPropagation()
              onNavigateRelated(relatedWork)
            }}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <FiCornerUpRight aria-hidden="true" />
            <span>傳送門：{relatedWork.title}</span>
          </button>
        )}
        {manga.link && (
          <a
            className="read-link-btn"
            href={manga.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <FiPlay aria-hidden="true" /> 閱讀漫畫
          </a>
        )}
        <div className="card-progress-block">
          <div className="prow">
            <span>{manga.current} 話</span>
            <span>{totalLabel}</span>
          </div>
          <div className="track" aria-label={`閱讀進度 ${progress}%`}>
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </article>
  )
}

export default MangaCard
