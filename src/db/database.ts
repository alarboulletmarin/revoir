import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Item, Programme } from '../types'
import type { Teinte, Teintes } from '../lib/categories'

const DB_NAME = 'revoir'
const DB_VERSION = 3
const STORE = 'items'
const STORE_TEINTES = 'teintes'
const STORE_PROGRAMMES = 'programmes'

/** Une teinte choisie par l'utilisateur, indexée par clé de catégorie. */
export interface TeinteEnregistree {
  cle: string
  teinte: Teinte
}

interface RevoirDB extends DBSchema {
  // Le volume de données reste petit (quelques dizaines d'éléments) : on lit
  // tout en mémoire et on filtre en JS, aucun index n'est nécessaire.
  items: {
    key: string
    value: Item
  }
  teintes: {
    key: string
    value: TeinteEnregistree
  }
  programmes: {
    key: string
    value: Programme
  }
}

let dbPromise: Promise<IDBPDatabase<RevoirDB>> | null = null

function getDB(): Promise<IDBPDatabase<RevoirDB>> {
  dbPromise ??= openDB<RevoirDB>(DB_NAME, DB_VERSION, {
    // Les migrations sont cumulatives : une base en v1 doit pouvoir passer
    // en v2 sans perdre ses éléments.
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_TEINTES)) {
        db.createObjectStore(STORE_TEINTES, { keyPath: 'cle' })
      }
      if (!db.objectStoreNames.contains(STORE_PROGRAMMES)) {
        db.createObjectStore(STORE_PROGRAMMES, { keyPath: 'id' })
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

export async function getAllTeintes(): Promise<Teintes> {
  const db = await getDB()
  const stockees = await db.getAll(STORE_TEINTES)
  return Object.fromEntries(stockees.map(({ cle, teinte }) => [cle, teinte]))
}

export async function putTeinte(cle: string, teinte: Teinte): Promise<void> {
  const db = await getDB()
  await db.put(STORE_TEINTES, { cle, teinte })
}

export async function replaceAllTeintes(teintes: Teintes): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORE_TEINTES, 'readwrite')
  await tx.store.clear()
  await Promise.all(
    Object.entries(teintes).map(([cle, teinte]) => tx.store.put({ cle, teinte })),
  )
  await tx.done
}

export async function getAllProgrammes(): Promise<Programme[]> {
  const db = await getDB()
  const programmes = await db.getAll(STORE_PROGRAMMES)
  // L'ordre de création est celui de l'affichage : IndexedDB rend les clés
  // triées, qui ne veulent rien dire ici.
  return programmes.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function putProgramme(programme: Programme): Promise<void> {
  const db = await getDB()
  await db.put(STORE_PROGRAMMES, programme)
}

export async function deleteProgramme(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_PROGRAMMES, id)
}

export async function replaceAllProgrammes(programmes: Programme[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(STORE_PROGRAMMES, 'readwrite')
  await tx.store.clear()
  await Promise.all(programmes.map((programme) => tx.store.put(programme)))
  await tx.done
}
