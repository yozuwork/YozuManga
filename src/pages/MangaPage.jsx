import './MangaPage.css'

const readingStatuses = [
  { id: 1, name: '連載中' },
  { id: 2, name: '快追上了' },
  { id: 3, name: '已完結' },
  { id: 4, name: '已棄坑' },
]

function MangaPage() {
  return (
    <main className="manga-page">
      <div className="filters" aria-label="追漫篩選">
        <span className="on">全部 24</span>
        {readingStatuses.map((status) => (
          <span key={status.id}>{status.name}</span>
        ))}
        <span className="add-pill">＋ 新增追漫</span>
      </div>
    </main>
  )
}

export default MangaPage
