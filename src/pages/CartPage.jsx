import { useEffect, useState } from 'react'
import { FiCopy, FiHeart, FiPlus } from 'react-icons/fi'
import CartItemCard from '../components/cart/CartItemCard.jsx'
import CartItemModal from '../components/cart/CartItemModal.jsx'
import { useDialog } from '../components/common/DialogProvider.jsx'
import CardTemplateModal from '../components/common/CardTemplateModal.jsx'
import { ListViewActions, WaterfallStatus } from '../components/common/DisplayModeControl.jsx'
import Pagination from '../components/common/Pagination.jsx'
import SortableBoard, { mergeVisibleOrder } from '../components/common/SortableBoard.jsx'
import useListDisplay from '../hooks/useListDisplay.js'
import { getCardTemplates, saveCardTemplate } from '../utils/cardTemplates.js'
import './MangaPage.css'
import './BooksPage.css'
import './CartPage.css'

const legacyPriorityLabels = { high: '準備購買', medium: '有興趣', low: '先收藏' }

function getCartStatuses(item) {
  if (item.statuses?.length) return item.statuses
  if (item.status) return [item.status]
  return [legacyPriorityLabels[item.priority] ?? '有興趣']
}

function matchesFilter(item, filter) {
  if (filter === 'purchased') return Boolean(item.purchased)
  if (item.purchased) return false
  if (filter === 'all') return true
  if (filter === 'physical') return ['physical', 'either'].includes(item.format)
  if (filter === 'digital') return ['digital', 'either'].includes(item.format)
  if (filter.startsWith('status:')) return getCartStatuses(item).includes(filter.slice(7))
  return true
}

