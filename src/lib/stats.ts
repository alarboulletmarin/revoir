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

/** Nombre de révisions non effectuées par jour, sur les `days` prochains jours. */
export function loadForDays(
  items: Item[],
  days = 7,
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
