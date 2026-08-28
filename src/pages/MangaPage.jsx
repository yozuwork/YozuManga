import { useEffect, useRef, useState } from 'react'
import MangaCard from '../components/manga/MangaCard.jsx'
import MangaModal from '../components/manga/MangaModal.jsx'
import './MangaPage.css'

const readingStatuses = [
  { id: 1, name: '連載中', color: 'marker' },
  { id: 2, name: '快追上了', color: 'mint' },
  { id: 3, name: '已完結', color: 'pink' },
  { id: 4, name: '已棄坑', color: 'gray' },
]

function MangaPage({ searchQuery }) {
  const [mangaList, setMangaList] = useState([
    {
      id: 1,
      title: '崩壞的刃',
      genre: '戰鬥・週刊少年誌',
      author: '',
      current: 142,
      total: 156,
      status: '連載中',
      statusClass: 'marker',
      link: '',
      coverUrl: '',
      coverPosX: 50,
      coverPosY: 50,
      coverFit: 'cover',
      progress: 91,
    },
    {
      id: 2,
      title: '雨夜圖書館',
      genre: '懸疑・月刊',
      author: '',
      current: 38,
      total: 38,
      status: '已完結',
      statusClass: 'pink',
      link: '',
      coverUrl: '',
      coverPosX: 50,
      coverPosY: 50,
      coverFit: 'cover',
      progress: 100,
    },
    {
      id: 3,
      title: '拳與影',
      genre: '運動・週刊少年誌',
      author: '',
      current: 9,
      total: 21,
      status: '連載中',
      statusClass: 'marker',
      link: '',
      coverUrl: '',
      coverPosX: 50,
      coverPosY: 50,
      coverFit: 'cover',
      progress: 43,
    },
    {
      id: 4,
      title: '星塵日記',
      genre: '日常・網漫',
      author: '',
      current: 210,
      total: 300,
      status: '連載中',
      statusClass: 'marker',
      link: '',
      coverUrl: '',
      coverPosX: 50,
      coverPosY: 50,
      coverFit: 'cover',
      progress: 70,
    },
    {
      id: 5,
      title: '灰色海岸線',
      genre: '劇情・季刊',
      author: '',
      current: 12,
      total: 45,
      status: '已棄坑',
      statusClass: 'gray',
      link: '',
      coverUrl: '',
      coverPosX: 50,
      coverPosY: 50,
      coverFit: 'cover',
      progress: 27,
    },
    {
      id: 6,
      title: '刀鋒學院',
      genre: '戰鬥・週刊少年誌',
      author: '',
      current: 5,
      total: null,
      status: '快追上了',
      statusClass: 'mint',
      link: '',
      coverUrl: '',
      coverPosX: 50,
      coverPosY: 50,
      coverFit: 'cover',
      progress: 35,
    },
    {
      id: 7,
      title: '貓町奇談',
      genre: '奇幻・月刊',
      author: '',
      current: 61,
      total: 88,
      status: '連載中',
      statusClass: 'marker',
      link: '',
      coverUrl: '',
      coverPosX: 50,
      coverPosY: 50,
      coverFit: 'cover',
      progress: 69,
    },
    {
      id: 8,
      title: '沉默的鑄劍師',
      genre: '武俠・週刊青年誌',
      author: '',
      current: 33,
      total: 120,
      status: '連載中',
      statusClass: 'marker',
      link: '',
      coverUrl: '',
      coverPosX: 50,
      coverPosY: 50,
      coverFit: 'cover',
      progress: 27,
    },
  ])
  const [activeStatus, setActiveStatus] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingManga, setEditingManga] = useState(null)
  const [toastMessage, setToastMessage] = useState('')
  const toastTimerRef = useRef(null)

  useEffect(() => {
    return () => clearTimeout(toastTimerRef.current)
  }, [])

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('zh-Hant')
  const visibleManga = mangaList.filter((manga) => {
    const matchesStatus = activeStatus === 'all' || manga.status === activeStatus
    const searchableText = [manga.title, manga.genre, manga.author]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('zh-Hant')

    return matchesStatus && searchableText.includes(normalizedQuery)
  })

  const genreOptions = [...new Set(mangaList.map((manga) => manga.genre).filter(Boolean))]

  function showToast(message) {
    setToastMessage(message)
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastMessage(''), 2200)
  }

  function openAddModal() {
    setEditingManga(null)
    setIsModalOpen(true)
  }

  function openEditModal(manga) {
    setEditingManga(manga)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingManga(null)
  }

  function saveManga(formData) {
    const statusClass =
      readingStatuses.find((status) => status.name === formData.status)?.color ?? 'marker'
    const total = formData.total
    const progress = total
      ? Math.min(100, Math.round((formData.current / total) * 100))
      : formData.current > 0
        ? 100
        : 0

    if (editingManga) {
      setMangaList((currentList) =>
        currentList.map((manga) =>
          manga.id === editingManga.id
            ? { ...manga, ...formData, statusClass, progress }
            : manga,
        ),
      )
      showToast('✅ 已儲存變更')
    } else {
      const newManga = {
        id: Date.now(),
        ...formData,
        statusClass,
        progress,
      }
      setMangaList((currentList) => [newManga, ...currentList])
      showToast('✅ 新增成功！已貼上書架')
    }

    closeModal()
  }

  return (
    <main className="manga-page">
      <div className="filters" aria-label="追漫篩選">
        <button
          className={activeStatus === 'all' ? 'filter-pill on' : 'filter-pill'}
          type="button"
          onClick={() => setActiveStatus('all')}
        >
          全部 {mangaList.length}
        </button>
        {readingStatuses.map((status) => (
          <button
            className={activeStatus === status.name ? 'filter-pill on' : 'filter-pill'}
            type="button"
            key={status.id}
            onClick={() => setActiveStatus(status.name)}
          >
            {status.name}
          </button>
        ))}
        <button className="filter-pill add-pill" type="button" onClick={openAddModal}>
          ＋ 新增追漫
        </button>
      </div>

      <div className="board">
        {visibleManga.map((manga) => (
          <MangaCard key={manga.id} manga={manga} onEdit={openEditModal} />
        ))}
      </div>

      <button className="fab-add show" type="button" aria-label="新增追漫" onClick={openAddModal}>
        ＋
      </button>

      <MangaModal
        isOpen={isModalOpen}
        manga={editingManga}
        readingStatuses={readingStatuses}
        genreOptions={genreOptions}
        onClose={closeModal}
        onSave={saveManga}
      />

      <div className={toastMessage ? 'toast show' : 'toast'} role="status" aria-live="polite">
        {toastMessage}
      </div>
    </main>
  )
}

export default MangaPage
