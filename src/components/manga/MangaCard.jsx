import './MangaCard.css'

function MangaCard({ manga, statusClass, onEdit }) {
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
        backgroundPosition: `${manga.coverPosX}% ${manga.coverPosY}%`,
        backgroundSize: manga.coverFit,
      }
    : undefined

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onEdit(manga)
    }
  }

  return (
    <article
      className="sticky"
      role="button"
      tabIndex="0"
      onClick={() => onEdit(manga)}
      onKeyDown={handleKeyDown}
    >
      <div className="pin" />

      <div className="cover" style={coverStyle}>
        {!manga.coverUrl && <span>{manga.title}</span>}
        <div className={tagClassName}>{manga.status}</div>
      </div>

      <div className="info">
        <h3>{manga.title}</h3>
        {manga.author && <div className="author-line">✍️ {manga.author}</div>}
        <div className="meta">{manga.genre || '未分類'}</div>
        <div className="prow">
          <span>{manga.current} 話</span>
          <span>{totalLabel}</span>
        </div>
        <div className="track" aria-label={`閱讀進度 ${progress}%`}>
          <i style={{ width: `${progress}%` }} />
        </div>
        {manga.link && (
          <a
            className="read-link-btn"
            href={manga.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            ▶ 閱讀漫畫
          </a>
        )}
      </div>
    </article>
  )
}

export default MangaCard
