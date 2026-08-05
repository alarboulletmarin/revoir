// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Les sujets et leurs révisions.
 *
 * Depuis que les révisions vivent dans leur propre table, deux choses ne vont
 * plus de soi et sont donc faites une fois pour toutes ici : les rattacher à
 * leur sujet, et les remettre dans l'ordre du programme. L'ordre de lecture de
 * la base ne veut rien dire — c'est `position` qui fait foi.
 */
import type { Category, Review, Topic } from '../types'
import { cleCategorie, SANS_CATEGORIE } from './categories'
import type { DateKey } from './dates'

export { SANS_CATEGORIE }

/** Une révision est faite si et seulement si elle porte un horodatage. */
export function estFaite(review: Review): boolean {
  return review.completedAt !== null
}

/**
 * Les révisions groupées par sujet, chaque groupe trié par `position`.
 *
 * À construire une fois par rendu et à faire circuler : la reconstruire dans
 * chaque fonction rendrait quadratique ce qui est linéaire.
 */
export function revisionsParSujet(reviews: Review[]): Map<string, Review[]> {
  const parSujet = new Map<string, Review[]>()
  for (const review of reviews) {
    const groupe = parSujet.get(review.topicId)
    if (groupe) groupe.push(review)
    else parSujet.set(review.topicId, [review])
  }
  for (const groupe of parSujet.values()) {
    groupe.sort((a, b) => a.position - b.position)
  }
  return parSujet
}

/** Les révisions d'un sujet, dans l'ordre du programme. */
export function revisionsDe(topicId: string, reviews: Review[]): Review[] {
  return reviews
    .filter((review) => review.topicId === topicId)
    .sort((a, b) => a.position - b.position)
}

export function activeTopics(topics: Topic[]): Topic[] {
  return topics.filter((topic) => topic.status === 'active')
}

export function archivedTopics(topics: Topic[]): Topic[] {
  return topics.filter((topic) => topic.status === 'archived')
}

/**
 * Première révision non faite d'un sujet, ou null s'il est terminé.
 *
 * L'objet plutôt que la date seule : les écrans ont besoin du rang pour dire à
 * quelle étape du programme on en est.
 *
 * Calculée par le minimum des dates plutôt que par la première trouvée : le
 * recalage après retard réécrit les échéances, et rien ne garantit qu'elles
 * restent croissantes dans l'ordre du programme.
 */
export function prochaineRevision(revisions: Review[]): Review | null {
  let prochaine: Review | null = null
  for (const review of revisions) {
    if (estFaite(review)) continue
    if (prochaine === null || review.dueDate < prochaine.dueDate) prochaine = review
  }
  return prochaine
}

/** Sa date seule — c'est tout ce que le tri et le regroupement demandent. */
export function prochaineEcheance(revisions: Review[]): DateKey | null {
  return prochaineRevision(revisions)?.dueDate ?? null
}

/** Progression d'un sujet isolé, de 0 à 100. */
export function topicProgress(revisions: Review[]): number {
  if (revisions.length === 0) return 0
  return Math.round((revisions.filter(estFaite).length / revisions.length) * 100)
}

export interface GroupeCategorie {
  /** Clé stable, utilisée pour mémoriser l'état plié/déplié. */
  cle: string
  /** null pour le groupe des sujets sans catégorie. */
  categorie: Category | null
  nom: string
  topics: Topic[]
  /** Révisions restantes sur l'ensemble du groupe. */
  restantes: number
  /** Prochaine échéance non faite du groupe, tous sujets confondus. */
  prochaine: DateKey | null
}

/** La clé du groupe des sujets sans catégorie. Aucune catégorie ne la porte. */
export const CLE_SANS_CATEGORIE = ''

/**
 * Groupes triés par nom, « Sans catégorie » en dernier. À l'intérieur d'un
 * groupe, les sujets sont classés par prochaine échéance : ce qui revient
 * bientôt se lit en premier.
 *
 * Une catégorie sans aucun sujet actif ne produit pas de groupe : elle existe
 * dans la base, mais un groupe vide n'apprend rien à personne.
 */
export function grouperParCategorie(
  categories: Category[],
  topics: Topic[],
  reviews: Review[],
): GroupeCategorie[] {
  const parSujet = revisionsParSujet(reviews)
  const parId = new Map(categories.map((categorie) => [categorie.id, categorie]))
  const groupes = new Map<string, GroupeCategorie>()

  for (const topic of activeTopics(topics)) {
    const categorie = topic.categoryId === null ? null : parId.get(topic.categoryId)
    const cle = categorie?.id ?? CLE_SANS_CATEGORIE
    const groupe = groupes.get(cle) ?? {
      cle,
      categorie: categorie ?? null,
      nom: categorie?.name ?? SANS_CATEGORIE,
      topics: [],
      restantes: 0,
      prochaine: null,
    }

    const revisions = parSujet.get(topic.id) ?? []
    groupe.topics.push(topic)
    groupe.restantes += revisions.filter((review) => !estFaite(review)).length

    const prochaine = prochaineEcheance(revisions)
    if (prochaine && (groupe.prochaine === null || prochaine < groupe.prochaine)) {
      groupe.prochaine = prochaine
    }
    groupes.set(cle, groupe)
  }

  for (const groupe of groupes.values()) {
    groupe.topics.sort(comparerTopics(parSujet))
  }

  return [...groupes.values()].sort((a, b) => {
    if (a.cle === CLE_SANS_CATEGORIE) return 1
    if (b.cle === CLE_SANS_CATEGORIE) return -1
    return a.nom.localeCompare(b.nom, 'fr')
  })
}

/** Ce qui revient le plus tôt d'abord ; les sujets terminés à la fin. */
function comparerTopics(parSujet: Map<string, Review[]>) {
  return (a: Topic, b: Topic): number => {
    const da = prochaineEcheance(parSujet.get(a.id) ?? [])
    const db = prochaineEcheance(parSujet.get(b.id) ?? [])
    if (da === null && db === null) return a.title.localeCompare(b.title, 'fr')
    if (da === null) return 1
    if (db === null) return -1
    if (da !== db) return da < db ? -1 : 1
    return a.title.localeCompare(b.title, 'fr')
  }
}

/** Les catégories triées par nom, comme elles s'affichent partout. */
export function categoriesTriees(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

/** Combien de sujets portent cette catégorie, archivés compris. */
export function compterSujets(categoryId: string, topics: Topic[]): number {
  return topics.filter((topic) => topic.categoryId === categoryId).length
}

export { cleCategorie }
