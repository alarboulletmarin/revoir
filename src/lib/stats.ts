import type { Item, ReviewEntry } from '../types'
import { addDaysToKey, type DateKey, todayKey } from './dates'

export interface Stats {
  activeItems: number
  archivedItems: number
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

export function activeItems(items: Item[]): Item[] {
  return items.filter((item) => !item.archived)
}

export function archivedItems(items: Item[]): Item[] {
  return items.filter((item) => item.archived)
}

/** Toutes les révisions des éléments actifs, à plat, triées par date. */
export function allEntries(items: Item[]): ReviewEntry[] {
  const entries: ReviewEntry[] = []
  for (const item of activeItems(items)) {
    for (const review of item.reviews) {
      entries.push({ item, review })
    }
  }
  return sortEntries(entries)
}

function sortEntries(entries: ReviewEntry[]): ReviewEntry[] {
  return entries.sort((a, b) => {
    if (a.review.date !== b.review.date) return a.review.date < b.review.date ? -1 : 1
    return a.item.title.localeCompare(b.item.title, 'fr')
  })
}

/** Révisions non effectuées dont la date est passée. */
export function overdueEntries(items: Item[], today: DateKey = todayKey()): ReviewEntry[] {
  return allEntries(items).filter(
    (entry) => !entry.review.done && entry.review.date < today,
  )
}

/** Révisions du jour, effectuées ou non. */
export function todayEntries(items: Item[], today: DateKey = todayKey()): ReviewEntry[] {
  return allEntries(items).filter((entry) => entry.review.date === today)
}

/** Prochaines révisions à venir, hors aujourd'hui. */
export function upcomingEntries(
  items: Item[],
  limit = 8,
  today: DateKey = todayKey(),
): ReviewEntry[] {
  return allEntries(items)
    .filter((entry) => !entry.review.done && entry.review.date > today)
    .slice(0, limit)
}

/** Révisions tombant un jour donné, éléments archivés exclus. */
export function entriesForDate(items: Item[], date: DateKey): ReviewEntry[] {
  return allEntries(items).filter((entry) => entry.review.date === date)
}

/**
 * Nombre de révisions non effectuées par jour, sur les `days` prochains jours.
 * 14 par défaut : c'est le nombre de barres de la cellule « charge »
 * (section 8.8 du design system).
 */
export function loadForDays(
  items: Item[],
  days = 14,
  today: DateKey = todayKey(),
): DayLoad[] {
  const counts = new Map<DateKey, number>()
  for (let offset = 0; offset < days; offset += 1) {
    counts.set(addDaysToKey(today, offset), 0)
  }
  for (const entry of allEntries(items)) {
    if (entry.review.done) continue
    const current = counts.get(entry.review.date)
    if (current !== undefined) {
      counts.set(entry.review.date, current + 1)
    }
  }
  return [...counts.entries()].map(([date, count]) => ({ date, count }))
}

/**
 * Charge déjà planifiée sur des dates données — règle métier n°4.
 *
 * C'est ce qui différencie l'aperçu du formulaire d'un simple générateur de
 * dates : avant de créer un élément, on voit que le 14 mars porte déjà cinq
 * révisions. `exclureId` sert à la modification, pour que l'élément en cours
 * d'édition ne se compte pas lui-même.
 */
export function chargeParDate(
  items: Item[],
  dates: DateKey[],
  exclureId?: string,
): Map<DateKey, number> {
  const charge = new Map<DateKey, number>(dates.map((date) => [date, 0]))
  for (const item of activeItems(items)) {
    if (item.id === exclureId) continue
    for (const review of item.reviews) {
      if (review.done) continue
      const actuelle = charge.get(review.date)
      if (actuelle !== undefined) charge.set(review.date, actuelle + 1)
    }
  }
  return charge
}

/**
 * Premier jour à venir portant au moins une révision, avec son effectif.
 * Alimente la deuxième ligne de l'état vide : « Prochaine révision : jeudi
 * 6 août, 3 éléments. » (section 8.9)
 */
export function nextReviewDay(
  items: Item[],
  today: DateKey = todayKey(),
): DayLoad | null {
  const next = allEntries(items).find(
    (entry) => !entry.review.done && entry.review.date > today,
  )
  if (!next) return null
  const date = next.review.date
  return { date, count: entriesForDate(items, date).filter((e) => !e.review.done).length }
}

export function computeStats(items: Item[], today: DateKey = todayKey()): Stats {
  const active = activeItems(items)
  let done = 0
  let total = 0
  for (const item of active) {
    for (const review of item.reviews) {
      total += 1
      if (review.done) done += 1
    }
  }
  return {
    activeItems: active.length,
    archivedItems: items.length - active.length,
    doneReviews: done,
    remainingReviews: total - done,
    todayReviews: todayEntries(items, today).filter((entry) => !entry.review.done).length,
    overdueReviews: overdueEntries(items, today).length,
    progress: total === 0 ? 0 : Math.round((done / total) * 100),
  }
}

/** Où en est une révision dans le programme de son élément. */
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
 * feuille du calendrier — c'est ce texte qui la remplace.
 *
 * `suivante` se calcule par le minimum plutôt que par le premier trouvé : le
 * recalage après retard réécrit les dates, et rien ne garantit qu'elles
 * restent croissantes dans le tableau.
 */
export function progressionEntree(entry: ReviewEntry): ProgressionEntree {
  const { item, review } = entry
  const suivantes = item.reviews
    .filter((candidate) => !candidate.done && candidate.date > review.date)
    .map((candidate) => candidate.date)
    .sort()

  return {
    rang: item.reviews.findIndex((candidate) => candidate.offset === review.offset) + 1,
    total: item.reviews.length,
    suivante: suivantes[0] ?? null,
  }
}

/** Progression d'un élément isolé, de 0 à 100. */
export function itemProgress(item: Item): number {
  if (item.reviews.length === 0) return 0
  const done = item.reviews.filter((review) => review.done).length
  return Math.round((done / item.reviews.length) * 100)
}

/** Catégories présentes dans les données, triées alphabétiquement. */
export function usedCategories(items: Item[]): string[] {
  const set = new Set<string>()
  for (const item of items) {
    if (item.category.trim()) set.add(item.category.trim())
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
}
