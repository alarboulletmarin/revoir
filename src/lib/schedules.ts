import type { Review, ScheduleId } from '../types'
import { addDaysToKey, type DateKey } from './dates'

export interface Schedule {
  id: ScheduleId
  label: string
  /** Portée du programme : « sur un mois ». Complète le nombre de révisions. */
  description: string
  /** Les décalages en jours par rapport à la date de départ. */
  offsets: number[]
}

/** « J+1 · J+3 · J+7 · J+14 · J+30 » — le rythme écrit en toutes lettres. */
export function listerDecalages(offsets: number[]): string {
  return offsets.map((offset) => `J+${offset}`).join(' · ')
}

export const SCHEDULES: Schedule[] = [
  {
    id: 'simple',
    label: 'Simple',
    description: 'sur un mois',
    offsets: [1, 3, 7, 14, 30],
  },
  {
    id: 'pousse',
    label: 'Poussé',
    description: 'sur deux mois',
    offsets: [1, 2, 4, 7, 14, 30, 60],
  },
  {
    id: 'ultime',
    label: 'Ultime',
    description: 'sur une année',
    offsets: [1, 2, 4, 7, 14, 30, 60, 90, 180, 365],
  },
]

export const DEFAULT_SCHEDULE: ScheduleId = 'simple'

export function isScheduleId(value: unknown): value is ScheduleId {
  return SCHEDULES.some((schedule) => schedule.id === value)
}

export function getSchedule(id: ScheduleId): Schedule {
  const schedule = SCHEDULES.find((candidate) => candidate.id === id)
  // Une donnée importée peut porter un identifiant inconnu : on retombe sur
  // le programme par défaut plutôt que de planter l'affichage.
  return schedule ?? SCHEDULES[0]
}

export function getScheduleLabel(id: ScheduleId): string {
  return getSchedule(id).label
}

/** Les dates que produirait un programme, sans créer d'élément (prévisualisation). */
export function previewDates(startDate: DateKey, id: ScheduleId): DateKey[] {
  return getSchedule(id).offsets.map((offset) => addDaysToKey(startDate, offset))
}

/** Construit la liste complète des révisions d'un élément. */
export function buildReviews(startDate: DateKey, id: ScheduleId): Review[] {
  return getSchedule(id).offsets.map((offset) => ({
    offset,
    date: addDaysToKey(startDate, offset),
    done: false,
    doneAt: null,
  }))
}

/**
 * Reconstruit les révisions après modification d'un élément, en conservant
 * l'état « effectuée » des révisions dont le décalage existe encore dans le
 * nouveau programme.
 */
export function rebuildReviews(
  startDate: DateKey,
  id: ScheduleId,
  previous: Review[],
): Review[] {
  const byOffset = new Map(previous.map((review) => [review.offset, review]))
  return buildReviews(startDate, id).map((review) => {
    const kept = byOffset.get(review.offset)
    if (!kept?.done) return review
    return { ...review, done: true, doneAt: kept.doneAt }
  })
}
