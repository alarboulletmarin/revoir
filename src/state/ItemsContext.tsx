import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Item, ScheduleId } from '../types'
import {
  deleteItem,
  getAllItems,
  putItem,
  replaceAllItems,
} from '../db/database'
import { buildReviews, rebuildReviews } from '../lib/schedules'
import type { DateKey } from '../lib/dates'

export interface ItemDraft {
  title: string
  category: string
  startDate: DateKey
  schedule: ScheduleId
}

export interface ItemsContextValue {
  items: Item[]
  loading: boolean
  /** Message d'erreur si IndexedDB est indisponible (navigation privée, quota). */
  error: string | null
  createItem: (draft: ItemDraft) => Promise<Item>
  editItem: (id: string, draft: ItemDraft) => Promise<void>
  removeItem: (id: string) => Promise<void>
  setArchived: (id: string, archived: boolean) => Promise<void>
  setReviewDone: (id: string, offset: number, done: boolean) => Promise<void>
  importItems: (items: Item[]) => Promise<void>
}

export const ItemsContext = createContext<ItemsContextValue | null>(null)

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function ItemsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getAllItems()
      .then((stored) => {
        if (!cancelled) setItems(stored)
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Impossible d’accéder au stockage local. Les données ne seront pas conservées.",
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  /**
   * L'état en mémoire est la source d'affichage : on l'applique tout de suite
   * puis on persiste. Si l'écriture échoue, on le signale sans perdre la
   * saisie en cours.
   */
  const persist = useCallback(async (item: Item) => {
    setItems((current) => {
      const index = current.findIndex((candidate) => candidate.id === item.id)
      if (index === -1) return [...current, item]
      const next = [...current]
      next[index] = item
      return next
    })
    try {
      await putItem(item)
      setError(null)
    } catch {
      setError("L’enregistrement local a échoué.")
    }
  }, [])

  const createItem = useCallback(
    async (draft: ItemDraft) => {
      const now = new Date().toISOString()
      const item: Item = {
        id: newId(),
        title: draft.title.trim(),
        category: draft.category.trim(),
        startDate: draft.startDate,
        schedule: draft.schedule,
        reviews: buildReviews(draft.startDate, draft.schedule),
        archived: false,
        createdAt: now,
        updatedAt: now,
      }
      await persist(item)
      return item
    },
    [persist],
  )

  const editItem = useCallback(
    async (id: string, draft: ItemDraft) => {
      const existing = items.find((item) => item.id === id)
      if (!existing) return
      await persist({
        ...existing,
        title: draft.title.trim(),
        category: draft.category.trim(),
        startDate: draft.startDate,
        schedule: draft.schedule,
        reviews: rebuildReviews(draft.startDate, draft.schedule, existing.reviews),
        updatedAt: new Date().toISOString(),
      })
    },
    [items, persist],
  )

  const removeItem = useCallback(async (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
    try {
      await deleteItem(id)
      setError(null)
    } catch {
      setError('La suppression locale a échoué.')
    }
  }, [])

  const setArchived = useCallback(
    async (id: string, archived: boolean) => {
      const existing = items.find((item) => item.id === id)
      if (!existing) return
      await persist({ ...existing, archived, updatedAt: new Date().toISOString() })
    },
    [items, persist],
  )

  const setReviewDone = useCallback(
    async (id: string, offset: number, done: boolean) => {
      const existing = items.find((item) => item.id === id)
      if (!existing) return
      await persist({
        ...existing,
        reviews: existing.reviews.map((review) =>
          review.offset === offset
            ? { ...review, done, doneAt: done ? new Date().toISOString() : null }
            : review,
        ),
        updatedAt: new Date().toISOString(),
      })
    },
    [items, persist],
  )

  const importItems = useCallback(async (imported: Item[]) => {
    setItems(imported)
    try {
      await replaceAllItems(imported)
      setError(null)
    } catch {
      setError("L'import n’a pas pu être enregistré localement.")
    }
  }, [])

  const value = useMemo<ItemsContextValue>(
    () => ({
      items,
      loading,
      error,
      createItem,
      editItem,
      removeItem,
      setArchived,
      setReviewDone,
      importItems,
    }),
    [
      items,
      loading,
      error,
      createItem,
      editItem,
      removeItem,
      setArchived,
      setReviewDone,
      importItems,
    ],
  )

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>
}
