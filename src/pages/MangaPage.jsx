import { useEffect, useState } from 'react'
import { FiCopy, FiPlus } from 'react-icons/fi'
import { useDialog } from '../components/common/DialogProvider.jsx'
import CardTemplateModal from '../components/common/CardTemplateModal.jsx'
import { ListViewActions, WaterfallStatus } from '../components/common/DisplayModeControl.jsx'
import Pagination from '../components/common/Pagination.jsx'
import SelectionToolbar from '../components/common/SelectionToolbar.jsx'
import SortableBoard, { mergeVisibleOrder } from '../components/common/SortableBoard.jsx'
import MangaCard from '../components/manga/MangaCard.jsx'
import MangaModal from '../components/manga/MangaModal.jsx'
import useCardSelection from '../hooks/useCardSelection.js'
import useListDisplay from '../hooks/useListDisplay.js'
import { getCardTemplates, saveCardTemplate } from '../utils/cardTemplates.js'
import { getSavedMangaSort, MANGA_SORT_OPTIONS, saveMangaSort, sortMangaList } from '../utils/mangaSort.js'
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
  const defaultMangaStatus = readingStatuses.find((status) => status.isDefault && status.types.includes('manga'))?.name
    ?? readingStatuses.find((status) => status.name === '追漫中' && status.types.includes('manga'))?.name
    ?? 'all'
  const [activeStatus, setActiveStatus] = useState(defaultMangaStatus)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingManga, setEditingManga] = useState(null)
  const [isEditingCards, setIsEditingCards] = useState(false)
  const [isTemplateOpen, setIsTemplateOpen] = useState(false)
  const [cardTemplates, setCardTemplates] = useState(getCardTemplates)
  const [sortBy, setSortBy] = useState(getSavedMangaSort)
  const { confirm, showMessage } = useDialog()
  const selection = useCardSelection(mangaList)

  const applicableStatuses = readingStatuses.filter((status) => status.types.includes('manga'))
  const mangaStatuses = applicableStatuses.length ? applicableStatuses : readingStatuses
  const mangaStatusKey = mangaStatuses.map((status) => status.name).join('\u0000')

  useEffect(() => {
    const statusNames = mangaStatusKey ? mangaStatusKey.split('\u0000') : []
    if (activeStatus !== 'all' && !statusNames.includes(activeStatus)) {
      setActiveStatus(statusNames.includes(defaultMangaStatus) ? defaultMangaStatus : 'all')
    }
  }, [activeStatus, defaultMangaStatus, mangaStatusKey])

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
  const sortedManga = sortMangaList(visibleManga, sortBy)
  const isCustomSort = sortBy === 'custom'
  const display = useListDisplay(sortedManga, `${activeStatus}\u0000${normalizedQuery}\u0000${sortBy}`)

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

    const now = Date.now()

    try {
      if (editingManga) {
        const timestamps = {
          ...(Number(formData.current) > Number(editingManga.current ?? 0) ? { lastReadAt: now } : {}),
          ...(Number(formData.total) > Number(editingManga.total ?? 0) ? { episodeUpdatedAt: now } : {}),
        }
        await onUpdateManga(editingManga.id, { ...formData, progress, ...timestamps })
        showMessage('追漫作品的變更已儲存。', { title: '儲存成功', variant: 'success' })
      } else {
        await onAddManga({ ...formData, progress, lastReadAt: now, episodeUpdatedAt: now })
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

  function changeSort(value) {
    if (saveMangaSort(value)) setSortBy(value)
  }

  function markMangaRead(manga) {
    // 點開閱讀連結就算看過；失敗時不打斷開啟連結。
    onUpdateManga(manga.id, { lastReadAt: Date.now() }).catch(() => {})
  }

  async function updateMangaCoverPosition(id, position) {
    try {
      await onUpdateManga(id, position)
    } catch (error) {
      showMessage(error.message, { title: '封面位置儲存失敗', variant: 'error' })
    }
  }

  function saveTemplate(template) {
    const templates = saveCardTemplate('manga', template)
    setCardTemplates(templates)
    setIsTemplateOpen(false)
    showMessage('之後新增追漫時會自動套用這組預設狀態。', {
      title: '追漫模板已儲存',
      variant: 'success',
    })
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
          leadingAction={(
            <>
              <label className="card-size-control sort-control">
                <span>排序</span>
                <select aria-label="排序方式" value={sortBy} onChange={(event) => changeSort(event.target.value)}>
                  {MANGA_SORT_OPTIONS.map((option) => (
                    <option value={option.value} key={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <button className="template-trigger" type="button" onClick={() => setIsTemplateOpen(true)}>
                <FiCopy aria-hidden="true" /> 模板
              </button>
            </>
          )}
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
        disabled={selection.isSelecting || !isCustomSort}
        onReorder={reorderVisibleMangas}
        cardSize={display.cardSize}
      >
        {(manga) => (
          <MangaCard
            manga={manga}
            readingStatuses={mangaStatuses}
            onEdit={openEditModal}
            onDelete={deleteManga}
            selectionMode={selection.isSelecting}
            selected={selection.selectedIds.has(manga.id)}
            onToggleSelect={selection.toggleSelected}
            relatedWorks={relatedWorks}
            onNavigateRelated={onNavigateRelated}
            onUpdateCoverPosition={updateMangaCoverPosition}
            onRead={markMangaRead}
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
        defaultTemplate={cardTemplates.manga}
      />
      <CardTemplateModal
        isOpen={isTemplateOpen}
        type="manga"
        template={cardTemplates.manga}
        readingStatuses={mangaStatuses}
        onClose={() => setIsTemplateOpen(false)}
        onSave={saveTemplate}
      />
    </main>
  )
}

export default MangaPage
