import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Item, Programme, ScheduleId } from '../types'
import {
  deleteItem,
  deleteProgramme,
  getAllItems,
  getAllProgrammes,
  getAllTeintes,
  putItem,
  putProgramme,
  putTeinte,
  replaceAllItems,
  replaceAllProgrammes,
  replaceAllTeintes,
} from '../db/database'
import { cleCategorie, type Teinte, type Teintes } from '../lib/categories'
import {
  buildReviews,
  rebuildReviews,
  tousLesProgrammes,
  type Schedule,
} from '../lib/schedules'
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
  /** Choix explicites de teinte par matière. Le reste dérive du nom. */
  teintes: Teintes
  definirTeinte: (categorie: string, teinte: Teinte) => void
  /** Les rythmes créés par l'utilisateur, dans l'ordre de création. */
  programmes: Programme[]
  /** Les trois intégrés puis les créés : ce que proposent les formulaires. */
  programmesDisponibles: Schedule[]
  creerProgramme: (label: string, offsets: number[]) => Promise<Programme>
  /**
   * Le nom se change toujours ; le rythme, seulement tant qu'aucun élément ne
   * suit le programme — sinon les révisions déjà planifiées ne correspondraient
   * plus à ce que la fiche annonce.
   */
  modifierProgramme: (id: string, label: string, offsets: number[]) => Promise<void>
  /**
   * Refuse de supprimer un programme encore porté par un élément — ses
   * révisions sont déjà écrites, mais sa fiche et son formulaire n'auraient
   * plus de rythme à nommer.
   */
  supprimerProgramme: (id: string) => Promise<boolean>
  /** Combien d'éléments portent ce programme, archivés compris. */
  compterUsages: (id: ScheduleId) => number
  createItem: (draft: ItemDraft) => Promise<Item>
  editItem: (id: string, draft: ItemDraft) => Promise<void>
  removeItem: (id: string) => Promise<void>
  setArchived: (id: string, archived: boolean) => void
  /** Validation optimiste : l'état change tout de suite, l'écriture suit. */
  valider: (id: string, offset: number) => ValidationEffectuee | null
  devalider: (id: string, offset: number) => void
  /** Remet un élément dans l'état exact fourni. Sert au bouton « Annuler ». */
  restaurer: (item: Item) => void
  importItems: (
    items: Item[],
    teintes: Teintes,
    programmes: Programme[],
  ) => Promise<void>
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
  const [teintes, setTeintes] = useState<Teintes>({})
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getAllItems(), getAllTeintes(), getAllProgrammes()])
      .then(([stored, couleurs, rythmes]) => {
        if (cancelled) return
        setItems(stored)
        setTeintes(couleurs)
        setProgrammes(rythmes)
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
        reviews: buildReviews(draft.startDate, draft.schedule, programmes),
        archived: false,
        createdAt: now,
        updatedAt: now,
      }
      await persist(item)
      return item
    },
    [persist, programmes],
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
        reviews: rebuildReviews(
          draft.startDate,
          draft.schedule,
          existing.reviews,
          programmes,
        ),
        updatedAt: new Date().toISOString(),
      })
    },
    [items, persist, programmes],
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

  const definirTeinte = useCallback((categorie: string, teinte: Teinte) => {
    const cle = cleCategorie(categorie)
    if (cle === '') return
    setTeintes((actuelles) => ({ ...actuelles, [cle]: teinte }))
    putTeinte(cle, teinte).catch(() => setError("L'enregistrement local a échoué."))
  }, [])

  /**
   * Un programme personnalisé n'est jamais modifié après coup : les révisions
   * d'un élément sont écrites à sa création, les rejouer changerait un rythme
   * déjà entamé. On crée, on supprime — quand plus rien ne s'en sert.
   */
  const creerProgramme = useCallback(async (label: string, offsets: number[]) => {
    const programme: Programme = {
      id: newId(),
      label: label.trim(),
      offsets,
      createdAt: new Date().toISOString(),
    }
    setProgrammes((actuels) => [...actuels, programme])
    try {
      await putProgramme(programme)
      setError(null)
    } catch {
      setError("L'enregistrement local a échoué.")
    }
    return programme
  }, [])

  const modifierProgramme = useCallback(
    async (id: string, label: string, offsets: number[]) => {
      const existant = programmes.find((programme) => programme.id === id)
      if (!existant) return
      const fige = items.some((item) => item.schedule === id)
      const modifie: Programme = {
        ...existant,
        label: label.trim(),
        offsets: fige ? existant.offsets : offsets,
      }
      setProgrammes((actuels) =>
        actuels.map((programme) => (programme.id === id ? modifie : programme)),
      )
      try {
        await putProgramme(modifie)
        setError(null)
      } catch {
        setError("L'enregistrement local a échoué.")
      }
    },
    [items, programmes],
  )

  const compterUsages = useCallback(
    (id: ScheduleId) => items.filter((item) => item.schedule === id).length,
    [items],
  )

  const supprimerProgramme = useCallback(
    async (id: string) => {
      if (items.some((item) => item.schedule === id)) return false
      setProgrammes((actuels) => actuels.filter((programme) => programme.id !== id))
      try {
        await deleteProgramme(id)
        setError(null)
      } catch {
        setError('La suppression locale a échoué.')
      }
      return true
    },
    [items],
  )

  const importItems = useCallback(
    async (imported: Item[], couleurs: Teintes, rythmes: Programme[]) => {
      setItems(imported)
      setTeintes(couleurs)
      setProgrammes(rythmes)
      try {
        await Promise.all([
          replaceAllItems(imported),
          replaceAllTeintes(couleurs),
          replaceAllProgrammes(rythmes),
        ])
        setError(null)
      } catch {
        setError("L'import n'a pas pu être enregistré localement.")
      }
    },
    [],
  )

  const programmesDisponibles = useMemo(
    () => tousLesProgrammes(programmes),
    [programmes],
  )

  const value = useMemo<ItemsContextValue>(
    () => ({
      items,
      teintes,
      definirTeinte,
      programmes,
      programmesDisponibles,
      creerProgramme,
      modifierProgramme,
      supprimerProgramme,
      compterUsages,
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
      teintes,
      definirTeinte,
      programmes,
      programmesDisponibles,
      creerProgramme,
      modifierProgramme,
      supprimerProgramme,
      compterUsages,
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
