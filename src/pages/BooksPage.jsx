import { useEffect, useState } from 'react'
import BookCard from '../components/books/BookCard.jsx'
import BookModal from '../components/books/BookModal.jsx'
import './MangaPage.css'
import './BooksPage.css'

function BooksPage({
  searchQuery,
  bookList,
  setBookList,
  categories,
  readingStatuses,
  showToast,
}) {
  const [activeBookStatus, setActiveBookStatus] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState(null)

  const applicableStatuses = readingStatuses.filter((status) => status.types.includes('book'))
  const bookStatuses = applicableStatuses.length ? applicableStatuses : readingStatuses
  const bookStatusKey = bookStatuses.map((status) => status.name).join('\u0000')

  useEffect(() => {
    const statusNames = bookStatusKey ? bookStatusKey.split('\u0000') : []
    if (activeBookStatus !== 'all' && !statusNames.includes(activeBookStatus)) {
      setActiveBookStatus('all')
    }
  }, [activeBookStatus, bookStatusKey])

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('zh-Hant')
  const visibleBooks = bookList.filter((book) => {
    const matchesStatus = activeBookStatus === 'all' || book.status === activeBookStatus
    const searchableText = [book.title, book.genre, book.author, book.publisher, book.shelf]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('zh-Hant')
    return matchesStatus && searchableText.includes(normalizedQuery)
  })
  const bookCategories = categories
    .filter((category) => category.types.includes('book'))
    .map((category) => category.name)

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

  function saveBook(formData) {
    if (editingBook) {
      setBookList((currentList) =>
        currentList.map((book) => book.id === editingBook.id ? { ...book, ...formData } : book),
      )
      showToast('✅ 已儲存變更')
    } else {
      setBookList((currentList) => [{ id: Date.now(), ...formData }, ...currentList])
      showToast('✅ 新增成功！已貼上書架')
    }
    closeModal()
  }

  return (
    <main className="books-page">
      <div className="filters" aria-label="實體書篩選">
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
        <button className="filter-pill add-pill" type="button" onClick={openAddModal}>＋ 新增書本</button>
      </div>

      <div className="board">
        {visibleBooks.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            statusClass={readingStatuses.find((status) => status.name === book.status)?.color ?? 'marker'}
            onEdit={openEditModal}
          />
        ))}
      </div>

      <button className="fab-add show" type="button" aria-label="新增書本" onClick={openAddModal}>＋</button>

      <BookModal
        isOpen={isModalOpen}
        book={editingBook}
        readingStatuses={bookStatuses}
        genreOptions={bookCategories}
        onClose={closeModal}
        onSave={saveBook}
      />
    </main>
  )
}

export default BooksPage
