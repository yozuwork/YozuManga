import { createCollectionService } from './firestoreService.js'

const externalLinkService = createCollectionService('externalLinks')

export const getExternalLinks = externalLinkService.getAll
export const addExternalLink = externalLinkService.add
export const updateExternalLink = externalLinkService.update
export const deleteExternalLink = externalLinkService.remove
export const reorderExternalLinks = externalLinkService.reorder
