import './MangaPage.css'
import MangaCard from '../components/manga/MangaCard.jsx'

const readingStatuses = [
  { id: 1, name: '連載中' },
  { id: 2, name: '快追上了' },
  { id: 3, name: '已完結' },
  { id: 4, name: '已棄坑' },
]

const mangaList = [
  {
    id: 1,
    title: '崩壞的刃',
    meta: '戰鬥・週刊少年誌',
    current: 142,
    total: 156,
    status: '連載中',
    statusClass: '',
    progress: 91,
  },
  {
    id: 2,
    title: '雨夜圖書館',
    meta: '懸疑・月刊',
    current: 38,
    total: '已補完',
    status: '已完結',
    statusClass: 'pink',
    progress: 100,
  },
  {
    id: 3,
    title: '拳與影',
    meta: '運動・週刊少年誌',
    current: 9,
    total: 21,
    status: '連載中',
    statusClass: '',
    progress: 43,
  },
  {
    id: 4,
    title: '星塵日記',
    meta: '日常・網漫',
    current: 210,
    total: 300,
    status: '連載中',
    statusClass: '',
    progress: 70,
  },
  {
    id: 5,
    title: '灰色海岸線',
    meta: '劇情・季刊',
    current: 12,
    total: 45,
    status: '已棄坑',
    statusClass: 'gray',
    progress: 27,
  },
  {
    id: 6,
    title: '刀鋒學院',
    meta: '戰鬥・週刊少年誌',
    current: 5,
    total: '連載中',
    status: '快追上了',
    statusClass: 'mint',
    progress: 35,
  },
  {
    id: 7,
    title: '貓町奇談',
    meta: '奇幻・月刊',
    current: 61,
    total: 88,
    status: '連載中',
    statusClass: '',
    progress: 69,
  },
  {
    id: 8,
    title: '沉默的鑄劍師',
    meta: '武俠・週刊青年誌',
    current: 33,
    total: 120,
    status: '連載中',
    statusClass: '',
    progress: 27,
  },
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

      <div className="board">
        {mangaList.map((manga) => (
          <MangaCard key={manga.id} manga={manga} />
        ))}
      </div>
    </main>
  )
}

export default MangaPage
