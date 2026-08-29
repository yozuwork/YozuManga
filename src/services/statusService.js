import { createCollectionService } from './firestoreService.js'

const statusService = createCollectionService('readingStatuses')

export const getStatuses = statusService.getAll
export const addStatus = statusService.add
export const updateStatus = statusService.update
export const deleteStatus = statusService.remove
