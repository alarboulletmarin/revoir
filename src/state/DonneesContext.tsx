import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  Category,
  PracticeStatus,
  Programme,
  Review,
  ScheduleId,
  Topic,
} from '../types'
import {
  deleteCategoryDetachingTopics,
  deleteProgramme,
  deleteTopicWithReviews,
  getAllCategories,
  getAllProgrammes,
  getAllReviews,
  getAllTopics,
  putCategory,
  putProgramme,
  putReview,
  putTopic,
  replaceAll,
  replaceReviewsOfTopic,
} from '../db/database'
import { detacherCategorie, type Teinte } from '../lib/categories'
import type { ContenuSauvegarde } from '../lib/backup'
import { newId } from '../lib/ids'
import { revisionsDe } from '../lib/sujets'
import {
  buildReviews,
  rebuildReviews,
  tousLesProgrammes,
  type Schedule,
} from '../lib/schedules'
import { devaliderRevision, validerRevision } from '../lib/recalage'
import { todayKey, type DateKey } from '../lib/dates'

export interface SujetDraft {
  title: string
  /**
   * La catégorie choisie, ou null. Un identifiant et non un nom : la catégorie
   * existe avant le sujet, le formulaire la désigne, il ne l'invente plus.
   */
  categoryId: string | null
  startDate: DateKey
  scheduleId: ScheduleId
}

/** Ce qu'une validation renvoie à l'appelant pour construire son toast. */
export interface ValidationEffectuee {
  topicId: string
  /**
   * Toutes les révisions du sujet, telles qu'avant — la cible d'« Annuler ».
   * L'ensemble et non la seule révision validée : le recalage a pu en
   * déplacer plusieurs, et les rejouer une à une ne les remettrait pas.
   */
  precedentes: Review[]
  /** Jours de retard absorbés. 0 si la validation n'était pas en retard. */
  retard: number
  /** Échéances à venir déplacées par le recalage. */
  deplacees: number
}

export interface DonneesContextValue {
  categories: Category[]
  topics: Topic[]
  reviews: Review[]
  loading: boolean
  /** Message d'erreur si IndexedDB est indisponible (navigation privée, quota). */
  error: string | null

  /**
   * Renvoie la catégorie créée : l'appelant a besoin de son identifiant pour la
   * sélectionner aussitôt — c'est tout l'intérêt du raccourci du formulaire.
   */
  creerCategorie: (nom: string, teinte: Teinte | null) => Promise<Category>
  /** Nom et couleur passent par le même point d'écriture : c'est une seule ligne. */
  modifierCategorie: (id: string, nom: string, teinte: Teinte | null) => Promise<void>
  /**
   * Supprime la catégorie et détache ses sujets, qui rejoignent « Sans
   * catégorie ». Aucun sujet n'est perdu.
   */
  supprimerCategorie: (id: string) => Promise<void>

  /** Les rythmes créés par l'utilisateur, dans l'ordre de création. */
  programmes: Programme[]
  /** Les trois intégrés puis les créés : ce que proposent les formulaires. */
  programmesDisponibles: Schedule[]
  creerProgramme: (label: string, offsets: number[]) => Promise<Programme>
  /**
   * Le nom se change toujours ; le rythme, seulement tant qu'aucun sujet ne
   * suit le programme — sinon les révisions déjà planifiées ne correspondraient
   * plus à ce que la fiche annonce.
   */
  modifierProgramme: (id: string, label: string, offsets: number[]) => Promise<void>
  /**
   * Refuse de supprimer un programme encore porté par un sujet — ses révisions
   * sont déjà écrites, mais sa fiche et son formulaire n'auraient plus de
   * rythme à nommer.
   */
  supprimerProgramme: (id: string) => Promise<boolean>
  /** Combien de sujets portent ce programme, archivés compris. */
  compterUsages: (id: ScheduleId) => number

  createTopic: (draft: SujetDraft) => Promise<Topic>
  editTopic: (id: string, draft: SujetDraft) => Promise<void>
  removeTopic: (id: string) => Promise<void>
  setArchived: (id: string, archived: boolean) => void
  definirPratique: (id: string, statut: PracticeStatus) => void

