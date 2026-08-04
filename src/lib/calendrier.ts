/**
 * Construction d'une grille mensuelle, partagée par le calendrier plein écran
 * et le mini-mois du bento.
 */
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import type { Item } from '../types'
import { toKey, type DateKey } from './dates'
import { entriesForDate } from './stats'

/** Semaine française : lundi en premier. */
const DEBUT_SEMAINE = { weekStartsOn: 1 } as const

export const JOURS_SEMAINE = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export interface JourCalendrier {
  cle: DateKey
  numero: number
  dansLeMois: boolean
  total: number
  restantes: number
}

export function grilleDuMois(items: Item[], mois: Date): JourCalendrier[] {
  const debut = startOfWeek(startOfMonth(mois), DEBUT_SEMAINE)
  const fin = endOfWeek(endOfMonth(mois), DEBUT_SEMAINE)

  return eachDayOfInterval({ start: debut, end: fin }).map((date) => {
    const cle = toKey(date)
    const entrees = entriesForDate(items, cle)
    return {
      cle,
      numero: date.getDate(),
      dansLeMois: isSameMonth(date, mois),
      total: entrees.length,
      restantes: entrees.filter((entree) => !entree.review.done).length,
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
