// SPDX-License-Identifier: AGPL-3.0-only

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
import { textes } from '../i18n'
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
import {
  devaliderRevision,
  reporterPlusieurs as reporterPlusieursRevisions,
  reporterRevision,
  validerPlusieurs as validerPlusieursRevisions,
  validerRevision,
  type ResultatGroupe,
} from '../lib/recalage'
import { todayKey, type DateKey } from '../lib/dates'
import { construireJeuExemple } from '../lib/exemple'

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

/**
 * Ce qu'un geste portant sur plusieurs révisions renvoie à l'appelant.
 *
 * Les révisions d'un même jour appartiennent à plusieurs sujets : l'état à
 * restaurer est donc un tableau par sujet, et « Annuler » les rejoue tous.
 */
export interface GesteGroupe {
  /** Les révisions d'avant, par sujet touché — la cible d'« Annuler ». */
  precedentes: Map<string, Review[]>
  /** Combien de révisions ont réellement changé d'état. */
  touchees: number
  /** Échéances à venir déplacées par les recalages, tous sujets confondus. */
  deplacees: number
}

/** Ce qu'un report renvoie à l'appelant pour construire son toast. */
export interface ReportEffectue {
  topicId: string
  /** Les révisions du sujet telles qu'avant — la cible d'« Annuler ». */
  precedentes: Review[]
  /** La nouvelle échéance. */
  date: DateKey
}

export interface DonneesContextValue {
  categories: Category[]
  topics: Topic[]
  reviews: Review[]
  loading: boolean
  /** Message d'erreur si IndexedDB est indisponible (navigation privée, quota). */
  error: string | null
  /** Rejoue la lecture initiale — le « Réessayer » de l'écran d'erreur. */
  relire: () => Promise<void>

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
  /** Remet un programme supprimé, tel quel. Sert à « Annuler ». */
  restaurerProgramme: (programme: Programme) => void
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
  /**
   * Repousse une échéance d'un jour, sans toucher aux suivantes (règle métier
   * n°6). Renvoie null si la révision est déjà faite ou introuvable.
   */
  reporter: (reviewId: string) => ReportEffectue | null
  /**
   * Valide plusieurs révisions d'un coup — « Tout marquer comme revu ».
   *
   * Ce n'est pas une boucle sur `valider` : chaque validation en retard recale
   * les suivantes du même sujet, et deux appels partis du même état
   * s'écraseraient l'un l'autre. La cascade vit dans `lib/recalage.ts`, avec
   * ses tests.
   */
  validerPlusieurs: (reviewIds: string[]) => GesteGroupe
  /** Reporte plusieurs échéances d'un jour, sans toucher aux suivantes. */
  reporterPlusieurs: (reviewIds: string[]) => GesteGroupe
  /** Remet les révisions d'un sujet dans l'état fourni. Sert à « Annuler ». */
  restaurerRevisions: (topicId: string, precedentes: Review[]) => void

  /**
   * Charge le jeu d'exemple et rend les identifiants des sujets créés
   * (section 8.24). Ce sont des sujets ordinaires : rien ne les distingue en
   * base, seul l'appareil se souvient de les avoir demandés.
   */
  chargerJeuExemple: () => Promise<string[]>
  /** Retire les sujets d'exemple encore présents, et eux seuls. */
  effacerJeuExemple: (ids: string[]) => Promise<void>

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

