import { useCallback, useEffect, useRef, useState } from 'react'
import {
  addBook,
  addBooks,
  deleteBook,
  deleteBooks as deleteBooksFromFirestore,
  getBooks,
  reorderBooks as reorderBooksInFirestore,
  updateBook,
} from '../services/bookService.js'
import { notionBookImportCandidates } from '../data/notionBookImport.js'
import {
  addCategory,
  deleteCategory,
  deleteCategories as deleteCategoriesFromFirestore,
  getCategories,
  reorderCategories as reorderCategoriesInFirestore,
  updateCategory,
} from '../services/categoryService.js'
import {
  addManga,
  deleteManga,
  deleteMangas as deleteMangasFromFirestore,
  getMangas,
  reorderMangas as reorderMangasInFirestore,
  updateManga,
} from '../services/mangaService.js'
import { addStatus, deleteStatus, getStatuses, updateStatus } from '../services/statusService.js'

function replaceById(list, id, data) {
  return list.map((item) => (item.id === id ? { ...item, ...data, id } : item))
}

function normalizeTitleKey(value) {
  return value.trim().replace(/\s+/g, ' ').normalize('NFKC').toLocaleLowerCase('zh-TW')
}

export default function useLibraryData() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mangaList, setMangaList] = useState([])
  const [bookList, setBookList] = useState([])
  const [categories, setCategories] = useState([])
  const [readingStatuses, setReadingStatuses] = useState([])
  const inFlightRef = useRef(null)

  const loadData = useCallback(async () => {
    if (inFlightRef.current) return inFlightRef.current

    setLoading(true)
    setError(null)
    const request = Promise.all([getMangas(), getBooks(), getCategories(), getStatuses()])
      .then(([mangas, books, categoryList, statuses]) => {
        setMangaList(mangas)
        setBookList(books)
        setCategories(categoryList)
        setReadingStatuses(statuses)
      })
      .catch((loadError) => {
        setError(loadError)
        throw loadError
      })
      .finally(() => {
        setLoading(false)
        inFlightRef.current = null
      })

    inFlightRef.current = request
    return request
  }, [])

  useEffect(() => {
    loadData().catch(() => {})
  }, [loadData])

  const createManga = useCallback(async (data) => {
    const created = await addManga({ ...data, sortOrder: -Date.now() })
    setMangaList((list) => [created, ...list])
    return created
  }, [])

  const editManga = useCallback(async (id, data) => {
    await updateManga(id, data)
    setMangaList((list) => replaceById(list, id, data))
  }, [])

  const removeManga = useCallback(async (id) => {
    await deleteManga(id)
    setMangaList((list) => list.filter((item) => item.id !== id))
  }, [])

  const removeMangas = useCallback(async (ids) => {
    await deleteMangasFromFirestore(ids)
    const idSet = new Set(ids)
    setMangaList((list) => list.filter((item) => !idSet.has(item.id)))
  }, [])

  const reorderMangaList = useCallback(async (items) => {
    const previous = mangaList
    const orderedItems = items.map((item, index) => ({ ...item, sortOrder: index }))
    setMangaList(orderedItems)
    try {
      await reorderMangasInFirestore(orderedItems.map((item) => item.id))
    } catch (error) {
      setMangaList(previous)
      throw error
    }
  }, [mangaList])

  const createBook = useCallback(async (data) => {
    const created = await addBook({ ...data, sortOrder: -Date.now() })
    setBookList((list) => [created, ...list])
    return created
  }, [])

  const importNotionBooks = useCallback(async () => {
    const existingTitles = new Set(bookList.map((book) => normalizeTitleKey(book.title ?? '')))
    const pendingBooks = notionBookImportCandidates.filter(
      (book) => !existingTitles.has(normalizeTitleKey(book.title)),
    )
    const bookStatuses = readingStatuses.filter((status) => status.types?.includes('book'))
    const ongoingStatus = bookStatuses.find((status) => status.name === '連載中') ?? bookStatuses[0]
    const completedStatus = bookStatuses.find((status) => status.name === '已完結') ?? ongoingStatus
    const lastSortOrder = bookList.reduce(
      (largest, book) => (Number.isFinite(book.sortOrder) ? Math.max(largest, book.sortOrder) : largest),
      -1,
    )

    const booksToAdd = pendingBooks.map(({ isCompleted: completed, ...book }, index) => ({
      ...book,
      status: (completed ? completedStatus : ongoingStatus)?.name ?? '',
      sortOrder: lastSortOrder + index + 1,
    }))
    const createdBooks = await addBooks(booksToAdd)
    setBookList((list) => [...list, ...createdBooks])

    return {
      added: createdBooks.length,
      skipped: notionBookImportCandidates.length - createdBooks.length,
      total: notionBookImportCandidates.length,
    }
  }, [bookList, readingStatuses])

  const editBook = useCallback(async (id, data) => {
    await updateBook(id, data)
    setBookList((list) => replaceById(list, id, data))
  }, [])

  const removeBook = useCallback(async (id) => {
    await deleteBook(id)
    setBookList((list) => list.filter((item) => item.id !== id))
  }, [])

  const removeBooks = useCallback(async (ids) => {
    await deleteBooksFromFirestore(ids)
    const idSet = new Set(ids)
    setBookList((list) => list.filter((item) => !idSet.has(item.id)))
  }, [])

  const reorderBookList = useCallback(async (items) => {
    const previous = bookList
    const orderedItems = items.map((item, index) => ({ ...item, sortOrder: index }))
    setBookList(orderedItems)
    try {
      await reorderBooksInFirestore(orderedItems.map((item) => item.id))
    } catch (error) {
      setBookList(previous)
      throw error
    }
  }, [bookList])

  const createCategory = useCallback(async (data) => {
    const created = await addCategory({ ...data, sortOrder: Date.now() })
    setCategories((list) => [...list, created])
    return created
  }, [])

  const editCategory = useCallback(async (id, data) => {
    await updateCategory(id, data)
    setCategories((list) => replaceById(list, id, data))
  }, [])

  const removeCategory = useCallback(async (id) => {
    await deleteCategory(id)
    setCategories((list) => list.filter((item) => item.id !== id))
  }, [])

  const removeCategories = useCallback(async (ids) => {
    await deleteCategoriesFromFirestore(ids)
    const idSet = new Set(ids)
    setCategories((list) => list.filter((item) => !idSet.has(item.id)))
  }, [])

  const reorderCategoryList = useCallback(async (items) => {
    const previous = categories
    const orderedItems = items.map((item, index) => ({ ...item, sortOrder: index }))
    setCategories(orderedItems)
    try {
      await reorderCategoriesInFirestore(orderedItems.map((item) => item.id))
    } catch (error) {
      setCategories(previous)
      throw error
    }
  }, [categories])

  const createStatus = useCallback(async (data) => {
    const created = await addStatus(data)
    setReadingStatuses((list) => [...list, created])
    return created
  }, [])

  const editStatus = useCallback(async (id, data) => {
    await updateStatus(id, data)
    setReadingStatuses((list) => replaceById(list, id, data))
  }, [])

  const removeStatus = useCallback(async (id) => {
    const status = readingStatuses.find((item) => item.id === id)
    if (!status || readingStatuses.length <= 1) return false

    const remaining = readingStatuses.filter((item) => item.id !== id)
    const mangaFallback = remaining.find((item) => item.types.includes('manga')) ?? remaining[0]
    const bookFallback = remaining.find((item) => item.types.includes('book')) ?? remaining[0]
    const affectedMangas = mangaList.filter((item) => item.status === status.name)
    const affectedBooks = bookList.filter((item) => item.status === status.name)

    await Promise.all([
      ...affectedMangas.map((item) => updateManga(item.id, { status: mangaFallback.name })),
      ...affectedBooks.map((item) => updateBook(item.id, { status: bookFallback.name })),
    ])
    await deleteStatus(id)

    setReadingStatuses(remaining)
    setMangaList((list) =>
      list.map((item) =>
        item.status === status.name ? { ...item, status: mangaFallback.name } : item,
      ),
    )
    setBookList((list) =>
      list.map((item) =>
        item.status === status.name ? { ...item, status: bookFallback.name } : item,
      ),
    )
    return true
  }, [bookList, mangaList, readingStatuses])

  return {
    loading,
    error,
    mangaList,
    bookList,
    categories,
    readingStatuses,
    loadData,
    createManga,
    editManga,
    removeManga,
    removeMangas,
    reorderMangaList,
    createBook,
    importNotionBooks,
    editBook,
    removeBook,
    removeBooks,
    reorderBookList,
    createCategory,
    editCategory,
    removeCategory,
    removeCategories,
    reorderCategoryList,
    createStatus,
    editStatus,
    removeStatus,
  }
}
