import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Item } from '../types'

const DB_NAME = 'revoir'
const DB_VERSION = 1
const STORE = 'items'

interface RevoirDB extends DBSchema {
  // Le volume de données reste petit (quelques dizaines d'éléments) : on lit
  // tout en mémoire et on filtre en JS, aucun index n'est nécessaire.
  items: {
    key: string
    value: Item
  }
}

let dbPromise: Promise<IDBPDatabase<RevoirDB>> | null = null

function getDB(): Promise<IDBPDatabase<RevoirDB>> {
  dbPromise ??= openDB<RevoirDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    },
  })
  return dbPromise
}

export async function getAllItems(): Promise<Item[]> {
  const db = await getDB()
  return db.getAll(STORE)
}

export async function putItem(item: Item): Promise<void> {
  const db = await getDB()
  await db.put(STORE, item)
}

export async function deleteItem(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE, id)
}

/** Remplace intégralement le contenu de la base (utilisé par l'import). */
export async function replaceAllItems(items: Item[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORE, 'readwrite')
  await tx.store.clear()
  await Promise.all(items.map((item) => tx.store.put(item)))
  await tx.done
}

export async function clearItems(): Promise<void> {
  const db = await getDB()
  await db.clear(STORE)
}