  /**
   * La lecture initiale, rejouable.
   *
   * Elle a une seconde vie : le bouton « Réessayer » de l'écran d'erreur
   * (section 8.23). Un stockage indisponible ne l'est pas toujours pour
   * toujours — un autre onglet tenait une transaction, le navigateur venait de
   * refuser le quota —, et proposer de réessayer coûte moins qu'expliquer
   * comment recharger la page.
   */
  const relire = useCallback(() => {
    setLoading(true)
    setError(null)
    return Promise.all([
      getAllCategories(),
      getAllTopics(),
      getAllReviews(),
      getAllProgrammes(),
    ])
      .then(([lues, sujets, revisions, rythmes]) => {
        setCategories(lues)
        setTopics(sujets)
        setReviews(revisions)
        setProgrammes(rythmes)
      })
      .catch(() => {
        /*
         * Ce message couvre deux causes très différentes : un stockage
         * indisponible, et une mise à jour de la base qui a échoué. Dans les
         * deux cas la base est intacte — une transaction de mise à jour qui
         * lève est annulée —, et le conseil utile est le même.
         */
        setError(textes().erreurs.lecture)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    void relire()
  }, [relire])

  const signaler = useCallback((message: string) => {
    return (promesse: Promise<unknown>) => {
      promesse.then(() => setError(null)).catch(() => setError(message))
    }
  }, [])

  const echecEcriture = useMemo(
    () => signaler(textes().erreurs.ecriture),
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
        setError(textes().erreurs.suppression)
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
        setError(textes().erreurs.suppression)
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

  /**
   * Règle métier n°6 : « pas aujourd'hui ». Même forme que la validation —
   * écriture immédiate, révisions d'avant renvoyées pour « Annuler » —, mais
   * une seule échéance bouge : un report ne dit rien du rythme réel.
   */
  const reporter = useCallback(
    (reviewId: string): ReportEffectue | null => {
      const cible = reviews.find((review) => review.id === reviewId)
      if (!cible) return null

      const precedentes = revisionsDe(cible.topicId, reviews)
      const resultat = reporterRevision(precedentes, reviewId, todayKey())
      if (resultat.date === null) return null

      persistRevisions(cible.topicId, resultat.reviews)
      return { topicId: cible.topicId, precedentes, date: resultat.date }
    },
    [reviews, persistRevisions],
  )

  /**
   * Le patron commun aux deux gestes groupés : regrouper les identifiants par
   * sujet, appliquer la cascade sujet par sujet, écrire chaque sujet une seule
   * fois. Écrire par révision produirait autant d'écritures que de coches et
   * autant d'états intermédiaires visibles.
   */
  const geste = useCallback(
    (
      reviewIds: string[],
      appliquer: (revisions: Review[], ids: string[]) => ResultatGroupe,
    ): GesteGroupe => {
      const parSujet = new Map<string, string[]>()
      for (const reviewId of reviewIds) {
        const cible = reviews.find((review) => review.id === reviewId)
        if (!cible) continue
        parSujet.set(cible.topicId, [...(parSujet.get(cible.topicId) ?? []), reviewId])
      }

      const precedentes = new Map<string, Review[]>()
      let touchees = 0
      let deplacees = 0

      for (const [topicId, ids] of parSujet) {
        const avant = revisionsDe(topicId, reviews)
        const resultat = appliquer(avant, ids)
        if (resultat.touchees === 0) continue
        precedentes.set(topicId, avant)
        touchees += resultat.touchees
        deplacees += resultat.deplacees
        persistRevisions(topicId, resultat.reviews)
      }

      return { precedentes, touchees, deplacees }
    },
    [reviews, persistRevisions],
  )

  const validerToutes = useCallback(
    (reviewIds: string[]) =>
      geste(reviewIds, (revisions, ids) =>
        validerPlusieursRevisions(revisions, ids, todayKey()),
      ),
    [geste],
  )

  const reporterToutes = useCallback(
    (reviewIds: string[]) =>
      geste(reviewIds, (revisions, ids) =>
        reporterPlusieursRevisions(revisions, ids, todayKey()),
      ),
    [geste],
  )

  const chargerJeuExemple = useCallback(async () => {
    const { topics: sujets, reviews: revisions } = construireJeuExemple(categories)

    setTopics((actuels) => [...actuels, ...sujets])
    setReviews((actuelles) => [...actuelles, ...revisions])

    await Promise.all([
      ...sujets.map((topic) => putTopic(topic)),
      ...revisions.map((review) => putReview(review)),
    ])
    return sujets.map((topic) => topic.id)
  }, [categories])

  const effacerJeuExemple = useCallback(async (ids: string[]) => {
    const vises = new Set(ids)
    setTopics((actuels) => actuels.filter((topic) => !vises.has(topic.id)))
    setReviews((actuelles) => actuelles.filter((review) => !vises.has(review.topicId)))

    // Un sujet d'exemple a pu être supprimé à la main : `deleteTopicWithReviews`
    // sur un identifiant absent est sans effet, et c'est ce qu'on veut.
    await Promise.all(ids.map((id) => deleteTopicWithReviews(id)))
  }, [])

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
        setError(textes().erreurs.suppression)
      }
      return true
    },
    [topics],
  )

  /**
   * Le programme revient avec son identifiant et sa date de création : les
   * sujets qui le désignaient — il n'y en a aucun, sinon la suppression aurait
   * été refusée — et l'ordre d'affichage sont donc rendus intacts.
   */
  const restaurerProgramme = useCallback(
    (programme: Programme) => {
      setProgrammes((actuels) =>
        actuels.some((candidat) => candidat.id === programme.id)
          ? actuels
          : [...actuels, programme].sort((a, b) =>
              a.createdAt.localeCompare(b.createdAt),
            ),
      )
      echecEcriture(putProgramme(programme))
    },
    [echecEcriture],
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
      setError(textes().erreurs.import)
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
      relire,
      creerCategorie,
      modifierCategorie,
      supprimerCategorie,
      programmes,
      programmesDisponibles,
      creerProgramme,
      modifierProgramme,
      supprimerProgramme,
      restaurerProgramme,
      compterUsages,
      createTopic,
      editTopic,
      removeTopic,
      setArchived,
      definirPratique,
      valider,
      devalider,
      reporter,
      validerPlusieurs: validerToutes,
      reporterPlusieurs: reporterToutes,
      restaurerRevisions,
      chargerJeuExemple,
      effacerJeuExemple,
      importer,
    }),
    [
      categories,
      topics,
      reviews,
      loading,
      error,
      relire,
      creerCategorie,
      modifierCategorie,
      supprimerCategorie,
      programmes,
      programmesDisponibles,
      creerProgramme,
      modifierProgramme,
      supprimerProgramme,
      restaurerProgramme,
      compterUsages,
      createTopic,
      editTopic,
      removeTopic,
      setArchived,
      definirPratique,
      valider,
      devalider,
      reporter,
      validerToutes,
      reporterToutes,
      restaurerRevisions,
      chargerJeuExemple,
      effacerJeuExemple,
      importer,
    ],
  )

  return <DonneesContext.Provider value={value}>{children}</DonneesContext.Provider>
}
