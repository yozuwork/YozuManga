import { useEffect, useState } from 'react'
import MangaCard from '../components/manga/MangaCard.jsx'
import MangaModal from '../components/manga/MangaModal.jsx'
import './MangaPage.css'

function MangaPage({
  searchQuery,
  mangaList,
  setMangaList,
  categories,
  readingStatuses,
  showToast,
}) {
  const [activeStatus, setActiveStatus] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingManga, setEditingManga] = useState(null)

  const applicableStatuses = readingStatuses.filter((status) => status.types.includes('manga'))
  const mangaStatuses = applicableStatuses.length ? applicableStatuses : readingStatuses
  const mangaStatusKey = mangaStatuses.map((status) => status.name).join('\u0000')

  useEffect(() => {
    const statusNames = mangaStatusKey ? mangaStatusKey.split('\u0000') : []
    if (activeStatus !== 'all' && !statusNames.includes(activeStatus)) {
      setActiveStatus('all')
    }
  }, [activeStatus, mangaStatusKey])

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('zh-Hant')
  const visibleManga = mangaList.filter((manga) => {
    const matchesStatus = activeStatus === 'all' || manga.status === activeStatus
    const searchableText = [manga.title, manga.genre, manga.author]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('zh-Hant')

    return matchesStatus && searchableText.includes(normalizedQuery)
  })
  const mangaCategories = categories
    .filter((category) => category.types.includes('manga'))
    .map((category) => category.name)

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
    const total = formData.total
    const progress = total
      ? Math.min(100, Math.round((formData.current / total) * 100))
      : formData.current > 0
        ? 100
        : 0

    if (editingManga) {
      setMangaList((currentList) =>
        currentList.map((manga) =>
          manga.id === editingManga.id ? { ...manga, ...formData, progress } : manga,
        ),
      )
      showToast('✅ 已儲存變更')
    } else {
      setMangaList((currentList) => [
        { id: Date.now(), ...formData, progress },
        ...currentList,
      ])
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
        {mangaStatuses.map((status) => (
          <button
            className={activeStatus === status.name ? 'filter-pill on' : 'filter-pill'}
            type="button"
            key={status.name}
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
          <MangaCard
            key={manga.id}
            manga={manga}
            statusClass={readingStatuses.find((status) => status.name === manga.status)?.color ?? 'marker'}
            onEdit={openEditModal}
          />
        ))}
      </div>

      <button className="fab-add show" type="button" aria-label="新增追漫" onClick={openAddModal}>
        ＋
      </button>

      <MangaModal
        isOpen={isModalOpen}
        manga={editingManga}
        readingStatuses={mangaStatuses}
        genreOptions={mangaCategories}
        onClose={closeModal}
        onSave={saveManga}
      />
    </main>
  )
}

export default MangaPage
