import { useCallback, useEffect, useRef, useState } from 'react'
import { FiDownload, FiPlus } from 'react-icons/fi'
import { useDialog } from '../components/common/DialogProvider.jsx'
import { ListViewActions, WaterfallStatus } from '../components/common/DisplayModeControl.jsx'
import Pagination from '../components/common/Pagination.jsx'
import SelectionToolbar from '../components/common/SelectionToolbar.jsx'
import SortableBoard, { mergeVisibleOrder } from '../components/common/SortableBoard.jsx'
import BookCard from '../components/books/BookCard.jsx'
import BookModal from '../components/books/BookModal.jsx'
import { notionBookImportCandidates } from '../data/notionBookImport.js'
import useCardSelection from '../hooks/useCardSelection.js'
import useListDisplay from '../hooks/useListDisplay.js'
import './MangaPage.css'
import './BooksPage.css'

function BooksPage({
  searchQuery,
  bookList,
  categories,
  readingStatuses,
  onAddBook,
  onUpdateBook,
  onDeleteBook,
  onDeleteBooks,
  onReorderBooks,
  onImportNotionBooks,
  relatedWorks,
  onNavigateRelated,
}) {
  const [activeBookStatus, setActiveBookStatus] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [isEditingCards, setIsEditingCards] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const didPromptImportRef = useRef(false)
  const { confirm, showMessage } = useDialog()
  const selection = useCardSelection(bookList)

  const applicableStatuses = readingStatuses.filter((status) => status.types.includes('book'))
  const bookStatuses = applicableStatuses.length ? applicableStatuses : readingStatuses
  const bookStatusKey = bookStatuses.map((status) => status.name).join('\u0000')

  useEffect(() => {
    const statusNames = bookStatusKey ? bookStatusKey.split('\u0000') : []
    if (activeBookStatus !== 'all' && !statusNames.includes(activeBookStatus)) {
      setActiveBookStatus('all')
    }
  }, [activeBookStatus, bookStatusKey])

  useEffect(() => {
    if (searchQuery.trim()) setActiveBookStatus('all')
  }, [searchQuery])

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('zh-Hant')
  const visibleBooks = bookList.filter((book) => {
    const matchesStatus = activeBookStatus === 'all' || book.status === activeBookStatus
    const searchableText = [
      book.title,
      book.originalTitle,
      book.genre,
      book.author,
      book.publisher,
      book.shelf,
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('zh-Hant')
    return matchesStatus && searchableText.includes(normalizedQuery)
  })
  const bookCategories = categories
    .filter((category) => category.types.includes('book'))
    .map((category) => category.name)
  const display = useListDisplay(visibleBooks, `${activeBookStatus}\u0000${normalizedQuery}`)

  const importNotionBooks = useCallback(async () => {
    const didConfirm = await confirm(
      `目前實體書庫是空的，要匯入整理好的 ${notionBookImportCandidates.length} 本 Notion 實體書嗎？相同書名會自動跳過。`,
      {
        title: '匯入 Notion 實體書',
        confirmLabel: '開始匯入',
      },
    )
    if (!didConfirm) return

    setIsImporting(true)
    try {
      const result = await onImportNotionBooks()
      showMessage(
        result.added
          ? `已新增 ${result.added} 本實體書，現在會直接顯示在書庫中。`
          : `清單中的 ${result.total} 本書都已存在。`,
        { title: result.added ? '匯入完成' : '無需匯入', variant: 'success' },
      )
    } catch (error) {
      showMessage(error.message || '匯入失敗。', { title: '匯入失敗', variant: 'error' })
    } finally {
      setIsImporting(false)
    }
  }, [confirm, onImportNotionBooks, showMessage])

  useEffect(() => {
    if (bookList.length > 0 || didPromptImportRef.current) return
    didPromptImportRef.current = true
    importNotionBooks()
  }, [bookList.length, importNotionBooks])

  function openAddModal() {
    setEditingBook(null)
    setIsModalOpen(true)
  }

  function openEditModal(book) {
    setEditingBook(book)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingBook(null)
  }

  async function saveBook(formData) {
    try {
      if (editingBook) {
        await onUpdateBook(editingBook.id, formData)
        showMessage('實體書的變更已儲存。', { title: '儲存成功', variant: 'success' })
      } else {
        await onAddBook(formData)
        showMessage('新的實體書已貼上書架。', { title: '新增成功', variant: 'success' })
      }
      closeModal()
    } catch (error) {
      showMessage(error.message, { title: '儲存失敗', variant: 'error' })
    }
  }

  async function deleteBook(book) {
    const didConfirm = await confirm(`確定要刪除「${book.title}」嗎？`, {
      title: '刪除實體書',
      variant: 'danger',
      confirmLabel: '刪除',
    })
    if (!didConfirm) return

    try {
      await onDeleteBook(book.id)
      showMessage(`「${book.title}」已從書庫刪除。`, { title: '刪除成功', variant: 'success' })
    } catch (error) {
      showMessage(error.message, { title: '刪除失敗', variant: 'error' })
    }
  }

  async function deleteSelectedBooks() {
    const ids = [...selection.selectedIds]
    const didConfirm = await confirm(`確定要刪除選取的 ${ids.length} 套實體書嗎？`, {
      title: '批次刪除實體書',
      variant: 'danger',
      confirmLabel: `刪除 ${ids.length} 項`,
    })
    if (!didConfirm) return

    try {
      await onDeleteBooks(ids)
      selection.stopSelecting()
      setIsEditingCards(false)
      showMessage(`已刪除 ${ids.length} 套實體書。`, { title: '批次刪除成功', variant: 'success' })
    } catch (error) {
      showMessage(error.message, { title: '批次刪除失敗', variant: 'error' })
    }
  }

  async function reorderVisibleBooks(reorderedVisibleItems) {
    try {
      await onReorderBooks(mergeVisibleOrder(bookList, reorderedVisibleItems))
    } catch (error) {
      showMessage(error.message, { title: '排序儲存失敗', variant: 'error' })
    }
  }

  async function updateBookCoverPosition(id, position) {
    try {
      await onUpdateBook(id, position)
    } catch (error) {
      showMessage(error.message, { title: '封面位置儲存失敗', variant: 'error' })
    }
  }

  return (
    <main className="books-page">
      <div className="filters" aria-label="實體書篩選">
        <div className="filter-options">
          <button
            className={activeBookStatus === 'all' ? 'filter-pill on' : 'filter-pill'}
            type="button"
            onClick={() => setActiveBookStatus('all')}
          >
            全部 {bookList.length} 套
          </button>
          {bookStatuses.map((status) => (
            <button
              className={activeBookStatus === status.name ? 'filter-pill on' : 'filter-pill'}
              type="button"
              key={status.name}
              onClick={() => setActiveBookStatus(status.name)}
            >
              {status.name}
            </button>
          ))}
          <button className="filter-pill add-pill button-with-icon" type="button" onClick={openAddModal}>
            <FiPlus aria-hidden="true" /> 新增書本
          </button>
        </div>
        <ListViewActions
          value={display.mode}
          onChange={display.setMode}
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
        visibleIds={display.displayItems.map((book) => book.id)}
        onSelectAll={selection.selectAll}
        onDelete={deleteSelectedBooks}
        onCancel={() => {
          selection.stopSelecting()
          setIsEditingCards(false)
        }}
      />

      {bookList.length === 0 && (
        <section className="books-empty-state">
          <FiDownload aria-hidden="true" />
          <h2>Notion 實體書尚未匯入</h2>
          <p>已整理好 {notionBookImportCandidates.length} 本有收藏數量的書，圖片不會匯入。</p>
          <button
            className="button-with-icon"
            type="button"
            disabled={isImporting}
            onClick={importNotionBooks}
          >
            <FiDownload aria-hidden="true" />{' '}
            {isImporting ? '匯入中…' : `匯入 ${notionBookImportCandidates.length} 本實體書`}
          </button>
        </section>
      )}

      <SortableBoard
        items={display.displayItems}
        disabled={selection.isSelecting}
        onReorder={reorderVisibleBooks}
      >
        {(book) => (
          <BookCard
            book={book}
            statusClass={readingStatuses.find((status) => status.name === book.status)?.color ?? 'marker'}
            onEdit={openEditModal}
            onDelete={deleteBook}
            selectionMode={selection.isSelecting}
            selected={selection.selectedIds.has(book.id)}
            onToggleSelect={selection.toggleSelected}
            relatedWorks={relatedWorks}
            onNavigateRelated={onNavigateRelated}
            onUpdateCoverPosition={updateBookCoverPosition}
            editMode={isEditingCards}
          />
        )}
      </SortableBoard>

      {display.isWaterfall ? (
        <WaterfallStatus
          shownCount={display.displayItems.length}
          totalItems={visibleBooks.length}
          hasMore={display.hasMore}
          loadMoreRef={display.loadMoreRef}
        />
      ) : (
        <Pagination
          currentPage={display.currentPage}
          totalPages={display.totalPages}
          totalItems={visibleBooks.length}
          pageSize={display.pageSize}
          onPageChange={display.setCurrentPage}
        />
      )}

      <button className="fab-add show" type="button" aria-label="新增書本" onClick={openAddModal}>
        <FiPlus aria-hidden="true" />
      </button>

      <BookModal
        isOpen={isModalOpen}
        book={editingBook}
        readingStatuses={bookStatuses}
        genreOptions={bookCategories}
        onClose={closeModal}
        onSave={saveBook}
        relatedWorks={relatedWorks}
      />
    </main>
  )
}

export default BooksPage
