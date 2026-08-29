import { collection, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'
import {
  initialBookList,
  initialCategories,
  initialMangaList,
  initialReadingStatuses,
} from '../data/initialData.js'
import { db } from '../lib/firebase.js'

const seedCollections = [
  ['mangas', initialMangaList],
  ['books', initialBookList],
  ['categories', initialCategories],
  ['readingStatuses', initialReadingStatuses],
]

function withoutLocalId(item) {
  const { id, ...data } = item
  return data
}

export async function seedInitialData() {
  const snapshots = await Promise.all(
    seedCollections.map(([name]) => getDocs(collection(db, name))),
  )

  if (snapshots.some((snapshot) => !snapshot.empty)) {
    throw new Error('資料庫不是完全空白，已取消初始化。')
  }

  const batch = writeBatch(db)
  seedCollections.forEach(([name, items]) => {
    items.forEach((item, index) => {
      const documentRef = doc(collection(db, name))
      batch.set(documentRef, {
        ...withoutLocalId(item),
        sortOrder: index,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })
  })

  await batch.commit()
}
