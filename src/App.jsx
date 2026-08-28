import { useEffect, useRef, useState } from 'react'
import Toast from './components/common/Toast.jsx'
import BottomTabBar from './components/layout/BottomTabBar.jsx'
import Footer from './components/layout/Footer.jsx'
import Header from './components/layout/Header.jsx'
import {
  initialBookList,
  initialCategories,
  initialMangaList,
  initialReadingStatuses,
} from './data/initialData.js'
import BooksPage from './pages/BooksPage.jsx'
import CategoriesPage from './pages/CategoriesPage.jsx'
import MangaPage from './pages/MangaPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

function App() {
  const [activeView, setActiveView] = useState('manga')
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState(initialCategories)
  const [readingStatuses, setReadingStatuses] = useState(initialReadingStatuses)
  const [mangaList, setMangaList] = useState(initialMangaList)
  const [bookList, setBookList] = useState(initialBookList)
  const [toastMessage, setToastMessage] = useState('')
  const toastTimerRef = useRef(null)

  useEffect(() => () => clearTimeout(toastTimerRef.current), [])

  function showToast(message) {
    setToastMessage(message)
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastMessage(''), 2200)
  }

  function handleViewChange(view) {
    setActiveView(view)
    window.scrollTo({ top: 0 })
  }

  function handleCategoryNavigation(category) {
    handleViewChange(category.types.includes('manga') ? 'manga' : 'books')
    setSearchQuery(category.name)
  }

  function removeReadingStatus(name) {
    if (readingStatuses.length <= 1) return

    const remainingStatuses = readingStatuses.filter((status) => status.name !== name)
    const mangaFallback =
      remainingStatuses.find((status) => status.types.includes('manga')) ?? remainingStatuses[0]
    const bookFallback =
      remainingStatuses.find((status) => status.types.includes('book')) ?? remainingStatuses[0]

    setReadingStatuses(remainingStatuses)
    setMangaList((currentList) =>
      currentList.map((manga) =>
        manga.status === name ? { ...manga, status: mangaFallback.name } : manga,
      ),
    )
    setBookList((currentList) =>
      currentList.map((book) =>
        book.status === name ? { ...book, status: bookFallback.name } : book,
      ),
    )
  }

  let page
  if (activeView === 'books') {
    page = (
      <BooksPage
        searchQuery={searchQuery}
        bookList={bookList}
        setBookList={setBookList}
        categories={categories}
        readingStatuses={readingStatuses}
        showToast={showToast}
      />
    )
  } else if (activeView === 'cats') {
    page = (
      <CategoriesPage
        categories={categories}
        setCategories={setCategories}
        onNavigateCategory={handleCategoryNavigation}
        showToast={showToast}
      />
    )
  } else if (activeView === 'settings') {
    page = (
      <SettingsPage
        readingStatuses={readingStatuses}
        setReadingStatuses={setReadingStatuses}
        onRemoveStatus={removeReadingStatus}
      />
    )
  } else {
    page = (
      <MangaPage
        searchQuery={searchQuery}
        mangaList={mangaList}
        setMangaList={setMangaList}
        categories={categories}
        readingStatuses={readingStatuses}
        showToast={showToast}
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
      />
      {page}
      <Footer />
      <BottomTabBar activeView={activeView} onViewChange={handleViewChange} />
      <Toast message={toastMessage} />
    </>
  )
}

export default App
