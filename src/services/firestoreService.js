import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase.js'

function cleanData(data) {
  const { id, createdAt, updatedAt, ...values } = data
  return values
}

export function createCollectionService(collectionName) {
  const collectionRef = collection(db, collectionName)

  async function getAll() {
    const snapshot = await getDocs(collectionRef)
    return snapshot.docs
      .map((document, originalIndex) => ({
        id: document.id,
        ...document.data(),
        _originalIndex: originalIndex,
      }))
      .sort((a, b) => {
        const orderA = Number.isFinite(a.sortOrder) ? a.sortOrder : Number.MAX_SAFE_INTEGER
        const orderB = Number.isFinite(b.sortOrder) ? b.sortOrder : Number.MAX_SAFE_INTEGER
        return orderA - orderB || a._originalIndex - b._originalIndex
      })
      .map(({ _originalIndex, ...item }) => item)
  }

  async function add(data) {
    const values = cleanData(data)
    const documentRef = await addDoc(collectionRef, {
      ...values,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { id: documentRef.id, ...values }
  }

  async function addMany(items) {
    const createdItems = []

    for (let offset = 0; offset < items.length; offset += 450) {
      const batch = writeBatch(db)
      items.slice(offset, offset + 450).forEach((item) => {
        const values = cleanData(item)
        const documentRef = doc(collectionRef)
        batch.set(documentRef, {
          ...values,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        createdItems.push({ id: documentRef.id, ...values })
      })
      await batch.commit()
    }

    return createdItems
  }

  async function update(id, data) {
    const values = cleanData(data)
    await updateDoc(doc(db, collectionName, id), {
      ...values,
      updatedAt: serverTimestamp(),
    })
    return { id, ...values }
  }

  async function remove(id) {
    await deleteDoc(doc(db, collectionName, id))
  }

  async function removeMany(ids) {
    for (let offset = 0; offset < ids.length; offset += 450) {
      const batch = writeBatch(db)
      ids.slice(offset, offset + 450).forEach((id) => {
        batch.delete(doc(db, collectionName, id))
      })
      await batch.commit()
    }
  }

  async function reorder(ids) {
    for (let offset = 0; offset < ids.length; offset += 450) {
      const batch = writeBatch(db)
      ids.slice(offset, offset + 450).forEach((id, index) => {
        batch.update(doc(db, collectionName, id), {
          sortOrder: offset + index,
          updatedAt: serverTimestamp(),
        })
      })
      await batch.commit()
    }
  }

  return { getAll, add, addMany, update, remove, removeMany, reorder }
}
