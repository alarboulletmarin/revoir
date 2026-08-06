// SPDX-License-Identifier: AGPL-3.0-only

import type { Programme, Review, ScheduleId, ScheduleIdIntegre } from '../types'
import { textes } from '../i18n'
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
  const { decalage } = textes().programmes
  return offsets.map(decalage).join(' · ')
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
  const { ecartAnnees, ecartMois, ecartSemaines, ecartJours } = textes().programmes
  if (jours >= 365 && jours % 365 === 0) return ecartAnnees(jours / 365)
  if (jours >= 30 && jours % 30 === 0) return ecartMois(jours / 30)
  if (jours >= 7 && jours % 7 === 0) return ecartSemaines(jours / 7)
  return ecartJours(jours)
}

/**
 * Le même écart, écrit en entier pour les lecteurs d'écran. Toujours en jours :
 * c'est l'unité qui ne demande aucune conversion mentale.
 */
export function decrireEcart(jours: number): string {
  return textes().programmes.ecartComplet(jours)
}

/**
 * « sur un mois », « sur deux mois », « sur une année ». Dérivée du dernier
 * décalage plutôt qu'écrite à la main : un programme personnalisé se décrit
 * alors tout seul, dans les mêmes mots que les trois intégrés.
 */
export function decrirePortee(offsets: number[]): string {
  const { porteeVide, porteeJours, porteeMois, porteeAnnees } = textes().programmes
  const dernier = offsets.at(-1) ?? 0
  if (dernier === 0) return porteeVide
  // En deçà, arrondir au mois ment : vingt jours ne sont pas un mois. Au-delà,
  // c'est le compte exact des jours qui ne dit plus rien.
  if (dernier < 25) return porteeJours(dernier)
  const mois = Math.round(dernier / 30)
  if (mois < 12) return porteeMois(mois)
  return porteeAnnees(Math.round(dernier / 365))
}

/** Les trois programmes de la spécification. Ils ne sont jamais stockés. */
const INTEGRES: { id: ScheduleIdIntegre; offsets: number[] }[] = [
  { id: 'simple', offsets: [1, 3, 7, 14, 30] },
  { id: 'pousse', offsets: [1, 2, 4, 7, 14, 30, 60] },
  { id: 'ultime', offsets: [1, 2, 4, 7, 14, 30, 60, 90, 180, 365] },
]

/**
 * Le nom et la portée sont des **accesseurs**, pas des chaînes figées.
 *
 * `SCHEDULES` est construit une fois, à l'import du module — bien avant que la
 * langue de l'interface ne soit connue. Un `label` calculé là serait celui du
 * français, pour toute la session. Les lire à l'accès les fait suivre la langue
 * sans qu'aucun appelant ait à changer : ils restent des propriétés.
 */
export const SCHEDULES: Schedule[] = INTEGRES.map((programme) => ({
  id: programme.id,
  offsets: programme.offsets,
  personnel: false,
  get label() {
    return textes().programmes.integres[programme.id]
  },
  get description() {
    return decrirePortee(programme.offsets)
  },
}))

export const DEFAULT_SCHEDULE: ScheduleId = 'simple'

/** Vrai pour les trois identifiants intégrés, et pour eux seuls. */
export function isScheduleId(value: unknown): value is ScheduleId {
  return SCHEDULES.some((schedule) => schedule.id === value)
}

/**
 * Un programme personnalisé, présenté comme les trois intégrés. Son nom vient
 * de l'utilisateur et ne se traduit pas ; sa portée, elle, est dérivée, donc
 * lue à l'accès comme celle des intégrés.
 */
export function versSchedule(programme: Programme): Schedule {
  return {
    id: programme.id,
    label: programme.label,
    offsets: programme.offsets,
    personnel: true,
    get description() {
      return decrirePortee(programme.offsets)
    },
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
