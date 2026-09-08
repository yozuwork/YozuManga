import { useEffect, useState } from 'react'
import { FiLink, FiPlus } from 'react-icons/fi'
import ExternalLinkCard from '../components/links/ExternalLinkCard.jsx'
import ExternalLinkModal from '../components/links/ExternalLinkModal.jsx'
import { useDialog } from '../components/common/DialogProvider.jsx'
import { ListViewActions, WaterfallStatus } from '../components/common/DisplayModeControl.jsx'
import Pagination from '../components/common/Pagination.jsx'
import SortableBoard, { mergeVisibleOrder } from '../components/common/SortableBoard.jsx'
import useListDisplay from '../hooks/useListDisplay.js'
import './MangaPage.css'
import './BooksPage.css'
import './CartPage.css'

function ExternalLinksPage({
  searchQuery,
  externalLinks,
  externalLinksError,
  readingStatuses,
  onAddLink,
  onUpdateLink,
  onDeleteLink,
  onReorderLinks,
}) {
  const [activeTag, setActiveTag] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLink, setEditingLink] = useState(null)
  const [isEditingCards, setIsEditingCards] = useState(false)
  const { confirm, showMessage } = useDialog()
  const linkTags = readingStatuses.filter((status) => status.types?.includes('link'))

  useEffect(() => {
    if (searchQuery.trim()) setActiveTag('all')
    if (activeTag !== 'all' && !linkTags.some((tag) => tag.name === activeTag)) setActiveTag('all')
  }, [activeTag, linkTags, searchQuery])

  const query = searchQuery.trim().toLocaleLowerCase('zh-Hant')
  const visibleLinks = externalLinks.filter((link) => {
    const tags = link.tags?.length ? link.tags : link.statuses ?? []
    const text = [link.title, link.url, link.pageName, link.siteName, link.description, ...tags]
      .filter(Boolean).join(' ').toLocaleLowerCase('zh-Hant')
    return (activeTag === 'all' || tags.includes(activeTag)) && text.includes(query)
  })
  const display = useListDisplay(visibleLinks, `${activeTag}\u0000${query}`)

  function openAdd() {
    setEditingLink(null)
    setIsModalOpen(true)
  }

  function openEdit(link) {
    setEditingLink(link)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingLink(null)
  }

  async function saveLink(data) {
    try {
      if (editingLink) await onUpdateLink(editingLink.id, data)
      else await onAddLink(data)
      showMessage(editingLink ? '外部連結已更新。' : '外部連結已新增。', { title: '儲存成功', variant: 'success' })
      closeModal()
    } catch (error) {
      showMessage(error.message || '儲存失敗。', { title: '儲存失敗', variant: 'error' })
    }
  }

  async function deleteLink(link) {
    const ok = await confirm(`確定要刪除「${link.title}」嗎？`, { title: '刪除外部連結', variant: 'danger', confirmLabel: '刪除' })
    if (!ok) return
    try {
      await onDeleteLink(link.id)
      showMessage('外部連結已刪除。', { title: '刪除成功', variant: 'success' })
    } catch (error) {
      showMessage(error.message || '刪除失敗。', { title: '刪除失敗', variant: 'error' })
    }
  }

  async function reorder(reorderedVisible) {
    try {
      await onReorderLinks(mergeVisibleOrder(externalLinks, reorderedVisible))
    } catch (error) {
      showMessage(error.message || '排序儲存失敗。', { title: '排序儲存失敗', variant: 'error' })
    }
  }

  async function updateCoverPosition(id, position) {
    try {
      await onUpdateLink(id, position)
    } catch (error) {
      showMessage(error.message || '封面位置儲存失敗。', { title: '封面位置儲存失敗', variant: 'error' })
    }
  }

  return (
    <main className="books-page external-links-page">
      <div className="filters" aria-label="外部連結篩選">
        <div className="filter-options">
          <button className={activeTag === 'all' ? 'filter-pill on' : 'filter-pill'} type="button" onClick={() => setActiveTag('all')}>全部 {externalLinks.length} 個</button>
          {linkTags.map((tag) => <button className={activeTag === tag.name ? 'filter-pill on' : 'filter-pill'} type="button" key={tag.id} onClick={() => setActiveTag(tag.name)}>{tag.name}</button>)}
          <button className="filter-pill add-pill button-with-icon" type="button" onClick={openAdd}><FiPlus /> 新增連結</button>
        </div>
        <ListViewActions value={display.mode} onChange={display.setMode} cardSize={display.cardSize} onCardSizeChange={display.setCardSize} isEditing={isEditingCards} onToggleEditing={() => setIsEditingCards((value) => !value)} />
      </div>

      {externalLinksError && <aside className="cart-permission-warning" role="alert"><strong>外部連結目前無法連線</strong><span>Firestore 尚未允許讀寫 externalLinks collection，請更新安全規則後重新載入。</span></aside>}
      {!externalLinksError && externalLinks.length === 0 && <section className="cart-empty-state"><FiLink /><h2>還沒有外部連結</h2><p>收藏常用的漫畫網站、書店、工具或其他資源。</p><button className="button-with-icon" type="button" onClick={openAdd}><FiPlus /> 新增第一個連結</button></section>}

      <SortableBoard items={display.displayItems} onReorder={reorder} cardSize={display.cardSize}>
        {(link) => <ExternalLinkCard link={link} linkTags={linkTags} onEdit={openEdit} onDelete={deleteLink} onUpdateCoverPosition={updateCoverPosition} editMode={isEditingCards} />}
      </SortableBoard>

      {display.isWaterfall ? <WaterfallStatus shownCount={display.displayItems.length} totalItems={visibleLinks.length} hasMore={display.hasMore} loadMoreRef={display.loadMoreRef} /> : <Pagination currentPage={display.currentPage} totalPages={display.totalPages} totalItems={visibleLinks.length} pageSize={display.pageSize} onPageChange={display.setCurrentPage} />}
      <button className="fab-add show" type="button" aria-label="新增外部連結" disabled={Boolean(externalLinksError)} onClick={openAdd}><FiPlus /></button>
      <ExternalLinkModal isOpen={isModalOpen} item={editingLink} linkTags={linkTags} onClose={closeModal} onSave={saveLink} />
    </main>
  )
}

export default ExternalLinksPage
