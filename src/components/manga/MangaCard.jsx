import './MangaCard.css'

function MangaCard({ manga }) {
  const tagClassName = ['tag', manga.statusClass].filter(Boolean).join(' ')
  const totalLabel = typeof manga.total === 'number' ? `/ ${manga.total}` : manga.total

  return (
    <article className="sticky">
      <div className="pin" />

      <div className="cover">
        <span>{manga.title}</span>
        <div className={tagClassName}>{manga.status}</div>
      </div>

      <div className="info">
        <h3>{manga.title}</h3>
        <div className="meta">{manga.meta}</div>
        <div className="prow">
          <span>{manga.current} 話</span>
          <span>{totalLabel}</span>
        </div>
        <div className="track" aria-label={`閱讀進度 ${manga.progress}%`}>
          <i style={{ width: `${manga.progress}%` }} />
        </div>
      </div>
    </article>
  )
}

export default MangaCard
