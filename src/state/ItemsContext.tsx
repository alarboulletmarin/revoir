import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Item, ScheduleId } from '../types'
import { deleteItem, getAllItems, putItem, replaceAllItems } from '../db/database'
import { buildReviews, rebuildReviews } from '../lib/schedules'
import { devaliderRevision, validerRevision } from '../lib/recalage'
import { todayKey, type DateKey } from '../lib/dates'

export interface ItemDraft {
  title: string
  category: string
  startDate: DateKey
  schedule: ScheduleId
}

/** Ce qu'une validation renvoie à l'appelant pour construire son toast. */
export interface ValidationEffectuee {
  /** L'élément tel qu'il était avant la validation — la cible d'« Annuler ». */
  precedent: Item
  /** Jours de retard absorbés. 0 si la validation n'était pas en retard. */
  retard: number
  /** Échéances à venir déplacées par le recalage. */
  deplacees: number
}

export interface ItemsContextValue {
  items: Item[]
  loading: boolean
  /** Message d'erreur si IndexedDB est indisponible (navigation privée, quota). */
  error: string | null
  createItem: (draft: ItemDraft) => Promise<Item>
  editItem: (id: string, draft: ItemDraft) => Promise<void>
  removeItem: (id: string) => Promise<void>
  setArchived: (id: string, archived: boolean) => void
  /** Validation optimiste : l'état change tout de suite, l'écriture suit. */
  valider: (id: string, offset: number) => ValidationEffectuee | null
  devalider: (id: string, offset: number) => void
  /** Remet un élément dans l'état exact fourni. Sert au bouton « Annuler ». */
  restaurer: (item: Item) => void
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
            "Impossible d'accéder au stockage local. Les données ne seront pas conservées.",
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
      setError("L'enregistrement local a échoué.")
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
    (id: string, archived: boolean) => {
      const existing = items.find((item) => item.id === id)
      if (!existing) return
      void persist({ ...existing, archived, updatedAt: new Date().toISOString() })
    },
    [items, persist],
  )

  /**
   * Règle métier n°2 : aucune confirmation, mise à jour immédiate, et de quoi
   * revenir en arrière. On renvoie l'élément d'avant plutôt qu'un identifiant
   * d'opération — c'est la seule façon d'annuler exactement un recalage, qui
   * a pu déplacer plusieurs échéances d'un coup.
   */
  const valider = useCallback(
    (id: string, offset: number): ValidationEffectuee | null => {
      const precedent = items.find((item) => item.id === id)
      if (!precedent) return null

      const resultat = validerRevision(precedent, offset, todayKey())
      void persist(resultat.item)
      return { precedent, retard: resultat.retard, deplacees: resultat.deplacees }
    },
    [items, persist],
  )

  const devalider = useCallback(
    (id: string, offset: number) => {
      const existing = items.find((item) => item.id === id)
      if (!existing) return
      void persist(devaliderRevision(existing, offset))
    },
    [items, persist],
  )

  const restaurer = useCallback(
    (item: Item) => {
      void persist(item)
    },
    [persist],
  )

  const importItems = useCallback(async (imported: Item[]) => {
    setItems(imported)
    try {
      await replaceAllItems(imported)
      setError(null)
    } catch {
      setError("L'import n'a pas pu être enregistré localement.")
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
      valider,
      devalider,
      restaurer,
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
      valider,
      devalider,
      restaurer,
      importItems,
    ],
  )

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>
}
