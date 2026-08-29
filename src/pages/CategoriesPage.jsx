import { useState } from 'react'
import { FiBook, FiBookOpen, FiPlus } from 'react-icons/fi'
import { useDialog } from '../components/common/DialogProvider.jsx'
import { ListViewActions, WaterfallStatus } from '../components/common/DisplayModeControl.jsx'
import Pagination from '../components/common/Pagination.jsx'
import SelectionToolbar from '../components/common/SelectionToolbar.jsx'
import SortableBoard, { mergeVisibleOrder } from '../components/common/SortableBoard.jsx'
import AddCategoryModal from '../components/categories/AddCategoryModal.jsx'
import CategoryCard from '../components/categories/CategoryCard.jsx'
import useCardSelection from '../hooks/useCardSelection.js'
import useListDisplay from '../hooks/useListDisplay.js'
import './MangaPage.css'
import './CategoriesPage.css'

function CategoriesPage({
  categories,
  onAddCategory,
  onDeleteCategory,
  onDeleteCategories,
  onReorderCategories,
  onNavigateCategory,
}) {
  const [activeCategoryType, setActiveCategoryType] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditingCards, setIsEditingCards] = useState(false)
  const { confirm, showMessage } = useDialog()
  const selection = useCardSelection(categories)

  const visibleCategories = categories.filter(
    (category) => activeCategoryType === 'all' || category.types.includes(activeCategoryType),
  )
  const display = useListDisplay(visibleCategories, activeCategoryType)

  async function addCategory(category) {
    try {
      await onAddCategory(category)
      showMessage('新的分類已建立。', { title: '新增成功', variant: 'success' })
      return true
    } catch (error) {
      showMessage(error.message, { title: '新增失敗', variant: 'error' })
      return false
    }
  }

  async function deleteCategory(category) {
    const didConfirm = await confirm(`確定要刪除分類「${category.name}」嗎？`, {
      title: '刪除分類',
      variant: 'danger',
      confirmLabel: '刪除',
    })
    if (!didConfirm) return

    try {
      await onDeleteCategory(category.id)
      showMessage(`分類「${category.name}」已刪除。`, { title: '刪除成功', variant: 'success' })
    } catch (error) {
      showMessage(error.message, { title: '刪除失敗', variant: 'error' })
    }
  }

  async function deleteSelectedCategories() {
    const ids = [...selection.selectedIds]
    const didConfirm = await confirm(`確定要刪除選取的 ${ids.length} 個分類嗎？`, {
      title: '批次刪除分類',
      variant: 'danger',
      confirmLabel: `刪除 ${ids.length} 項`,
    })
    if (!didConfirm) return

    try {
      await onDeleteCategories(ids)
      selection.stopSelecting()
      setIsEditingCards(false)
      showMessage(`已刪除 ${ids.length} 個分類。`, { title: '批次刪除成功', variant: 'success' })
    } catch (error) {
      showMessage(error.message, { title: '批次刪除失敗', variant: 'error' })
    }
  }

  async function reorderVisibleCategories(reorderedVisibleItems) {
    try {
      await onReorderCategories(mergeVisibleOrder(categories, reorderedVisibleItems))
    } catch (error) {
      showMessage(error.message, { title: '排序儲存失敗', variant: 'error' })
    }
  }

  return (
    <main className="categories-page">
      <div className="filters" aria-label="分類篩選">
        <div className="filter-options">
          {[
            ['all', '全部', null],
            ['manga', '追漫', FiBookOpen],
            ['book', '實體書', FiBook],
          ].map(([value, label, Icon]) => (
            <button
              className={activeCategoryType === value ? 'filter-pill on button-with-icon' : 'filter-pill button-with-icon'}
              type="button"
              key={value}
              onClick={() => setActiveCategoryType(value)}
            >
              {Icon && <Icon aria-hidden="true" />}
              {label}
            </button>
          ))}
          <button className="filter-pill add-pill button-with-icon" type="button" onClick={() => setIsModalOpen(true)}>
            <FiPlus aria-hidden="true" /> 新增分類
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
        visibleIds={display.displayItems.map((category) => category.id)}
        onSelectAll={selection.selectAll}
        onDelete={deleteSelectedCategories}
        onCancel={() => {
          selection.stopSelecting()
          setIsEditingCards(false)
        }}
      />

      <SortableBoard
        items={display.displayItems}
        disabled={selection.isSelecting}
        onReorder={reorderVisibleCategories}
      >
        {(category) => (
          <CategoryCard
            category={category}
            onNavigate={onNavigateCategory}
            onDelete={deleteCategory}
            selectionMode={selection.isSelecting}
            selected={selection.selectedIds.has(category.id)}
            onToggleSelect={selection.toggleSelected}
            editMode={isEditingCards}
          />
        )}
      </SortableBoard>

      {display.isWaterfall ? (
        <WaterfallStatus
          shownCount={display.displayItems.length}
          totalItems={visibleCategories.length}
          hasMore={display.hasMore}
          loadMoreRef={display.loadMoreRef}
        />
      ) : (
        <Pagination
          currentPage={display.currentPage}
          totalPages={display.totalPages}
          totalItems={visibleCategories.length}
          pageSize={display.pageSize}
          onPageChange={display.setCurrentPage}
        />
      )}

      <button className="fab-add show" type="button" aria-label="新增分類" onClick={() => setIsModalOpen(true)}>
        <FiPlus aria-hidden="true" />
      </button>
      <AddCategoryModal
        isOpen={isModalOpen}
        categories={categories}
        onClose={() => setIsModalOpen(false)}
        onAdd={addCategory}
      />
    </main>
  )
}

export default CategoriesPage
