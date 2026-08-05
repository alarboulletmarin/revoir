import type { Programme, Review, ScheduleId } from '../types'
import { addDaysToKey, type DateKey } from './dates'
import { newId, type NouvelId } from './ids'

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

/** Bornes d'un rythme. Au-delà, il ne se lit plus. */
export const RYTHME_MAX_REVISIONS = 20
export const RYTHME_MAX_JOURS = 3650

/**
 * Les échéances proposées à la construction d'un rythme.
 *
 * Ce n'est pas une liste de nombres arbitraires : ce sont les écarts qui se
 * disent en français d'un mot — six jours, une semaine, dix jours, deux
 * semaines, un mois, trois mois, un an. Un rythme se compose en touchant des
 * graduations, comme on lit une règle ; personne n'a à taper « 1 3 7 14 30 ».
 *
 * Un rythme importé peut porter un écart absent de cette échelle : il reste
 * modifiable, sa graduation vient simplement s'ajouter à sa place.
 */
export const ECHELLE_RYTHME = [
  1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 30, 60, 90, 120, 180, 270, 365,
]

/**
 * L'écart en toutes lettres, dans son unité naturelle : « 1 sem. » plutôt que
 * « 7 j », « 3 mois » plutôt que « 90 j ». C'est le libellé des graduations.
 */
export function nommerEcart(jours: number): string {
  if (jours >= 365 && jours % 365 === 0) {
    const annees = jours / 365
    return annees === 1 ? '1 an' : `${annees} ans`
  }
  if (jours >= 30 && jours % 30 === 0) return `${jours / 30} mois`
  if (jours >= 7 && jours % 7 === 0) {
    const semaines = jours / 7
    return semaines === 1 ? '1 sem.' : `${semaines} sem.`
  }
  return `${jours} j`
}

/**
 * Le même écart, écrit en entier pour les lecteurs d'écran. Toujours en jours :
 * c'est l'unité qui ne demande aucune conversion mentale.
 */
export function decrireEcart(jours: number): string {
  return `${jours} jour${jours > 1 ? 's' : ''} après le départ`
}

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

/** Les dates que produirait un programme, sans créer de sujet (prévisualisation). */
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
 * rythme qui n'existe pas encore — d'où le sujet fictif que la
 * prévisualisation lui passe.
 *
 * `position` vient du rang dans le rythme, pas du décalage : c'est lui qui
 * ordonne les révisions une fois qu'elles vivent dans leur propre table, où
 * rien ne garantit l'ordre de lecture.
 */
export function reviewsDepuisOffsets(
  topicId: string,
  startDate: DateKey,
  offsets: number[],
  nouvelId: NouvelId = newId,
): Review[] {
  return offsets.map((intervalInDays, index) => ({
    id: nouvelId(),
    topicId,
    position: index + 1,
    intervalInDays,
    dueDate: addDaysToKey(startDate, intervalInDays),
    completedAt: null,
  }))
}

/** Construit la liste complète des révisions d'un sujet. */
export function buildReviews(
  topicId: string,
  startDate: DateKey,
  id: ScheduleId,
  personnels: Programme[] = [],
  nouvelId: NouvelId = newId,
): Review[] {
  return reviewsDepuisOffsets(
    topicId,
    startDate,
    getSchedule(id, personnels).offsets,
    nouvelId,
  )
}

/**
 * Reconstruit les révisions après modification d'un sujet, en conservant la
 * validation des révisions dont le décalage existe encore dans le nouveau
 * programme.
 *
 * Leur identifiant est conservé avec elles : une révision qui traverse une
 * modification reste la même ligne, et les écrans qui la désignaient ne
 * pointent pas dans le vide.
 */
export function rebuildReviews(
  topicId: string,
  startDate: DateKey,
  id: ScheduleId,
  previous: Review[],
  personnels: Programme[] = [],
  nouvelId: NouvelId = newId,
): Review[] {
  const parIntervalle = new Map(
    previous.map((review) => [review.intervalInDays, review]),
  )
  return buildReviews(topicId, startDate, id, personnels, nouvelId).map((review) => {
    const gardee = parIntervalle.get(review.intervalInDays)
    if (!gardee) return review
    return { ...review, id: gardee.id, completedAt: gardee.completedAt }
  })
}
