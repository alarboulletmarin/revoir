// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Construction d'une grille mensuelle, partagée par le calendrier plein écran
 * et le mini-mois du bento.
 */
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import type { Category, Review, Topic } from '../types'
import { addDaysToKey, fromKey, toKey, type DateKey } from './dates'
import { allEntries } from './stats'
import { estFaite } from './sujets'

/** Semaine française : lundi en premier. */
const DEBUT_SEMAINE = { weekStartsOn: 1 } as const

export const JOURS_SEMAINE = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export interface JourCalendrier {
  cle: DateKey
  numero: number
  dansLeMois: boolean
  total: number
  restantes: number
  /**
   * Catégories des révisions du jour, dans l'ordre où la feuille les listera.
   * `null` pour un sujet sans catégorie. Le calendrier n'en teinte que les
   * trois premiers points, mais c'est la liste complète qui sert à nommer les
   * catégories du jour.
   */
  categories: (Category | null)[]
}

/**
 * Les entrées sont réparties par jour en une passe, puis lues quarante-deux
 * fois. Une grille qui appellerait une recherche par date pour chacune de ses
 * cases balaierait toutes les révisions quarante-deux fois par mois affiché.
 */
export function grilleDuMois(
  topics: Topic[],
  reviews: Review[],
  categories: Category[],
  mois: Date,
): JourCalendrier[] {
  const debut = startOfWeek(startOfMonth(mois), DEBUT_SEMAINE)
  const fin = endOfWeek(endOfMonth(mois), DEBUT_SEMAINE)

  const parId = new Map(categories.map((categorie) => [categorie.id, categorie]))
  const parJour = new Map<DateKey, JourCalendrier['categories']>()
  const restantesParJour = new Map<DateKey, number>()

  for (const { topic, review } of allEntries(topics, reviews)) {
    const jour = review.dueDate
    const liste = parJour.get(jour) ?? []
    liste.push(topic.categoryId === null ? null : (parId.get(topic.categoryId) ?? null))
    parJour.set(jour, liste)
    if (!estFaite(review)) {
      restantesParJour.set(jour, (restantesParJour.get(jour) ?? 0) + 1)
    }
  }

  return eachDayOfInterval({ start: debut, end: fin }).map((date) => {
    const cle = toKey(date)
    const jourCategories = parJour.get(cle) ?? []
    return {
      cle,
      numero: date.getDate(),
      dansLeMois: isSameMonth(date, mois),
      total: jourCategories.length,
      restantes: restantesParJour.get(cle) ?? 0,
      categories: jourCategories,
    }
  })
}

/**
 * Densité en points, de 0 à 3. Jamais plus de trois, même à douze révisions
 * (section 8.11) : au-delà, la nuance n'apporte rien et la case déborde.
 */
export function densite(total: number): number {
  return Math.min(3, total)
}

/**
 * Jour visé par une touche de navigation dans la grille, ou null si la touche
 * ne concerne pas le calendrier.
 *
 * Flèches d'un jour et d'une semaine, Origine et Fin aux deux bouts de la
 * semaine, Page préc./suiv. d'un mois : c'est le jeu de touches attendu d'une
 * grille de dates, et il vit ici pour partager la semaine française avec
 * `grilleDuMois`.
 */
export function deplacementClavier(cle: DateKey, touche: string): DateKey | null {
  switch (touche) {
    case 'ArrowLeft':
      return addDaysToKey(cle, -1)
    case 'ArrowRight':
      return addDaysToKey(cle, 1)
    case 'ArrowUp':
      return addDaysToKey(cle, -7)
    case 'ArrowDown':
      return addDaysToKey(cle, 7)
    case 'Home':
      return toKey(startOfWeek(fromKey(cle), DEBUT_SEMAINE))
    case 'End':
      return toKey(endOfWeek(fromKey(cle), DEBUT_SEMAINE))
    case 'PageUp':
      return toKey(subMonths(fromKey(cle), 1))
    case 'PageDown':
      return toKey(addMonths(fromKey(cle), 1))
    default:
      return null
  }
}
