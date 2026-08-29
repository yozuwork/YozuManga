import { createCollectionService } from './firestoreService.js'

const bookService = createCollectionService('books')

export const getBooks = bookService.getAll
export const addBook = bookService.add
export const addBooks = bookService.addMany
export const updateBook = bookService.update
export const deleteBook = bookService.remove
export const deleteBooks = bookService.removeMany
export const reorderBooks = bookService.reorder