  /** Validation optimiste : l'état change tout de suite, l'écriture suit. */
  valider: (reviewId: string) => ValidationEffectuee | null
  devalider: (reviewId: string) => void
  /** Remet les révisions d'un sujet dans l'état fourni. Sert à « Annuler ». */
  restaurerRevisions: (topicId: string, precedentes: Review[]) => void

  importer: (contenu: ContenuSauvegarde) => Promise<void>
}

export const DonneesContext = createContext<DonneesContextValue | null>(null)

export function DonneesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getAllCategories(), getAllTopics(), getAllReviews(), getAllProgrammes()])
      .then(([lues, sujets, revisions, rythmes]) => {
        if (cancelled) return
        setCategories(lues)
        setTopics(sujets)
        setReviews(revisions)
        setProgrammes(rythmes)
      })
      .catch(() => {
        if (!cancelled) {
          /*
           * Ce message couvre deux causes très différentes : un stockage
           * indisponible, et une mise à jour de la base qui a échoué. Dans les
           * deux cas la base est intacte — une transaction de mise à jour qui
           * lève est annulée —, et le conseil utile est le même.
           */
          setError(
            'Impossible de lire les données locales. Elles ne sont pas perdues : ' +
              'réessayez, et exportez-les depuis les réglages dès que possible.',
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

  const signaler = useCallback((message: string) => {
    return (promesse: Promise<unknown>) => {
      promesse.then(() => setError(null)).catch(() => setError(message))
    }
  }, [])

  const echecEcriture = useMemo(
    () => signaler("L'enregistrement local a échoué."),
    [signaler],
  )

  /**
   * L'état en mémoire est la source d'affichage : on l'applique tout de suite
   * puis on persiste. Si l'écriture échoue, on le signale sans perdre la
   * saisie en cours.
   */
  const persistTopic = useCallback(
    (topic: Topic) => {
      setTopics((actuels) => {
        const index = actuels.findIndex((candidat) => candidat.id === topic.id)
        if (index === -1) return [...actuels, topic]
        const suivants = [...actuels]
        suivants[index] = topic
        return suivants
      })
      echecEcriture(putTopic(topic))
    },
    [echecEcriture],
  )

  /** Remplace en mémoire et en base toutes les révisions d'un sujet. */
  const persistRevisions = useCallback(
    (topicId: string, revisions: Review[]) => {
      setReviews((actuelles) => [
        ...actuelles.filter((review) => review.topicId !== topicId),
        ...revisions,
      ])
      echecEcriture(replaceReviewsOfTopic(topicId, revisions))
    },
    [echecEcriture],
  )

  /**
   * Les trois écritures d'une catégorie.
   *
   * Elle ne naît plus d'une saisie et ne disparaît plus toute seule : jusqu'ici
   * une catégorie était créée à la volée par le nom tapé dans le formulaire, et
   * ramassée dès que plus aucun sujet ne la désignait. On ne pouvait donc ni la
   * préparer, ni la renommer — retaper le nom en fabriquait une seconde —, ni
   * la garder vide. C'est désormais une entité que l'on gère.
   */
  const creerCategorie = useCallback(
    async (nom: string, teinte: Teinte | null) => {
      const maintenant = new Date().toISOString()
      const categorie: Category = {
        id: newId(),
        name: nom.trim(),
        tint: teinte,
        createdAt: maintenant,
        updatedAt: maintenant,
      }
      setCategories((actuelles) => [...actuelles, categorie])
      echecEcriture(putCategory(categorie))
      return categorie
    },
    [echecEcriture],
  )

  const modifierCategorie = useCallback(
    async (id: string, nom: string, teinte: Teinte | null) => {
      const existante = categories.find((categorie) => categorie.id === id)
      if (!existante) return
      const modifiee: Category = {
        ...existante,
        name: nom.trim(),
        tint: teinte,
        updatedAt: new Date().toISOString(),
      }
      setCategories((actuelles) =>
        actuelles.map((categorie) => (categorie.id === id ? modifiee : categorie)),
      )
      echecEcriture(putCategory(modifiee))
    },
    [categories, echecEcriture],
  )

  /**
   * Les sujets ne suivent pas la catégorie dans sa suppression : ils rejoignent
   * « Sans catégorie ». La décision se prend dans `lib/`, l'écriture se fait
   * d'un bloc — sinon une panne laisserait des sujets pointant une catégorie
   * disparue.
   */
  const supprimerCategorie = useCallback(
    async (id: string) => {
      const detaches = detacherCategorie(id, topics, new Date().toISOString())
      const parId = new Map(detaches.map((topic) => [topic.id, topic]))
      setTopics((actuels) => actuels.map((topic) => parId.get(topic.id) ?? topic))
      setCategories((actuelles) => actuelles.filter((categorie) => categorie.id !== id))
      try {
        await deleteCategoryDetachingTopics(id, detaches)
        setError(null)
      } catch {
        setError('La suppression locale a échoué.')
      }
    },
    [topics],
  )

  const createTopic = useCallback(
    async (draft: SujetDraft) => {
      const maintenant = new Date().toISOString()
      const topic: Topic = {
        id: newId(),
        categoryId: draft.categoryId,
        title: draft.title.trim(),
        startDate: draft.startDate,
        scheduleId: draft.scheduleId,
        practiceStatus: 'todo',
        status: 'active',
        createdAt: maintenant,
        updatedAt: maintenant,
      }
      persistTopic(topic)
      persistRevisions(
        topic.id,
        buildReviews(topic.id, draft.startDate, draft.scheduleId, programmes),
      )
      return topic
    },
    [persistTopic, persistRevisions, programmes],
  )

  const editTopic = useCallback(
    async (id: string, draft: SujetDraft) => {
      const existant = topics.find((topic) => topic.id === id)
      if (!existant) return

      const modifie: Topic = {
        ...existant,
        categoryId: draft.categoryId,
        title: draft.title.trim(),
        startDate: draft.startDate,
        scheduleId: draft.scheduleId,
        updatedAt: new Date().toISOString(),
      }
      persistTopic(modifie)
      persistRevisions(
        id,
        rebuildReviews(
          id,
          draft.startDate,
          draft.scheduleId,
          revisionsDe(id, reviews),
          programmes,
        ),
      )
    },
    [topics, reviews, programmes, persistTopic, persistRevisions],
  )

  const removeTopic = useCallback(
    async (id: string) => {
      setTopics(topics.filter((topic) => topic.id !== id))
      setReviews((actuelles) => actuelles.filter((review) => review.topicId !== id))
      try {
        await deleteTopicWithReviews(id)
        setError(null)
      } catch {
        setError('La suppression locale a échoué.')
      }
    },
    [topics],
  )

  const setArchived = useCallback(
    (id: string, archived: boolean) => {
      const existant = topics.find((topic) => topic.id === id)
      if (!existant) return
      persistTopic({
        ...existant,
        status: archived ? 'archived' : 'active',
        updatedAt: new Date().toISOString(),
      })
    },
    [topics, persistTopic],
  )

  const definirPratique = useCallback(
    (id: string, statut: PracticeStatus) => {
      const existant = topics.find((topic) => topic.id === id)
      if (!existant || existant.practiceStatus === statut) return
      persistTopic({
        ...existant,
        practiceStatus: statut,
        updatedAt: new Date().toISOString(),
      })
    },
    [topics, persistTopic],
  )

  /**
   * Règle métier n°2 : aucune confirmation, mise à jour immédiate, et de quoi
   * revenir en arrière. On renvoie les révisions d'avant plutôt qu'un
   * identifiant d'opération — c'est la seule façon d'annuler exactement un
   * recalage, qui a pu déplacer plusieurs échéances d'un coup.
   */
  const valider = useCallback(
    (reviewId: string): ValidationEffectuee | null => {
      const cible = reviews.find((review) => review.id === reviewId)
      if (!cible) return null

      const precedentes = revisionsDe(cible.topicId, reviews)
      const resultat = validerRevision(precedentes, reviewId, todayKey())
      persistRevisions(cible.topicId, resultat.reviews)

      return {
        topicId: cible.topicId,
        precedentes,
        retard: resultat.retard,
        deplacees: resultat.deplacees,
      }
    },
    [reviews, persistRevisions],
  )

  const devalider = useCallback(
    (reviewId: string) => {
      const cible = reviews.find((review) => review.id === reviewId)
      if (!cible) return
      const [decochee] = devaliderRevision([cible], reviewId)
      setReviews((actuelles) =>
        actuelles.map((review) => (review.id === reviewId ? decochee : review)),
      )
      echecEcriture(putReview(decochee))
    },
    [reviews, echecEcriture],
  )

  const restaurerRevisions = useCallback(
    (topicId: string, precedentes: Review[]) => {
      persistRevisions(topicId, precedentes)
    },
    [persistRevisions],
  )

  const creerProgramme = useCallback(
    async (label: string, offsets: number[]) => {
      const programme: Programme = {
        id: newId(),
        label: label.trim(),
        offsets,
        createdAt: new Date().toISOString(),
      }
      setProgrammes((actuels) => [...actuels, programme])
      echecEcriture(putProgramme(programme))
      return programme
    },
    [echecEcriture],
  )

  const modifierProgramme = useCallback(
    async (id: string, label: string, offsets: number[]) => {
      const existant = programmes.find((programme) => programme.id === id)
      if (!existant) return
      const fige = topics.some((topic) => topic.scheduleId === id)
      const modifie: Programme = {
        ...existant,
        label: label.trim(),
        offsets: fige ? existant.offsets : offsets,
      }
      setProgrammes((actuels) =>
        actuels.map((programme) => (programme.id === id ? modifie : programme)),
      )
      echecEcriture(putProgramme(modifie))
    },
    [topics, programmes, echecEcriture],
  )

  const compterUsages = useCallback(
    (id: ScheduleId) => topics.filter((topic) => topic.scheduleId === id).length,
    [topics],
  )

  const supprimerProgramme = useCallback(
    async (id: string) => {
      if (topics.some((topic) => topic.scheduleId === id)) return false
      setProgrammes((actuels) => actuels.filter((programme) => programme.id !== id))
      try {
        await deleteProgramme(id)
        setError(null)
      } catch {
        setError('La suppression locale a échoué.')
      }
      return true
    },
    [topics],
  )

  const importer = useCallback(async (contenu: ContenuSauvegarde) => {
    setCategories(contenu.categories)
    setTopics(contenu.topics)
    setReviews(contenu.reviews)
    setProgrammes(contenu.programmes)
    try {
      await replaceAll(contenu)
      setError(null)
    } catch {
      setError("L'import n'a pas pu être enregistré localement.")
    }
  }, [])

  const programmesDisponibles = useMemo(
    () => tousLesProgrammes(programmes),
    [programmes],
  )

  const value = useMemo<DonneesContextValue>(
    () => ({
      categories,
      topics,
      reviews,
      loading,
      error,
      creerCategorie,
      modifierCategorie,
      supprimerCategorie,
      programmes,
      programmesDisponibles,
      creerProgramme,
      modifierProgramme,
      supprimerProgramme,
      compterUsages,
      createTopic,
      editTopic,
      removeTopic,
      setArchived,
      definirPratique,
      valider,
      devalider,
      restaurerRevisions,
      importer,
    }),
    [
      categories,
      topics,
      reviews,
      loading,
      error,
      creerCategorie,
      modifierCategorie,
      supprimerCategorie,
      programmes,
      programmesDisponibles,
      creerProgramme,
      modifierProgramme,
      supprimerProgramme,
      compterUsages,
      createTopic,
      editTopic,
      removeTopic,
      setArchived,
      definirPratique,
      valider,
      devalider,
      restaurerRevisions,
      importer,
    ],
  )

  return <DonneesContext.Provider value={value}>{children}</DonneesContext.Provider>
}
