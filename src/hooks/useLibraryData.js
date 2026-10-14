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
import { findBookCoverPreset } from '../data/bookCoverPresets.js'
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
import {
  addCartItem,
  deleteCartItem,
  getCartItems,
  reorderCartItems,
  updateCartItem,
} from '../services/cartService.js'
import {
  addExternalLink,
  deleteExternalLink,
  getExternalLinks,
  reorderExternalLinks,
  updateExternalLink,
} from '../services/externalLinkService.js'

function replaceById(list, id, data) {
  return list.map((item) => (item.id === id ? { ...item, ...data, id } : item))
}

function normalizeTitleKey(value) {
  return value.trim().replace(/\s+/g, ' ').normalize('NFKC').toLocaleLowerCase('zh-TW')
}

const legacyCartStatuses = {
  high: '準備購買',
  medium: '有興趣',
  low: '先收藏',
}

function getItemStatuses(item, type) {
  if (item.statuses?.length) return item.statuses
  if (item.status) return [item.status]
  if (type === 'cart') return [legacyCartStatuses[item.priority] ?? '有興趣']
  return []
}

function replaceItemStatus(item, type, oldName, newName) {
  const statuses = getItemStatuses(item, type)
    .map((name) => (name === oldName ? newName : name))
    .filter(Boolean)
  return {
    status: statuses[0] ?? '',
    statuses,
    ...(type === 'link' ? { tags: statuses } : {}),
  }
}

function removeItemStatus(item, type, oldName, fallbackName) {
  const statuses = getItemStatuses(item, type).filter((name) => name !== oldName)
  if (!statuses.length && fallbackName) statuses.push(fallbackName)
  return {
    status: statuses[0] ?? '',
    statuses,
    ...(type === 'link' ? { tags: statuses } : {}),
  }
}

