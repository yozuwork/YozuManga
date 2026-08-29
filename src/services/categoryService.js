import { createCollectionService } from './firestoreService.js'

const categoryService = createCollectionService('categories')

export const getCategories = categoryService.getAll
export const addCategory = categoryService.add
export const updateCategory = categoryService.update
export const deleteCategory = categoryService.remove
export const deleteCategories = categoryService.removeMany
export const reorderCategories = categoryService.reorder
