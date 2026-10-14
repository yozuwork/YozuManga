const MANGA_SORT_KEY = 'yozu-manga-sort'

export const MANGA_SORT_OPTIONS = [
  { value: 'lastRead', label: '最近看過' },
  { value: 'episodeUpdated', label: '最近更新' },
  { value: 'updated', label: '更新時間' },
  { value: 'custom', label: '自訂排序' },
]

const VALID_SORTS = new Set(MANGA_SORT_OPTIONS.map((option) => option.value))

export function getSavedMangaSort() {
  try {
    const saved = window.localStorage.getItem(MANGA_SORT_KEY)
    return VALID_SORTS.has(saved) ? saved : 'lastRead'
  } catch {
    return 'lastRead'
  }
}

export function saveMangaSort(value) {
  if (!VALID_SORTS.has(value)) return false
  try {
    window.localStorage.setItem(MANGA_SORT_KEY, value)
  } catch {
    // 無法使用 localStorage 時，仍保留本次頁面的選擇。
  }
  return true
}

// Firestore Timestamp、毫秒數或日期字串都轉成毫秒；沒有值時回傳 0。
export function toMillis(value) {
  if (!value) return 0
  if (typeof value === 'number') return value
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (value instanceof Date) return value.getTime()
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

const sortValueGetters = {
  lastRead: (manga) => toMillis(manga.lastReadAt),
  episodeUpdated: (manga) => toMillis(manga.episodeUpdatedAt) || toMillis(manga.createdAt),
  // 優先使用表單上的「更新時間」欄位，舊資料沒有時才用資料修改時間。
  updated: (manga) => toMillis(manga.updateTime) || toMillis(manga.updatedAt),
}

export function sortMangaList(list, sortBy) {
  const getValue = sortValueGetters[sortBy]
  if (!getValue) return list
  // Array.prototype.sort 是穩定排序，沒有時間的作品會維持自訂順序排在後面。
  return [...list].sort((a, b) => getValue(b) - getValue(a))
}