export default function useLibraryData() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mangaList, setMangaList] = useState([])
  const [bookList, setBookList] = useState([])
  const [categories, setCategories] = useState([])
  const [readingStatuses, setReadingStatuses] = useState([])
  const [cartItems, setCartItems] = useState([])
  const [cartError, setCartError] = useState(null)
  const [externalLinks, setExternalLinks] = useState([])
  const [externalLinksError, setExternalLinksError] = useState(null)
  const inFlightRef = useRef(null)

  const loadData = useCallback(async () => {
    if (inFlightRef.current) return inFlightRef.current

    setLoading(true)
    setError(null)
    setCartError(null)
    setExternalLinksError(null)
    const cartRequest = getCartItems().catch((loadError) => {
      setCartError(loadError)
      return []
    })
    const externalLinksRequest = getExternalLinks().catch((loadError) => {
      setExternalLinksError(loadError)
      return []
    })
    const request = Promise.all([
      getMangas(),
      getBooks(),
      getCategories(),
      getStatuses(),
      cartRequest,
      externalLinksRequest,
    ])
      .then(([mangas, books, categoryList, statuses, shoppingCart, links]) => {
        const defaultMangaStatus = statuses.find((status) => status.isDefault && status.types?.includes('manga'))
          ?? statuses.find((status) => status.name === '追漫中' && status.types?.includes('manga'))

        setMangaList(mangas)
        setBookList(books)
        setCategories(categoryList)
        setReadingStatuses(statuses)
        setCartItems(shoppingCart)
        setExternalLinks(links)

        // Migrate libraries seeded before `isDefault` was introduced. This only
        // touches the existing, already-authorized readingStatuses collection.
        if (defaultMangaStatus && !defaultMangaStatus.isDefault) {
          updateStatus(defaultMangaStatus.id, { isDefault: true })
            .catch(() => {})
          setReadingStatuses((current) => current.map((status) => (
            status.id === defaultMangaStatus.id ? { ...status, isDefault: true } : status
          )))
        }

        // Fill in known covers for books that were saved without one.
        const coverUpdates = books
          .filter((book) => !book.coverUrl && findBookCoverPreset(book.title))
          .map((book) => ({ id: book.id, coverUrl: findBookCoverPreset(book.title) }))
        if (coverUpdates.length) {
          coverUpdates.forEach(({ id, coverUrl }) => {
            updateBook(id, { coverUrl }).catch(() => {})
          })
          setBookList((current) => current.map((book) => {
            const update = coverUpdates.find((item) => item.id === book.id)
            return update ? { ...book, coverUrl: update.coverUrl } : book
          }))
        }

        if (import.meta.env.DEV) {
          const missingCoverTitles = books
            .filter((book) => !book.coverUrl && !findBookCoverPreset(book.title))
            .map((book) => book.title)
          console.info(
            `[covers] ${books.length} books, ${missingCoverTitles.length} still missing a cover:\n${missingCoverTitles.join('\n')}`,
          )
        }
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

  const createCartItem = useCallback(async (data) => {
    const created = await addCartItem({ ...data, sortOrder: -Date.now() })
    setCartItems((list) => [created, ...list])
    return created
  }, [])

  const editCartItem = useCallback(async (id, data) => {
    await updateCartItem(id, data)
    setCartItems((list) => replaceById(list, id, data))
  }, [])

  const removeCartItem = useCallback(async (id) => {
    await deleteCartItem(id)
    setCartItems((list) => list.filter((item) => item.id !== id))
  }, [])

  const reorderCartList = useCallback(async (items) => {
    const previous = cartItems
    const orderedItems = items.map((item, index) => ({ ...item, sortOrder: index }))
    setCartItems(orderedItems)
    try {
      await reorderCartItems(orderedItems.map((item) => item.id))
    } catch (error) {
      setCartItems(previous)
      throw error
    }
  }, [cartItems])

  const createExternalLink = useCallback(async (data) => {
    const created = await addExternalLink({ ...data, sortOrder: -Date.now() })
    setExternalLinks((list) => [created, ...list])
    return created
  }, [])

  const editExternalLink = useCallback(async (id, data) => {
    await updateExternalLink(id, data)
    setExternalLinks((list) => replaceById(list, id, data))
  }, [])

  const removeExternalLink = useCallback(async (id) => {
    await deleteExternalLink(id)
    setExternalLinks((list) => list.filter((item) => item.id !== id))
  }, [])

  const reorderExternalLinkList = useCallback(async (items) => {
    const previous = externalLinks
    const orderedItems = items.map((item, index) => ({ ...item, sortOrder: index }))
    setExternalLinks(orderedItems)
    try {
      await reorderExternalLinks(orderedItems.map((item) => item.id))
    } catch (error) {
      setExternalLinks(previous)
      throw error
    }
  }, [externalLinks])

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

  const editStatus = useCallback(async (id, data, scopeType) => {
    const status = readingStatuses.find((item) => item.id === id)
    if (!status) return false
    const nextName = data.name?.trim() || status.name
    const nextData = { ...data, name: nextName }
    const statusTypes = status.types ?? []

    if (scopeType && statusTypes.length > 1) {
      const created = await addStatus({ ...status, ...nextData, types: [scopeType] })
      await updateStatus(id, { types: statusTypes.filter((type) => type !== scopeType) })
      setReadingStatuses((list) => [
        ...list.map((item) => item.id === id
          ? { ...item, types: item.types.filter((type) => type !== scopeType) }
          : item),
        created,
      ])
    } else {
      await updateStatus(id, nextData)
      setReadingStatuses((list) => replaceById(list, id, nextData))
    }

    if (nextName === status.name) return true
    const targetTypes = scopeType ? [scopeType] : statusTypes
    const typeConfigs = {
      manga: [mangaList, updateManga, setMangaList],
      book: [bookList, updateBook, setBookList],
      cart: [cartItems, updateCartItem, setCartItems],
      link: [externalLinks, updateExternalLink, setExternalLinks],
    }

    await Promise.all(targetTypes.flatMap((type) => {
      const [items, updater] = typeConfigs[type] ?? [[], null]
      if (!updater) return []
      return items
        .filter((item) => getItemStatuses(item, type).includes(status.name))
        .map((item) => updater(item.id, replaceItemStatus(item, type, status.name, nextName)))
    }))
    targetTypes.forEach((type) => {
      const [, , setter] = typeConfigs[type] ?? []
      setter?.((items) => items.map((item) =>
        getItemStatuses(item, type).includes(status.name)
          ? { ...item, ...replaceItemStatus(item, type, status.name, nextName) }
          : item))
    })
    return true
  }, [bookList, cartItems, externalLinks, mangaList, readingStatuses])

  const removeStatus = useCallback(async (id, scopeType) => {
    const status = readingStatuses.find((item) => item.id === id)
    if (!status) return false
    const targetType = scopeType ?? status.types?.[0]
    const fallback = readingStatuses.find((item) =>
      item.id !== id && item.types?.includes(targetType))
    if (!fallback) return false

    const typeConfigs = {
      manga: [mangaList, updateManga, setMangaList],
      book: [bookList, updateBook, setBookList],
      cart: [cartItems, updateCartItem, setCartItems],
      link: [externalLinks, updateExternalLink, setExternalLinks],
    }
    const [items, updater, setter] = typeConfigs[targetType] ?? [[], null, null]
    const affectedItems = items.filter((item) =>
      getItemStatuses(item, targetType).includes(status.name))

    if (updater) {
      await Promise.all(affectedItems.map((item) => updater(
        item.id,
        removeItemStatus(item, targetType, status.name, fallback.name),
      )))
    }

    if ((status.types?.length ?? 0) > 1 && scopeType) {
      const nextTypes = status.types.filter((type) => type !== scopeType)
      await updateStatus(id, { types: nextTypes })
      setReadingStatuses((list) => list.map((item) =>
        item.id === id ? { ...item, types: nextTypes } : item))
    } else {
      await deleteStatus(id)
      setReadingStatuses((list) => list.filter((item) => item.id !== id))
    }

    setter?.((list) => list.map((item) =>
      getItemStatuses(item, targetType).includes(status.name)
        ? { ...item, ...removeItemStatus(item, targetType, status.name, fallback.name) }
        : item))
    return true
  }, [bookList, cartItems, externalLinks, mangaList, readingStatuses])

  return {
    loading,
    error,
    mangaList,
    bookList,
    categories,
    readingStatuses,
    cartItems,
    cartError,
    externalLinks,
    externalLinksError,
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
    createCartItem,
    editCartItem,
    removeCartItem,
    reorderCartList,
    createExternalLink,
    editExternalLink,
    removeExternalLink,
    reorderExternalLinkList,
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
