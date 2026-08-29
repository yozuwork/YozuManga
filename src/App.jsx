import { useState } from 'react'
import BottomTabBar from './components/layout/BottomTabBar.jsx'
import Footer from './components/layout/Footer.jsx'
import Header from './components/layout/Header.jsx'
import { useDialog } from './components/common/DialogProvider.jsx'
import useLibraryData from './hooks/useLibraryData.js'
import BooksPage from './pages/BooksPage.jsx'
import CategoriesPage from './pages/CategoriesPage.jsx'
import MangaPage from './pages/MangaPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import { logout } from './services/authService.js'
import { seedInitialData } from './services/seedService.js'
import './App.css'

function App({ user }) {
  const [activeView, setActiveView] = useState('manga')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSeeding, setIsSeeding] = useState(false)
  const library = useLibraryData()
  const { showMessage } = useDialog()
  const relatedWorks = [
    ...library.mangaList.map((manga) => ({ id: manga.id, type: 'manga', title: manga.title })),
    ...library.bookList.map((book) => ({ id: book.id, type: 'book', title: book.title })),
  ]

  function handleViewChange(view) {
    setActiveView(view)
    window.scrollTo({ top: 0 })
  }

  function handleCategoryNavigation(category) {
    handleViewChange(category.types.includes('manga') ? 'manga' : 'books')
    setSearchQuery(category.name)
  }

  function handleRelatedNavigation(relatedWork) {
    const target = relatedWorks.find(
      (work) => work.id === relatedWork.id && work.type === relatedWork.type,
    )
    if (!target) {
      showMessage('關聯作品可能已被刪除。', { title: '找不到作品', variant: 'warning' })
      return
    }

    setActiveView(target.type === 'book' ? 'books' : 'manga')
    setSearchQuery(target.title)
    window.scrollTo({ top: 0 })
  }

  async function handleSeed() {
    setIsSeeding(true)
    try {
      await seedInitialData()
      await library.loadData()
      showMessage('初始資料已寫入 Firestore。', {
        title: '初始化完成',
        variant: 'success',
      })
    } catch (error) {
      showMessage(error.message || '初始化失敗。', {
        title: '初始化失敗',
        variant: 'error',
      })
    } finally {
      setIsSeeding(false)
    }
  }

  if (library.loading) {
    return <main className="library-state" aria-live="polite">正在載入書庫…</main>
  }

  if (library.error) {
    return (
      <main className="library-state error-state">
        <h1>書庫載入失敗</h1>
        <p>{library.error.message}</p>
        <button type="button" onClick={() => library.loadData().catch(() => {})}>重新載入</button>
      </main>
    )
  }

  const isLibraryEmpty =
    library.mangaList.length === 0 &&
    library.bookList.length === 0 &&
    library.categories.length === 0 &&
    library.readingStatuses.length === 0

  let page
  if (activeView === 'books') {
    page = (
      <BooksPage
        searchQuery={searchQuery}
        bookList={library.bookList}
        categories={library.categories}
        readingStatuses={library.readingStatuses}
        onAddBook={library.createBook}
        onUpdateBook={library.editBook}
        onDeleteBook={library.removeBook}
        onDeleteBooks={library.removeBooks}
        onReorderBooks={library.reorderBookList}
        onImportNotionBooks={library.importNotionBooks}
        relatedWorks={relatedWorks}
        onNavigateRelated={handleRelatedNavigation}
      />
    )
  } else if (activeView === 'cats') {
    page = (
      <CategoriesPage
        categories={library.categories}
        onAddCategory={library.createCategory}
        onDeleteCategory={library.removeCategory}
        onDeleteCategories={library.removeCategories}
        onReorderCategories={library.reorderCategoryList}
        onNavigateCategory={handleCategoryNavigation}
      />
    )
  } else if (activeView === 'settings') {
    page = (
      <SettingsPage
        readingStatuses={library.readingStatuses}
        onAddStatus={library.createStatus}
        onUpdateStatus={library.editStatus}
        onRemoveStatus={library.removeStatus}
      />
    )
  } else {
    page = (
      <MangaPage
        searchQuery={searchQuery}
        mangaList={library.mangaList}
        categories={library.categories}
        readingStatuses={library.readingStatuses}
        onAddManga={library.createManga}
        onUpdateManga={library.editManga}
        onDeleteManga={library.removeManga}
        onDeleteMangas={library.removeMangas}
        onReorderMangas={library.reorderMangaList}
        relatedWorks={relatedWorks}
        onNavigateRelated={handleRelatedNavigation}
      />
    )
  }

  return (
    <>
      <Header
        activeView={activeView}
        onViewChange={handleViewChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        user={user}
        onLogout={logout}
      />
      {import.meta.env.DEV && isLibraryEmpty && (
        <aside className="seed-banner">
          <span>Firestore 目前是空的，可將專案預設資料寫入一次。</span>
          <button type="button" disabled={isSeeding} onClick={handleSeed}>
            {isSeeding ? '初始化中…' : '初始化資料庫'}
          </button>
        </aside>
      )}
      {page}
      <Footer />
      <BottomTabBar activeView={activeView} onViewChange={handleViewChange} />
    </>
  )
}

export default App
