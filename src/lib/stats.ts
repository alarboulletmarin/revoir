import type { Review, ReviewEntry, Topic } from '../types'
import { addDaysToKey, type DateKey, todayKey } from './dates'
import { activeTopics, estFaite, revisionsParSujet } from './sujets'

export interface Stats {
  activeTopics: number
  archivedTopics: number
  doneReviews: number
  remainingReviews: number
  todayReviews: number
  overdueReviews: number
  /** Part des révisions effectuées, de 0 à 100 (arrondie). */
  progress: number
}

export interface DayLoad {
  date: DateKey
  count: number
}

/**
 * Toutes les révisions des sujets actifs, à plat, triées par échéance.
 *
 * Les révisions d'un sujet archivé sont écartées ici et nulle part ailleurs :
 * c'est le passage obligé de tous les écrans, et le filtre y est donc écrit
 * une seule fois.
 */
export function allEntries(topics: Topic[], reviews: Review[]): ReviewEntry[] {
  const parSujet = revisionsParSujet(reviews)
  const entries: ReviewEntry[] = []
  for (const topic of activeTopics(topics)) {
    for (const review of parSujet.get(topic.id) ?? []) {
      entries.push({ topic, review })
    }
  }
  return sortEntries(entries)
}

function sortEntries(entries: ReviewEntry[]): ReviewEntry[] {
  return entries.sort((a, b) => {
    if (a.review.dueDate !== b.review.dueDate) {
      return a.review.dueDate < b.review.dueDate ? -1 : 1
    }
    return a.topic.title.localeCompare(b.topic.title, 'fr')
  })
}

/** Révisions non effectuées dont la date est passée. */
export function overdueEntries(
  topics: Topic[],
  reviews: Review[],
  today: DateKey = todayKey(),
): ReviewEntry[] {
  return allEntries(topics, reviews).filter(
    (entry) => !estFaite(entry.review) && entry.review.dueDate < today,
  )
}

/** Révisions du jour, effectuées ou non. */
export function todayEntries(
  topics: Topic[],
  reviews: Review[],
  today: DateKey = todayKey(),
): ReviewEntry[] {
  return allEntries(topics, reviews).filter((entry) => entry.review.dueDate === today)
}

/** Prochaines révisions à venir, hors aujourd'hui. */
export function upcomingEntries(
  topics: Topic[],
  reviews: Review[],
  limit = 8,
  today: DateKey = todayKey(),
): ReviewEntry[] {
  return allEntries(topics, reviews)
    .filter((entry) => !estFaite(entry.review) && entry.review.dueDate > today)
    .slice(0, limit)
}

/** Révisions tombant un jour donné, sujets archivés exclus. */
export function entriesForDate(
  topics: Topic[],
  reviews: Review[],
  date: DateKey,
): ReviewEntry[] {
  return allEntries(topics, reviews).filter((entry) => entry.review.dueDate === date)
}

/**
 * Nombre de révisions non effectuées par jour, sur les `days` prochains jours.
 * 14 par défaut : c'est le nombre de barres de la cellule « charge »
 * (section 8.8 du design system).
 */
export function loadForDays(
  topics: Topic[],
  reviews: Review[],
  days = 14,
  today: DateKey = todayKey(),
): DayLoad[] {
  const counts = new Map<DateKey, number>()
  for (let offset = 0; offset < days; offset += 1) {
    counts.set(addDaysToKey(today, offset), 0)
  }
  for (const entry of allEntries(topics, reviews)) {
    if (estFaite(entry.review)) continue
    const current = counts.get(entry.review.dueDate)
    if (current !== undefined) {
      counts.set(entry.review.dueDate, current + 1)
    }
  }
  return [...counts.entries()].map(([date, count]) => ({ date, count }))
}

/**
 * Charge déjà planifiée sur des dates données — règle métier n°4.
 *
 * C'est ce qui différencie l'aperçu du formulaire d'un simple générateur de
 * dates : avant de créer un sujet, on voit que le 14 mars porte déjà cinq
 * révisions. `exclureId` sert à la modification, pour que le sujet en cours
 * d'édition ne se compte pas lui-même.
 */
export function chargeParDate(
  topics: Topic[],
  reviews: Review[],
  dates: DateKey[],
  exclureId?: string,
): Map<DateKey, number> {
  const charge = new Map<DateKey, number>(dates.map((date) => [date, 0]))
  const actifs = new Set(activeTopics(topics).map((topic) => topic.id))
  for (const review of reviews) {
    if (!actifs.has(review.topicId) || review.topicId === exclureId) continue
    if (estFaite(review)) continue
    const actuelle = charge.get(review.dueDate)
    if (actuelle !== undefined) charge.set(review.dueDate, actuelle + 1)
  }
  return charge
}

/**
 * Premier jour à venir portant au moins une révision, avec son effectif.
 * Alimente la deuxième ligne de l'état vide : « Prochaine révision : jeudi
 * 6 août, 3 sujets. » (section 8.9)
 */
export function nextReviewDay(
  topics: Topic[],
  reviews: Review[],
  today: DateKey = todayKey(),
): DayLoad | null {
  const entries = allEntries(topics, reviews)
  const next = entries.find(
    (entry) => !estFaite(entry.review) && entry.review.dueDate > today,
  )
  if (!next) return null
  const date = next.review.dueDate
  return {
    date,
    count: entries.filter(
      (entry) => entry.review.dueDate === date && !estFaite(entry.review),
    ).length,
  }
}

export function computeStats(
  topics: Topic[],
  reviews: Review[],
  today: DateKey = todayKey(),
): Stats {
  const actifs = activeTopics(topics)
  const ids = new Set(actifs.map((topic) => topic.id))
  let done = 0
  let total = 0
  for (const review of reviews) {
    if (!ids.has(review.topicId)) continue
    total += 1
    if (estFaite(review)) done += 1
  }
  return {
    activeTopics: actifs.length,
    archivedTopics: topics.length - actifs.length,
    doneReviews: done,
    remainingReviews: total - done,
    todayReviews: todayEntries(topics, reviews, today).filter(
      (entry) => !estFaite(entry.review),
    ).length,
    overdueReviews: overdueEntries(topics, reviews, today).length,
    progress: total === 0 ? 0 : Math.round((done / total) * 100),
  }
}

/** Où en est une révision dans le programme de son sujet. */
export interface ProgressionEntree {
  /** Rang dans le programme, à partir de 1 : le « 2 » de « Révision 2 sur 5 ». */
  rang: number
  total: number
  /** Prochaine échéance non faite après celle-ci, sinon null. */
  suivante: DateKey | null
}

/**
 * La position d'une révision dans son programme, en clair.
 *
 * C'est ce que la frise montre graphiquement ; là où la place manque — la
 * feuille du calendrier, le panneau d'une cellule du tableau — c'est ce texte
 * qui la remplace.
 *
 * `suivante` se calcule par le minimum plutôt que par la première trouvée : le
 * recalage après retard réécrit les dates, et rien ne garantit qu'elles
 * restent croissantes.
 *
 * @param revisions les révisions du sujet, celle-ci comprise.
 */
export function progressionEntree(
  review: Review,
  revisions: Review[],
): ProgressionEntree {
  const suivantes = revisions
    .filter(
      (candidate) => !estFaite(candidate) && candidate.dueDate > review.dueDate,
    )
    .map((candidate) => candidate.dueDate)
    .sort()

  return {
    rang: review.position,
    total: revisions.length,
    suivante: suivantes[0] ?? null,
  }
}
