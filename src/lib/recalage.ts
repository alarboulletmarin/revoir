/**
 * Recalage après retard — règle métier n°1.
 *
 * Quand une révision en retard est validée, les échéances suivantes sont
 * recalculées à partir de la date réelle de validation, pas de la date
 * théorique. Les écarts du programme sont conservés : une révision J+7
 * validée avec 3 jours de retard place la J+14 sept jours après la
 * validation, et non quatre.
 *
 * Sans ce recalage, valider une semaine de retard d'un coup ferait tomber
 * toutes les échéances suivantes en même temps.
 */
import type { Item, Review } from '../types'
import { addDaysToKey, daysBetween, toKey, todayKey, type DateKey } from './dates'

/**
 * Date à laquelle une révision a réellement eu lieu.
 *
 * `date` est l'échéance planifiée, `doneAt` le moment de la validation : les
 * deux diffèrent dès qu'une révision est validée en retard. La frise se sert
 * de cette date-ci pour ses graduations faites.
 */
export function dateEffective(review: Review): DateKey {
  if (!review.done || review.doneAt === null) return review.date
  const validee = new Date(review.doneAt)
  if (Number.isNaN(validee.getTime())) return review.date
  return toKey(validee)
}

export interface ResultatValidation {
  item: Item
  /** Jours de retard absorbés. 0 si la validation n'était pas en retard. */
  retard: number
  /** Nombre d'échéances à venir déplacées par le recalage. */
  deplacees: number
}

/**
 * Valide une révision et recale les suivantes si elle était en retard.
 *
 * `aujourdhui` et `horodatage` sont injectables pour rendre la fonction
 * testable : rien ici ne lit l'horloge en dehors de leurs valeurs par défaut.
 */
export function validerRevision(
  item: Item,
  offset: number,
  aujourdhui: DateKey = todayKey(),
  horodatage: string = new Date().toISOString(),
): ResultatValidation {
  const index = item.reviews.findIndex((review) => review.offset === offset)
  if (index === -1) return { item, retard: 0, deplacees: 0 }

  const cible = item.reviews[index]
  const retard = Math.max(0, daysBetween(cible.date, aujourdhui))

  let deplacees = 0
  const reviews = item.reviews.map((review, position) => {
    if (position === index) {
      return { ...review, done: true, doneAt: horodatage }
    }
    // Validation à l'heure ou en avance : aucune échéance ne bouge.
    // Une révision déjà faite garde sa date, elle appartient au passé.
    if (retard === 0 || position <= index || review.done) return review

    const date = addDaysToKey(aujourdhui, review.offset - cible.offset)
    if (date === review.date) return review
    deplacees += 1
    return { ...review, date }
  })

  return { item: { ...item, reviews, updatedAt: horodatage }, retard, deplacees }
}

/**
 * Décoche une révision.
 *
 * Volontairement asymétrique : décocher ne défait pas un recalage, parce que
 * les échéances suivantes ont pu être validées entre-temps sur leurs nouvelles
 * dates. Le retour exact à l'état antérieur est le rôle du bouton « Annuler »
 * du toast, qui restaure l'élément tel qu'il était avant la validation.
 */
export function devaliderRevision(
  item: Item,
  offset: number,
  horodatage: string = new Date().toISOString(),
): Item {
  const index = item.reviews.findIndex((review) => review.offset === offset)
  if (index === -1) return item

  return {
    ...item,
    reviews: item.reviews.map((review, position) =>
      position === index ? { ...review, done: false, doneAt: null } : review,
    ),
    updatedAt: horodatage,
  }
}
