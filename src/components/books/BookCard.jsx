import '../manga/MangaCard.css'
import './BookCard.css'

function getProgress(edition) {
  if (!edition.total) return edition.current > 0 ? 100 : 0
  return Math.min(100, Math.round((edition.current / edition.total) * 100))
}

function EditionProgress({ flag, edition, addSpacing = false, progressClass = '' }) {
  if (!edition.current) return null

  return (
    <div className={addSpacing ? 'edition-progress spaced' : 'edition-progress'}>
      <div className="prow">
        <span>{flag} {edition.current} 冊</span>
        <span>{edition.total ? `/ ${edition.total}` : '收集中'}</span>
      </div>
      <div className="track">
        <i className={progressClass} style={{ width: `${getProgress(edition)}%` }} />
      </div>
    </div>
  )
}

function BookCard({ book, statusClass, onEdit }) {
  const tagClassName = ['tag', statusClass].filter(Boolean).join(' ')
  const coverStyle = book.coverUrl
    ? {
        backgroundImage: `url("${book.coverUrl.replace(/"/g, '\\"')}")`,
        backgroundPosition: `${book.coverPosX}% ${book.coverPosY}%`,
        backgroundSize: book.coverFit,
      }
    : undefined
  const meta = [book.publisher, book.shelf].filter(Boolean).join('・') || '未分類出版資訊'

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onEdit(book)
    }
  }

  return (
    <article
      className="sticky"
      role="button"
      tabIndex="0"
      onClick={() => onEdit(book)}
      onKeyDown={handleKeyDown}
    >
      <div className="pin" />
      <div className="cover" style={coverStyle}>
        {!book.coverUrl && <span>{book.title}</span>}
        <div className={tagClassName}>{book.status}</div>
      </div>
      <div className="info">
        <h3>{book.title}</h3>
        {book.author && <div className="author-line">✍️ {book.author}</div>}
        <div className="meta">{meta}</div>

        {book.legacySingleEdition ? (
          <>
            <div className="prow">
              <span>已收 {book.tw.current} 冊</span>
              <span>{book.tw.total ? `/ ${book.tw.total}` : '收集中'}</span>
            </div>
            <div className="track">
              <i className={book.progressClass} style={{ width: `${getProgress(book.tw)}%` }} />
            </div>
          </>
        ) : (
          <>
            <EditionProgress flag="🇯🇵" edition={book.jp} />
            <EditionProgress flag="🇹🇼" edition={book.tw} addSpacing={book.jp.current > 0} />
          </>
        )}

        {book.genre && (
          <div className="chips">
            <span className="chip">{book.genre}</span>
          </div>
        )}
      </div>
    </article>
  )
}

export default BookCard
