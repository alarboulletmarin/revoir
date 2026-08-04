/**
 * Géométrie de la frise — section 2 du design system.
 *
 * La frise représente un programme de révision : chaque graduation est une
 * échéance, et l'écart entre deux graduations est proportionnel à l'écart réel
 * entre les dates. La compression est en racine carrée : sans elle, le segment
 * J+180 → J+365 du programme Ultime écraserait J+1, J+2 et J+4 au point de les
 * rendre illisibles.
 *
 * Ce module ne produit que des nombres. Le rendu vit dans composants/Frise.tsx.
 */
import type { Review } from '../types'
import { daysBetween, todayKey, type DateKey } from './dates'
import { dateEffective } from './recalage'

/**
 * Deux échéances peuvent tomber le même jour (une révision validée très en
 * retard rattrape la suivante). Un segment de largeur nulle superposerait
 * leurs graduations : on lui laisse la largeur d'une journée.
 */
const JOURS_MINIMUM = 1

export interface GraduationFrise {
  offset: number
  /** Date réelle : échéance planifiée, ou date de validation si elle est faite. */
  date: DateKey
  faite: boolean
  /** Position le long de la frise, de 0 (origine) à 1 (dernière échéance). */
  position: number
  /** Poids `flex-grow` du segment qui mène à cette graduation. */
  poids: number
  /** Part de la largeur totale occupée par ce segment, de 0 à 1. */
  part: number
}

export interface GeometrieFrise {
  graduations: GraduationFrise[]
  /** Part de la frise déjà parcourue, de 0 à 1. */
  parcours: number
  /**
   * Position du curseur « aujourd'hui », ou null quand le jour courant tombe
   * hors de la frise — avant la date de départ, ou après la dernière échéance.
   */
  curseur: number | null
}

const FRISE_VIDE: GeometrieFrise = { graduations: [], parcours: 0, curseur: null }

/**
 * @param origine date de départ de l'élément — le `├` qui ouvre la frise.
 */
export function geometrieFrise(
  origine: DateKey,
  reviews: Review[],
  aujourdhui: DateKey = todayKey(),
): GeometrieFrise {
  if (reviews.length === 0) return FRISE_VIDE

  const dates = reviews.map(dateEffective)
  const bornes = [origine, ...dates]
  const durees = dates.map((date, index) =>
    Math.max(JOURS_MINIMUM, daysBetween(bornes[index], date)),
  )
  const poids = durees.map(Math.sqrt)
  const total = poids.reduce((somme, valeur) => somme + valeur, 0)

  let cumul = 0
  const graduations = reviews.map((review, index) => {
    cumul += poids[index]
    return {
      offset: review.offset,
      date: dates[index],
      faite: review.done,
      position: cumul / total,
      poids: poids[index],
      part: poids[index] / total,
    }
  })

  const position = positionDe(aujourdhui, bornes, durees, poids, total)
  const dehors =
    daysBetween(bornes[0], aujourdhui) < 0 ||
    daysBetween(bornes[bornes.length - 1], aujourdhui) > 0

  return { graduations, parcours: position, curseur: dehors ? null : position }
}

/** Position d'un jour le long de la frise, bornée à [0, 1]. */
function positionDe(
  jour: DateKey,
  bornes: DateKey[],
  durees: number[],
  poids: number[],
  total: number,
): number {
  if (daysBetween(bornes[0], jour) <= 0) return 0

  let cumul = 0
  for (let index = 0; index < poids.length; index += 1) {
    // Borné : une frise dont les dates ne seraient pas croissantes (révisions
    // validées dans le désordre) ne doit pas produire de position négative.
    const ecoule = Math.min(
      Math.max(daysBetween(bornes[index], jour), 0),
      durees[index],
    )
    if (ecoule < durees[index]) {
      return (cumul + poids[index] * (ecoule / durees[index])) / total
    }
    cumul += poids[index]
  }
  return 1
}
