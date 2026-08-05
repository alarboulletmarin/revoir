import type { Programme, Review, ScheduleId } from '../types'
import { addDaysToKey, type DateKey } from './dates'

export interface Schedule {
  id: ScheduleId
  label: string
  /** Portée du programme : « sur un mois ». Complète le nombre de révisions. */
  description: string
  /** Les décalages en jours par rapport à la date de départ. */
  offsets: number[]
  /** Créé par l'utilisateur : modifiable, supprimable, exporté. */
  personnel: boolean
}

/** « J+1 · J+3 · J+7 · J+14 · J+30 » — le rythme écrit en toutes lettres. */
export function listerDecalages(offsets: number[]): string {
  return offsets.map((offset) => `J+${offset}`).join(' · ')
}

/** Bornes d'un rythme saisi à la main. Au-delà, il ne se lit plus. */
export const RYTHME_MAX_REVISIONS = 20
export const RYTHME_MAX_JOURS = 3650

const MOIS_EN_LETTRES = [
  '',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
]

/**
 * « sur un mois », « sur deux mois », « sur une année ». Dérivée du dernier
 * décalage plutôt qu'écrite à la main : un programme personnalisé se décrit
 * alors tout seul, dans les mêmes mots que les trois intégrés.
 */
export function decrirePortee(offsets: number[]): string {
  const dernier = offsets.at(-1) ?? 0
  if (dernier === 0) return 'sans échéance'
  // En deçà, arrondir au mois ment : vingt jours ne sont pas un mois. Au-delà,
  // c'est le compte exact des jours qui ne dit plus rien.
  if (dernier < 25) return `sur ${dernier} jour${dernier > 1 ? 's' : ''}`
  const mois = Math.round(dernier / 30)
  if (mois <= 1) return 'sur un mois'
  if (mois < 12) return `sur ${MOIS_EN_LETTRES[mois]} mois`
  const annees = Math.round(dernier / 365)
  return annees <= 1 ? 'sur une année' : `sur ${annees} années`
}

/**
 * Nettoie un rythme saisi librement : « 1 3 7 14 30 », « 1,3,7 » et
 * « J+1 · J+3 » donnent tous la même chose. Les nombres hors bornes et les
 * doublons tombent, le reste est trié — un programme se lit dans l'ordre.
 *
 * Le formulaire affiche le résultat sous le champ : ce qui a été écarté se
 * voit, plutôt que de disparaître en silence.
 */
export function normaliserRythme(saisie: string): number[] {
  const nombres = saisie.match(/\d+/g) ?? []
  const retenus = new Set<number>()
  for (const brut of nombres) {
    const jour = Number(brut)
    if (Number.isInteger(jour) && jour >= 1 && jour <= RYTHME_MAX_JOURS) {
      retenus.add(jour)
    }
  }
  return [...retenus].sort((a, b) => a - b).slice(0, RYTHME_MAX_REVISIONS)
}

/** Les trois programmes de la spécification. Ils ne sont jamais stockés. */
const INTEGRES: { id: ScheduleId; label: string; offsets: number[] }[] = [
  { id: 'simple', label: 'Simple', offsets: [1, 3, 7, 14, 30] },
  { id: 'pousse', label: 'Poussé', offsets: [1, 2, 4, 7, 14, 30, 60] },
  { id: 'ultime', label: 'Ultime', offsets: [1, 2, 4, 7, 14, 30, 60, 90, 180, 365] },
]

export const SCHEDULES: Schedule[] = INTEGRES.map((programme) => ({
  ...programme,
  description: decrirePortee(programme.offsets),
  personnel: false,
}))

export const DEFAULT_SCHEDULE: ScheduleId = 'simple'

/** Vrai pour les trois identifiants intégrés, et pour eux seuls. */
export function isScheduleId(value: unknown): value is ScheduleId {
  return SCHEDULES.some((schedule) => schedule.id === value)
}

/** Un programme personnalisé, présenté comme les trois intégrés. */
export function versSchedule(programme: Programme): Schedule {
  return {
    id: programme.id,
    label: programme.label,
    description: decrirePortee(programme.offsets),
    offsets: programme.offsets,
    personnel: true,
  }
}

/** Les trois intégrés, puis les programmes créés, dans l'ordre de création. */
export function tousLesProgrammes(personnels: Programme[] = []): Schedule[] {
  return [...SCHEDULES, ...personnels.map(versSchedule)]
}

export function getSchedule(id: ScheduleId, personnels: Programme[] = []): Schedule {
  const schedule = tousLesProgrammes(personnels).find(
    (candidate) => candidate.id === id,
  )
  // Une donnée importée peut porter un identifiant inconnu : on retombe sur
  // le programme par défaut plutôt que de planter l'affichage.
  return schedule ?? SCHEDULES[0]
}

export function getScheduleLabel(id: ScheduleId, personnels: Programme[] = []): string {
  return getSchedule(id, personnels).label
}

/** Les dates que produirait un programme, sans créer d'élément (prévisualisation). */
export function previewDates(
  startDate: DateKey,
  id: ScheduleId,
  personnels: Programme[] = [],
): DateKey[] {
  return getSchedule(id, personnels).offsets.map((offset) =>
    addDaysToKey(startDate, offset),
  )
}

/**
 * Les révisions que produit une suite de décalages. Séparée de `buildReviews`
 * pour que le formulaire de création d'un programme puisse prévisualiser un
 * rythme qui n'existe pas encore.
 */
export function reviewsDepuisOffsets(startDate: DateKey, offsets: number[]): Review[] {
  return offsets.map((offset) => ({
    offset,
    date: addDaysToKey(startDate, offset),
    done: false,
    doneAt: null,
  }))
}

/** Construit la liste complète des révisions d'un élément. */
export function buildReviews(
  startDate: DateKey,
  id: ScheduleId,
  personnels: Programme[] = [],
): Review[] {
  return reviewsDepuisOffsets(startDate, getSchedule(id, personnels).offsets)
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
  personnels: Programme[] = [],
): Review[] {
  const byOffset = new Map(previous.map((review) => [review.offset, review]))
  return buildReviews(startDate, id, personnels).map((review) => {
    const kept = byOffset.get(review.offset)
    if (!kept?.done) return review
    return { ...review, done: true, doneAt: kept.doneAt }
  })
}
