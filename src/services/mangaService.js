import { createCollectionService } from './firestoreService.js'

const mangaService = createCollectionService('mangas')

export const getMangas = mangaService.getAll
export const addManga = mangaService.add
export const updateManga = mangaService.update
export const deleteManga = mangaService.remove
export const deleteMangas = mangaService.removeMany
export const reorderMangas = mangaService.reorder
