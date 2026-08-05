// SPDX-License-Identifier: AGPL-3.0-only

import type { Teinte } from './lib/categories'

/** Identifiant d'un des trois programmes intégrés. */
export type ScheduleIdIntegre = 'simple' | 'pousse' | 'ultime'

/**
 * Identifiant du programme d'un sujet : l'un des trois intégrés, ou celui
 * d'un programme créé par l'utilisateur. Ce n'est donc pas une union fermée —
 * un identifiant se résout contre les programmes connus, il ne se devine pas.
 */
export type ScheduleId = string

/**
 * Un rythme créé par l'utilisateur. Les trois programmes intégrés ont la même
 * forme, mais ne sont pas stockés : ils sont dans le code.
 */
export interface Programme {
  id: string
  label: string
  /** Décalages en jours, strictement croissants, à partir de 1. */
  offsets: number[]
  /** Horodatage ISO. */
  createdAt: string
}

/**
 * Un regroupement de sujets. L'interface dit « catégorie » — c'est le mot du
 * champ que l'utilisateur remplit, et désormais celui du modèle.
 *
 * La couleur appartient à la catégorie, pas au sujet : la changer quelque part
 * la change partout. `tint` à null n'est pas une absence de couleur, c'est une
 * absence de *choix* — la catégorie reçoit alors la teinte dérivée de son nom,
 * identique d'un appareil à l'autre, sans qu'aucun réglage soit nécessaire.
 */
export interface Category {
  id: string
  name: string
  /** Choix explicite de l'utilisateur, sinon null. */
  tint: Teinte | null
  /** Horodatage ISO. */
  createdAt: string
  /** Horodatage ISO. */
  updatedAt: string
}

/**
 * Où en est la pratique d'un sujet. Elle n'a pas d'échéance : c'est un état,
 * pas une date. Le libellé varie avec le domaine — exercices pour un cours,
 * répétition pour le piano, série de questions pour le code de la route — mais
 * les trois états, eux, se disent partout pareil.
 */
export type PracticeStatus = 'todo' | 'in_progress' | 'done'

export type TopicStatus = 'active' | 'archived'

/** Ce que l'utilisateur veut revoir. Ne contient jamais le contenu à apprendre. */
export interface Topic {
  id: string
  /**
   * La catégorie du sujet, ou null. Null n'est pas une catégorie nommée
   * « Sans catégorie » : une vraie ligne serait renommable et supprimable, et
   * il faudrait la défendre. C'est l'affichage qui regroupe les orphelins.
   */
  categoryId: string | null
  title: string
  /** Date de départ, au format 'yyyy-MM-dd'. */
  startDate: string
  scheduleId: ScheduleId
  practiceStatus: PracticeStatus
  status: TopicStatus
  /** Horodatage ISO. */
  createdAt: string
  /** Horodatage ISO. */
  updatedAt: string
}

/**
 * Une révision planifiée.
 *
 * `dueDate` est l'échéance courante, pas une valeur figée : valider une
 * révision en retard recale les échéances suivantes sur la date réelle de
 * validation (voir `lib/recalage.ts`). `completedAt` conserve, lui, le moment
 * exact de la validation — c'est de lui que la frise tire la position d'une
 * graduation faite, pour montrer le rythme réel et non le rythme prévu.
 *
 * Une révision est faite si et seulement si `completedAt` n'est pas null. Il
 * n'y a pas de drapeau à côté qui pourrait le contredire.
 */
export interface Review {
  id: string
  topicId: string
  /** Rang dans le programme, à partir de 1. Le « 3 » de « Révision 3 sur 5 ». */
  position: number
  /** Nombre de jours après la date de départ : le « n » de J+n. */
  intervalInDays: number
  /** Échéance courante, au format 'yyyy-MM-dd'. */
  dueDate: string
  /** Horodatage ISO de la validation, sinon null. */
  completedAt: string | null
}

/** Une révision accompagnée du sujet auquel elle appartient. */
export interface ReviewEntry {
  topic: Topic
  review: Review
}
