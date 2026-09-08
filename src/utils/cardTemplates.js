const STORAGE_KEY = 'yozu-library-card-templates'

export const DEFAULT_CARD_TEMPLATES = {
  manga: { statuses: ['追漫中'], serializationStatus: '連載中' },
  book: { statuses: [] },
  cart: { format: 'physical', statuses: ['有興趣'] },
}

export function getCardTemplates() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
    return {
      manga: { ...DEFAULT_CARD_TEMPLATES.manga, ...saved.manga },
      book: { ...DEFAULT_CARD_TEMPLATES.book, ...saved.book },
      cart: { ...DEFAULT_CARD_TEMPLATES.cart, ...saved.cart },
    }
  } catch {
    return DEFAULT_CARD_TEMPLATES
  }
}

export function saveCardTemplate(type, template) {
  const templates = getCardTemplates()
  const nextTemplates = { ...templates, [type]: template }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTemplates))
  return nextTemplates
}

export function replaceTemplateStatus(type, oldName, newName) {
  const templates = getCardTemplates()
  const current = templates[type]
  if (!current?.statuses?.includes(oldName)) return
  saveCardTemplate(type, {
    ...current,
    statuses: current.statuses.map((name) => (name === oldName ? newName : name)),
  })
}

export function removeTemplateStatus(type, name) {
  const templates = getCardTemplates()
  const current = templates[type]
  if (!current?.statuses?.includes(name)) return
  saveCardTemplate(type, {
    ...current,
    statuses: current.statuses.filter((statusName) => statusName !== name),
  })
}
