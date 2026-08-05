// SPDX-License-Identifier: AGPL-3.0-only

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
import type { Review } from '../types'
import { addDaysToKey, daysBetween, toKey, todayKey, type DateKey } from './dates'

/**
 * Date à laquelle une révision a réellement eu lieu.
 *
 * `dueDate` est l'échéance planifiée, `completedAt` le moment de la validation :
 * les deux diffèrent dès qu'une révision est validée en retard. La frise se
 * sert de cette date-ci pour ses graduations faites.
 */
export function dateEffective(review: Review): DateKey {
  if (review.completedAt === null) return review.dueDate
  const validee = new Date(review.completedAt)
  if (Number.isNaN(validee.getTime())) return review.dueDate
  return toKey(validee)
}

export interface ResultatValidation {
  /** Les révisions du sujet, réécrites. Le recalage en déplace plusieurs. */
  reviews: Review[]
  /** Jours de retard absorbés. 0 si la validation n'était pas en retard. */
  retard: number
  /** Nombre d'échéances à venir déplacées par le recalage. */
  deplacees: number
}

/**
 * Valide une révision et recale les suivantes si elle était en retard.
 *
 * « Suivantes » se lit sur `position`, jamais sur l'ordre du tableau : les
 * révisions viennent maintenant de leur propre table, où l'ordre de lecture ne
 * veut rien dire. Se fier à l'index aurait recalé au hasard.
 *
 * `aujourdhui` et `horodatage` sont injectables pour rendre la fonction
 * testable : rien ici ne lit l'horloge en dehors de leurs valeurs par défaut.
 */
export function validerRevision(
  reviews: Review[],
  reviewId: string,
  aujourdhui: DateKey = todayKey(),
  horodatage: string = new Date().toISOString(),
): ResultatValidation {
  const cible = reviews.find((review) => review.id === reviewId)
  if (!cible) return { reviews, retard: 0, deplacees: 0 }

  const retard = Math.max(0, daysBetween(cible.dueDate, aujourdhui))

  let deplacees = 0
  const recalees = reviews.map((review) => {
    if (review.id === cible.id) return { ...review, completedAt: horodatage }
    // Validation à l'heure ou en avance : aucune échéance ne bouge.
    // Une révision déjà faite garde sa date, elle appartient au passé.
    if (
      retard === 0 ||
      review.position <= cible.position ||
      review.completedAt !== null
    ) {
      return review
    }

    const dueDate = addDaysToKey(
      aujourdhui,
      review.intervalInDays - cible.intervalInDays,
    )
    if (dueDate === review.dueDate) return review
    deplacees += 1
    return { ...review, dueDate }
  })

  return { reviews: recalees, retard, deplacees }
}

/**
 * Date d'un report : le lendemain, à partir d'aujourd'hui si l'échéance est
 * déjà passée.
 *
 * Reporter une révision en retard du 1er août alors qu'on est le 5 la place au
 * 6, pas au 2 : sans quoi le report ne ferait rien d'autre que déplacer le
 * retard d'un jour. Une échéance à venir, elle, recule d'un jour depuis sa
 * propre date.
 */
export function dateDeReport(review: Review, aujourdhui: DateKey = todayKey()): DateKey {
  const base = review.dueDate < aujourdhui ? aujourdhui : review.dueDate
  return addDaysToKey(base, 1)
}

export interface ResultatReport {
  reviews: Review[]
  /** La nouvelle échéance, ou null si rien n'a bougé. */
  date: DateKey | null
}

/**
 * Reporte une révision d'un jour — règle métier n°6.
 *
 * **Seule cette échéance bouge.** Le recalage après retard déplace les
 * suivantes parce qu'une validation dit quelque chose du rythme réel : elle a
 * eu lieu, et le programme repart de là. Un report ne dit rien de tel — il dit
 * « pas aujourd'hui ». Le programme n'a pas changé, les échéances suivantes
 * non plus.
 *
 * Une révision faite ne se reporte pas : elle appartient au passé, et il n'y a
 * rien à décaler. Le retour est alors inchangé, `date` à null.
 */
export function reporterRevision(
  reviews: Review[],
  reviewId: string,
  aujourdhui: DateKey = todayKey(),
): ResultatReport {
  const cible = reviews.find((review) => review.id === reviewId)
  if (!cible || cible.completedAt !== null) return { reviews, date: null }

  const date = dateDeReport(cible, aujourdhui)
  if (date === cible.dueDate) return { reviews, date: null }

  return {
    reviews: reviews.map((review) =>
      review.id === reviewId ? { ...review, dueDate: date } : review,
    ),
    date,
  }
}

/**
 * Décoche une révision.
 *
 * Volontairement asymétrique : décocher ne défait pas un recalage, parce que
 * les échéances suivantes ont pu être validées entre-temps sur leurs nouvelles
 * dates. Le retour exact à l'état antérieur est le rôle du bouton « Annuler »
 * du toast, qui restaure les révisions telles qu'elles étaient avant la
 * validation.
 */
export function devaliderRevision(reviews: Review[], reviewId: string): Review[] {
  return reviews.map((review) =>
    review.id === reviewId ? { ...review, completedAt: null } : review,
  )
}
