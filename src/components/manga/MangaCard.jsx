import './MangaCard.css'
import { useEffect, useRef, useState } from 'react'
import { FiChevronRight, FiCornerUpRight, FiEdit3, FiGlobe, FiMove, FiPlay, FiTrash2 } from 'react-icons/fi'
import CardSelectionControl from '../common/CardSelectionControl.jsx'
import useCoverPositionDrag from '../../hooks/useCoverPositionDrag.js'

function getLinkHost(link) {
  try {
    return new URL(link).hostname.replace(/^www\./, '')
  } catch {
    return link
  }
}

function MangaCard({
  manga,
  readingStatuses,
  onEdit,
  onDelete,
  selectionMode,
  selected,
  onToggleSelect,
  relatedWorks,
  onNavigateRelated,
  onUpdateCoverPosition,
  onRead,
  editMode,
}) {
  const coverPosition = useCoverPositionDrag(manga, onUpdateCoverPosition, editMode)
  const [isLinkMenuOpen, setIsLinkMenuOpen] = useState(false)
  const linkMenuRef = useRef(null)

  useEffect(() => {
    if (!isLinkMenuOpen) return undefined

    function handlePointerDown(event) {
      if (!linkMenuRef.current?.contains(event.target)) setIsLinkMenuOpen(false)
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setIsLinkMenuOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLinkMenuOpen])
  const mangaStatuses = manga.statuses?.length ? manga.statuses : [manga.status].filter(Boolean)
  const mangaLinks = manga.links?.length ? manga.links : manga.link ? [manga.link] : []
  const serializationStatus = manga.serializationStatus
    ?? (mangaStatuses.includes('已完結') ? '已完結' : '連載中')
  const totalLabel = manga.total
    ? `${serializationStatus}・共 ${manga.total} 話`
    : serializationStatus
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
  const mangaRelatedWorks = (manga.relatedWorks?.length
    ? manga.relatedWorks
    : manga.relatedWork ? [manga.relatedWork] : [])
    .map((relatedWork) => relatedWorks.find(
      (work) => work.id === relatedWork.id && work.type === relatedWork.type,
    ) ?? relatedWork)

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
      className={['sticky', selected && 'card-selected', isLinkMenuOpen && 'link-menu-open'].filter(Boolean).join(' ')}
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
        <div className="status-tags">
          {mangaStatuses.map((status) => (
            <span
              className={`tag ${readingStatuses.find((item) => item.name === status)?.color ?? 'marker'}`}
              key={status}
            >
              {status}
            </span>
          ))}
        </div>
      </div>

      <div className="info">
        <h3>{manga.title}</h3>
        {manga.originalTitle && (
          <div className="original-title-line icon-label" title={manga.originalTitle}>
            <FiGlobe aria-hidden="true" /> {manga.originalTitle}
          </div>
        )}
        {manga.author && <div className="author-line icon-label"><FiEdit3 aria-hidden="true" /> {manga.author}</div>}
        {(manga.genres?.length || manga.genre) && (
          <div className="meta">{(manga.genres?.length ? manga.genres : [manga.genre]).join('・')}</div>
        )}
        {mangaRelatedWorks.map((relatedWork) => (
          <button
            className="related-work-btn"
            type="button"
            key={`${relatedWork.type}:${relatedWork.id}`}
            title={`前往${relatedWork.title}`}
            onClick={(event) => {
              event.stopPropagation()
              onNavigateRelated(relatedWork)
            }}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <FiCornerUpRight aria-hidden="true" />
            <span>{relatedWork.type === 'book' ? '實體書傳送門' : '追漫傳送門'}</span>
          </button>
        ))}
        {mangaLinks.length === 1 && (
          <div className="read-links">
            <a
              className="read-link-btn"
              href={mangaLinks[0]}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => {
                event.stopPropagation()
                onRead?.(manga)
              }}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <FiPlay aria-hidden="true" /> 閱讀漫畫
            </a>
          </div>
        )}
        {mangaLinks.length > 1 && (
          <div className="read-links" ref={linkMenuRef}>
            <button
              className={isLinkMenuOpen ? 'read-link-btn open' : 'read-link-btn'}
              type="button"
              aria-haspopup="menu"
              aria-expanded={isLinkMenuOpen}
              onClick={(event) => {
                event.stopPropagation()
                setIsLinkMenuOpen((open) => !open)
              }}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <FiPlay aria-hidden="true" /> 閱讀漫畫
            </button>
            {isLinkMenuOpen && (
              <div className="read-link-menu" role="menu">
                {mangaLinks.map((link, index) => (
                  <a
                    className="read-link-bubble"
                    role="menuitem"
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={`${link}-${index}`}
                    style={{ '--bubble-index': index }}
                    onClick={(event) => {
                      event.stopPropagation()
                      setIsLinkMenuOpen(false)
                      onRead?.(manga)
                    }}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <span className="read-link-bubble-icon"><FiPlay aria-hidden="true" /></span>
                    <span className="read-link-bubble-text">
                      <strong>作品連結 {index + 1}</strong>
                      <small>{getLinkHost(link)}</small>
                    </span>
                    <FiChevronRight className="read-link-bubble-arrow" aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="card-progress-block">
          <div className="prow">
            <span>已讀 {manga.current} 話</span>
            <span>{totalLabel}</span>
          </div>
          {manga.extraProgress && (
            <div className="extra-progress" title={manga.extraProgress}>
              <span className={manga.extraWatched ? 'extra-watched yes' : 'extra-watched'}>
                {manga.extraWatched ? '已看' : '未看'}
              </span>
              番外：{manga.extraProgress}
            </div>
          )}
          <div className="track" aria-label={`閱讀進度 ${progress}%`}>
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </article>
  )
}

export default MangaCard
