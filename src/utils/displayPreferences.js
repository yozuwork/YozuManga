export const CARD_SIZE_STORAGE_KEY = 'yozu-library-card-size'
export const DEFAULT_CARD_SIZE = 'small'
export const VALID_CARD_SIZES = new Set(['large', 'medium', 'small'])

export function getSavedCardSize() {
  try {
    const savedSize = window.localStorage.getItem(CARD_SIZE_STORAGE_KEY)
    return VALID_CARD_SIZES.has(savedSize) ? savedSize : DEFAULT_CARD_SIZE
  } catch {
    return DEFAULT_CARD_SIZE
  }
}

export function saveCardSize(size) {
  if (!VALID_CARD_SIZES.has(size)) return false
  try {
    window.localStorage.setItem(CARD_SIZE_STORAGE_KEY, size)
  } catch {
    // 無法使用 localStorage 時，仍保留目前頁面的選擇。
  }
  return true
}