function CartPage({
  searchQuery,
  cartItems,
  cartError,
  readingStatuses,
  relatedWorks,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  onNavigateRelated,
}) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [isEditingCards, setIsEditingCards] = useState(false)
  const [isTemplateOpen, setIsTemplateOpen] = useState(false)
  const [cardTemplates, setCardTemplates] = useState(getCardTemplates)
  const { confirm, showMessage } = useDialog()
  const configuredCartStatuses = readingStatuses.filter((status) => status.types?.includes('cart'))
  const cartStatuses = configuredCartStatuses.length
    ? configuredCartStatuses
    : [
        { name: '準備購買', color: 'pink', types: ['cart'] },
        { name: '有興趣', color: 'marker', types: ['cart'] },
        { name: '先收藏', color: 'mint', types: ['cart'] },
      ]
  const filters = [
    { id: 'all', label: '全部' },
    { id: 'physical', label: '實體書' },
    { id: 'digital', label: '電子書' },
    ...cartStatuses.map((status) => ({ id: `status:${status.name}`, label: status.name })),
    { id: 'purchased', label: '已購買' },
  ]

  useEffect(() => {
    if (searchQuery.trim()) setActiveFilter('all')
  }, [searchQuery])

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('zh-Hant')
  const unpurchasedCount = cartItems.filter((item) => !item.purchased).length
  const visibleItems = cartItems.filter((item) => {
    const linkedTitles = (item.relatedWorks ?? []).map((work) => work.title)
    const searchableText = [
      item.title,
      item.author,
      item.volumeNote,
      ...(item.purchaseVolumes ?? []),
      item.note,
      ...linkedTitles,
    ].filter(Boolean).join(' ').toLocaleLowerCase('zh-Hant')
    return matchesFilter(item, activeFilter) && searchableText.includes(normalizedQuery)
  })
  const display = useListDisplay(visibleItems, `${activeFilter}\u0000${normalizedQuery}`)

  function openAddModal() {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  function openEditModal(item) {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingItem(null)
  }

  async function saveItem(data) {
    try {
      if (editingItem) {
        await onUpdateItem(editingItem.id, data)
        showMessage('購物車項目已更新。', { title: '儲存成功', variant: 'success' })
      } else {
        await onAddItem(data)
        showMessage('已加入興趣書單。', { title: '加入成功', variant: 'success' })
      }
      closeModal()
    } catch (error) {
      showMessage(error.message || '儲存失敗。', { title: '儲存失敗', variant: 'error' })
    }
  }

  async function deleteItem(item) {
    const didConfirm = await confirm(`確定要從購物車移除「${item.title}」嗎？`, {
      title: '移除購物車項目',
      variant: 'danger',
      confirmLabel: '移除',
    })
    if (!didConfirm) return
    try {
      await onDeleteItem(item.id)
      showMessage(`「${item.title}」已移除。`, { title: '移除成功', variant: 'success' })
    } catch (error) {
      showMessage(error.message || '移除失敗。', { title: '移除失敗', variant: 'error' })
    }
  }

  async function reorderVisibleItems(reorderedVisibleItems) {
    try {
      await onReorderItems(mergeVisibleOrder(cartItems, reorderedVisibleItems))
    } catch (error) {
      showMessage(error.message || '排序儲存失敗。', { title: '排序儲存失敗', variant: 'error' })
    }
  }

  async function updateCoverPosition(id, position) {
    try {
      await onUpdateItem(id, position)
    } catch (error) {
      showMessage(error.message || '封面位置儲存失敗。', {
        title: '封面位置儲存失敗',
        variant: 'error',
      })
    }
  }

  function saveTemplate(template) {
    const templates = saveCardTemplate('cart', template)
    setCardTemplates(templates)
    setIsTemplateOpen(false)
    showMessage('之後加入興趣書單時會自動套用這組預設狀態。', {
      title: '興趣書單模板已儲存',
      variant: 'success',
    })
  }

  return (
    <main className="books-page cart-page">
      <div className="filters" aria-label="購物車篩選">
        <div className="filter-options">
          {filters.map((filter) => (
            <button
              className={activeFilter === filter.id ? 'filter-pill on' : 'filter-pill'}
              type="button"
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}{filter.id === 'all' ? ` ${unpurchasedCount} 本` : ''}
            </button>
          ))}
          <button className="filter-pill add-pill button-with-icon" type="button" onClick={openAddModal}>
            <FiPlus aria-hidden="true" /> 加入感興趣的書
          </button>
        </div>
        <ListViewActions
          leadingAction={(
            <button className="template-trigger" type="button" onClick={() => setIsTemplateOpen(true)}>
              <FiCopy aria-hidden="true" /> 模板
            </button>
          )}
          value={display.mode}
          onChange={display.setMode}
          cardSize={display.cardSize}
          onCardSizeChange={display.setCardSize}
          isEditing={isEditingCards}
          onToggleEditing={() => setIsEditingCards((value) => !value)}
        />
      </div>

      {cartError && (
        <aside className="cart-permission-warning" role="alert">
          <strong>購物車目前無法連線</strong>
          <span>Firestore 尚未允許讀寫 shoppingCart collection，請更新安全規則後重新載入。</span>
        </aside>
      )}

      {!cartError && cartItems.length === 0 && (
        <section className="cart-empty-state">
          <FiHeart aria-hidden="true" />
          <h2>興趣書單還是空的</h2>
          <p>收藏感興趣的實體書或電子書，也能連回書庫裡已有的作品。</p>
          <button className="button-with-icon" type="button" onClick={openAddModal}>
            <FiPlus aria-hidden="true" /> 收藏第一本書
          </button>
        </section>
      )}

      {cartItems.length > 0 && visibleItems.length === 0 && (
        <section className="cart-no-results">這個篩選條件下沒有書。</section>
      )}

      <SortableBoard
        items={display.displayItems}
        onReorder={reorderVisibleItems}
        cardSize={display.cardSize}
      >
        {(item) => (
          <CartItemCard
            item={item}
            relatedWorks={relatedWorks}
            readingStatuses={cartStatuses}
            onEdit={openEditModal}
            onDelete={deleteItem}
            onNavigateRelated={onNavigateRelated}
            onUpdateCoverPosition={updateCoverPosition}
            editMode={isEditingCards}
          />
        )}
      </SortableBoard>

      {display.isWaterfall ? (
        <WaterfallStatus
          shownCount={display.displayItems.length}
          totalItems={visibleItems.length}
          hasMore={display.hasMore}
          loadMoreRef={display.loadMoreRef}
        />
      ) : (
        <Pagination
          currentPage={display.currentPage}
          totalPages={display.totalPages}
          totalItems={visibleItems.length}
          pageSize={display.pageSize}
          onPageChange={display.setCurrentPage}
        />
      )}

      <button className="fab-add show" type="button" aria-label="加入感興趣的書" disabled={Boolean(cartError)} onClick={openAddModal}>
        <FiPlus aria-hidden="true" />
      </button>

      <CartItemModal
        isOpen={isModalOpen}
        item={editingItem}
        relatedWorks={relatedWorks}
        readingStatuses={cartStatuses}
        onClose={closeModal}
        onSave={saveItem}
        defaultTemplate={cardTemplates.cart}
      />
      <CardTemplateModal
        isOpen={isTemplateOpen}
        type="cart"
        template={cardTemplates.cart}
        readingStatuses={cartStatuses}
        onClose={() => setIsTemplateOpen(false)}
        onSave={saveTemplate}
      />
    </main>
  )
}

export default CartPage
