import { useEffect, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import { useDialog } from '../components/common/DialogProvider.jsx'
import { ListViewActions, WaterfallStatus } from '../components/common/DisplayModeControl.jsx'
import Pagination from '../components/common/Pagination.jsx'
import SelectionToolbar from '../components/common/SelectionToolbar.jsx'
import SortableBoard, { mergeVisibleOrder } from '../components/common/SortableBoard.jsx'
import MangaCard from '../components/manga/MangaCard.jsx'
import MangaModal from '../components/manga/MangaModal.jsx'
import useCardSelection from '../hooks/useCardSelection.js'
import useListDisplay from '../hooks/useListDisplay.js'
import './MangaPage.css'

function MangaPage({
  searchQuery,
  mangaList,
  categories,
  readingStatuses,
  onAddManga,
  onUpdateManga,
  onDeleteManga,
  onDeleteMangas,
  onReorderMangas,
  relatedWorks,
  onNavigateRelated,
}) {
  const [activeStatus, setActiveStatus] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingManga, setEditingManga] = useState(null)
  const [isEditingCards, setIsEditingCards] = useState(false)
  const { confirm, showMessage } = useDialog()
  const selection = useCardSelection(mangaList)

  const applicableStatuses = readingStatuses.filter((status) => status.types.includes('manga'))
  const mangaStatuses = applicableStatuses.length ? applicableStatuses : readingStatuses
  const mangaStatusKey = mangaStatuses.map((status) => status.name).join('\u0000')

  useEffect(() => {
    const statusNames = mangaStatusKey ? mangaStatusKey.split('\u0000') : []
    if (activeStatus !== 'all' && !statusNames.includes(activeStatus)) {
      setActiveStatus('all')
    }
  }, [activeStatus, mangaStatusKey])

  useEffect(() => {
    if (searchQuery.trim()) setActiveStatus('all')
  }, [searchQuery])

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('zh-Hant')
  const visibleManga = mangaList.filter((manga) => {
    const statuses = manga.statuses?.length ? manga.statuses : [manga.status]
    const genres = manga.genres?.length ? manga.genres : [manga.genre]
    const matchesStatus = activeStatus === 'all' || statuses.includes(activeStatus)
    const searchableText = [
      manga.title,
      manga.originalTitle,
      ...genres,
      manga.author,
      manga.serializationStatus,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('zh-Hant')

    return matchesStatus && searchableText.includes(normalizedQuery)
  })
  const mangaCategories = categories
    .filter((category) => category.types.includes('manga'))
    .map((category) => category.name)
  const display = useListDisplay(visibleManga, `${activeStatus}\u0000${normalizedQuery}`)

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

  async function saveManga(formData) {
    const total = formData.total
    const progress = total
      ? Math.min(100, Math.round((formData.current / total) * 100))
      : formData.current > 0
        ? 100
        : 0

    try {
      if (editingManga) {
        await onUpdateManga(editingManga.id, { ...formData, progress })
        showMessage('追漫作品的變更已儲存。', { title: '儲存成功', variant: 'success' })
      } else {
        await onAddManga({ ...formData, progress })
        showMessage('新的追漫作品已貼上書架。', { title: '新增成功', variant: 'success' })
      }
      closeModal()
    } catch (error) {
      showMessage(error.message, { title: '儲存失敗', variant: 'error' })
    }
  }

  async function deleteManga(manga) {
    const didConfirm = await confirm(`確定要刪除「${manga.title}」嗎？`, {
      title: '刪除追漫作品',
      variant: 'danger',
      confirmLabel: '刪除',
    })
    if (!didConfirm) return

    try {
      await onDeleteManga(manga.id)
      showMessage(`「${manga.title}」已從書庫刪除。`, { title: '刪除成功', variant: 'success' })
    } catch (error) {
      showMessage(error.message, { title: '刪除失敗', variant: 'error' })
    }
  }

  async function deleteSelectedMangas() {
    const ids = [...selection.selectedIds]
    const didConfirm = await confirm(`確定要刪除選取的 ${ids.length} 部追漫作品嗎？`, {
      title: '批次刪除追漫作品',
      variant: 'danger',
      confirmLabel: `刪除 ${ids.length} 項`,
    })
    if (!didConfirm) return

    try {
      await onDeleteMangas(ids)
      selection.stopSelecting()
      setIsEditingCards(false)
      showMessage(`已刪除 ${ids.length} 部追漫作品。`, { title: '批次刪除成功', variant: 'success' })
    } catch (error) {
      showMessage(error.message, { title: '批次刪除失敗', variant: 'error' })
    }
  }

  async function reorderVisibleMangas(reorderedVisibleItems) {
    try {
      await onReorderMangas(mergeVisibleOrder(mangaList, reorderedVisibleItems))
    } catch (error) {
      showMessage(error.message, { title: '排序儲存失敗', variant: 'error' })
    }
  }

  async function updateMangaCoverPosition(id, position) {
    try {
      await onUpdateManga(id, position)
    } catch (error) {
      showMessage(error.message, { title: '封面位置儲存失敗', variant: 'error' })
    }
  }

  return (
    <main className="manga-page">
      <div className="filters" aria-label="追漫篩選">
        <div className="filter-options">
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
          <button className="filter-pill add-pill button-with-icon" type="button" onClick={openAddModal}>
            <FiPlus aria-hidden="true" /> 新增追漫
          </button>
        </div>
        <ListViewActions
          value={display.mode}
          onChange={display.setMode}
          cardSize={display.cardSize}
          onCardSizeChange={display.setCardSize}
          isEditing={isEditingCards}
          onToggleEditing={() => {
            if (isEditingCards) {
              setIsEditingCards(false)
              selection.stopSelecting()
            } else {
              setIsEditingCards(true)
              selection.startSelecting()
            }
          }}
        />
      </div>

      <SelectionToolbar
        isSelecting={selection.isSelecting}
        selectedCount={selection.selectedCount}
        visibleIds={display.displayItems.map((manga) => manga.id)}
        onSelectAll={selection.selectAll}
        onDelete={deleteSelectedMangas}
        onCancel={() => {
          selection.stopSelecting()
          setIsEditingCards(false)
        }}
      />

      <SortableBoard
        items={display.displayItems}
        disabled={selection.isSelecting}
        onReorder={reorderVisibleMangas}
        cardSize={display.cardSize}
      >
        {(manga) => (
          <MangaCard
            manga={manga}
            readingStatuses={readingStatuses}
            onEdit={openEditModal}
            onDelete={deleteManga}
            selectionMode={selection.isSelecting}
            selected={selection.selectedIds.has(manga.id)}
            onToggleSelect={selection.toggleSelected}
            relatedWorks={relatedWorks}
            onNavigateRelated={onNavigateRelated}
            onUpdateCoverPosition={updateMangaCoverPosition}
            editMode={isEditingCards}
          />
        )}
      </SortableBoard>

      {display.isWaterfall ? (
        <WaterfallStatus
          shownCount={display.displayItems.length}
          totalItems={visibleManga.length}
          hasMore={display.hasMore}
          loadMoreRef={display.loadMoreRef}
        />
      ) : (
        <Pagination
          currentPage={display.currentPage}
          totalPages={display.totalPages}
          totalItems={visibleManga.length}
          pageSize={display.pageSize}
          onPageChange={display.setCurrentPage}
        />
      )}

      <button className="fab-add show" type="button" aria-label="新增追漫" onClick={openAddModal}>
        <FiPlus aria-hidden="true" />
      </button>

      <MangaModal
        isOpen={isModalOpen}
        manga={editingManga}
        readingStatuses={mangaStatuses}
        genreOptions={mangaCategories}
        onClose={closeModal}
        onSave={saveManga}
        relatedWorks={relatedWorks}
      />
    </main>
  )
}

export default MangaPage
