import '../manga/MangaCard.css'
import { FiCornerUpRight, FiEdit3, FiGlobe, FiMove, FiTrash2 } from 'react-icons/fi'
import './BookCard.css'
import CardSelectionControl from '../common/CardSelectionControl.jsx'
import useCoverPositionDrag from '../../hooks/useCoverPositionDrag.js'

function getProgress(edition) {
  if (!edition.total) return edition.current > 0 ? 100 : 0
  return Math.min(100, Math.round((edition.current / edition.total) * 100))
}

function EditionProgress({ label, edition, addSpacing = false, progressClass = '' }) {
  if (!edition.current) return null

  return (
    <div className={addSpacing ? 'edition-progress spaced' : 'edition-progress'}>
      <div className="prow">
        <span><strong className="edition-code">{label}</strong> 當前 {edition.current} 冊</span>
        <span>{edition.total ? `總共 ${edition.total} 冊` : '總冊數未設定'}</span>
      </div>
      <div className="track">
        <i className={progressClass} style={{ width: `${getProgress(edition)}%` }} />
      </div>
    </div>
  )
}

function BookCard({
  book,
  readingStatuses,
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
  const coverPosition = useCoverPositionDrag(book, onUpdateCoverPosition, editMode)
  const bookStatuses = book.statuses?.length ? book.statuses : [book.status].filter(Boolean)
  const coverStyle = book.coverUrl
    ? {
        backgroundImage: `url("${book.coverUrl.replace(/"/g, '\\"')}")`,
        backgroundPosition: `${coverPosition.position.x}% ${coverPosition.position.y}%`,
        backgroundSize: book.coverFit,
      }
    : undefined
  const meta = [book.publisher, book.shelf].filter(Boolean).join('・')
  const bookRelatedWorks = (book.relatedWorks?.length
    ? book.relatedWorks
    : book.relatedWork ? [book.relatedWork] : [])
    .map((relatedWork) => relatedWorks.find(
      (work) => work.id === relatedWork.id && work.type === relatedWork.type,
    ) ?? relatedWork)

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      if (selectionMode) onToggleSelect(book.id)
      else onEdit(book)
    }
  }

  function handleCardClick() {
    if (coverPosition.isAdjusting) {
      coverPosition.cancelAdjusting()
      return
    }
    if (selectionMode) onToggleSelect(book.id)
    else onEdit(book)
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
          label={`${selected ? '取消選取' : '選取'}${book.title}`}
          onToggle={() => onToggleSelect(book.id)}
        />
      )}
      {editMode && (
        <button
          className={selectionMode ? 'card-remove with-selection' : 'card-remove'}
          type="button"
          title="刪除實體書"
          aria-label={`刪除${book.title}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onDelete(book)
          }}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <FiTrash2 aria-hidden="true" />
        </button>
      )}
      {editMode && book.coverUrl && book.coverFit !== 'contain' && (
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
        className={editMode && book.coverUrl && book.coverFit !== 'contain' ? 'cover repositioning' : 'cover'}
        style={coverStyle}
        onPointerDown={coverPosition.handlePointerDown}
        onPointerMove={coverPosition.handlePointerMove}
        onPointerUp={coverPosition.handlePointerEnd}
        onPointerCancel={coverPosition.handlePointerCancel}
        onClick={coverPosition.handleCoverClick}
      >
        {!book.coverUrl && <span>{book.title}</span>}
        {coverPosition.isAdjusting && <span className="cover-position-hint">拖曳調整顯示範圍</span>}
        <div className="status-tags">
          {bookStatuses.map((status) => (
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
        <h3>{book.title}</h3>
        {book.originalTitle && (
          <div className="original-title-line icon-label" title={book.originalTitle}>
            <FiGlobe aria-hidden="true" /> {book.originalTitle}
          </div>
        )}
        {book.author && <div className="author-line icon-label"><FiEdit3 aria-hidden="true" /> {book.author}</div>}
        {meta && <div className="meta">{meta}</div>}
        {bookRelatedWorks.map((relatedWork) => (
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
            <span>傳送門：{relatedWork.title}</span>
          </button>
        ))}

        {(book.genres?.length || book.genre) && (
          <div className="chips">
            {(book.genres?.length ? book.genres : [book.genre]).map((genre) => (
              <span className="chip" key={genre}>{genre}</span>
            ))}
          </div>
        )}
        <div className="card-progress-block">
          {book.legacySingleEdition ? (
            <>
              <div className="prow">
                <span>當前 {book.tw.current} 冊</span>
                <span>{book.tw.total ? `總共 ${book.tw.total} 冊` : '總冊數未設定'}</span>
              </div>
              <div className="track">
                <i className={book.progressClass} style={{ width: `${getProgress(book.tw)}%` }} />
              </div>
            </>
          ) : (
            <>
              <EditionProgress label="JP" edition={book.jp} />
              <EditionProgress label="TW" edition={book.tw} addSpacing={book.jp.current > 0} />
            </>
          )}
        </div>
      </div>
    </article>
  )
}

export default BookCard
