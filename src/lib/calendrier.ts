// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Construction d'une grille mensuelle, partagée par le calendrier plein écran
 * du calendrier plein écran.
 */
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import type { Category, Review, Topic } from '../types'
import { localeActive } from '../i18n'
import { addDaysToKey, debutSemaine, fromKey, toKey, type DateKey } from './dates'
import { allEntries } from './stats'
import { estFaite } from './sujets'

/**
 * Les initiales de la rangée d'en-tête, dans l'ordre où la grille les rend.
 *
 * Dérivées de la locale plutôt qu'écrites à la main : la semaine ne commence
 * pas le même jour partout — lundi en français, dimanche en anglais — et une
 * liste figée décalerait les colonnes d'un cran sans que rien ne le dise. Le
 * calcul repart du début de semaine réel, celui-là même que `grilleDuMois`
 * emploie.
 */
export function joursSemaine(): string[] {
  const debut = startOfWeek(new Date(), debutSemaine())
  return Array.from({ length: 7 }, (_, index) =>
    format(addDays(debut, index), 'EEEEE', { locale: localeActive() }),
  )
}

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
  const debut = startOfWeek(startOfMonth(mois), debutSemaine())
  const fin = endOfWeek(endOfMonth(mois), debutSemaine())

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
 * grille de dates, et il vit ici pour partager le début de semaine de la
 * langue active avec `grilleDuMois`.
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
      return toKey(startOfWeek(fromKey(cle), debutSemaine()))
    case 'End':
      return toKey(endOfWeek(fromKey(cle), debutSemaine()))
    case 'PageUp':
      return toKey(subMonths(fromKey(cle), 1))
    case 'PageDown':
      return toKey(addMonths(fromKey(cle), 1))
    default:
      return null
  }
}
