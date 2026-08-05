/** Identifiant d'un des trois programmes intégrés. */
export type ScheduleIdIntegre = 'simple' | 'pousse' | 'ultime'

/**
 * Identifiant du programme d'un élément : l'un des trois intégrés, ou celui
 * d'un programme créé par l'utilisateur. Ce n'est donc plus une union fermée —
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
 * Une révision planifiée.
 *
 * `date` est l'échéance courante, pas une valeur figée : valider une révision
 * en retard recale les échéances suivantes sur la date réelle de validation
 * (voir `lib/recalage.ts`). `doneAt` conserve, lui, le moment exact de la
 * validation — c'est de lui que la frise tire la position d'une graduation
 * faite, pour montrer le rythme réel et non le rythme prévu.
 */
export interface Review {
  /** Nombre de jours après la date de départ (le « n » de J+n). */
  offset: number
  /** Échéance courante, au format 'yyyy-MM-dd'. */
  date: string
  done: boolean
  /** Horodatage ISO du moment où la révision a été cochée, sinon null. */
  doneAt: string | null
}

/** Un élément à réviser. Ne contient jamais le contenu à apprendre. */
export interface Item {
  id: string
  title: string
  category: string
  /** Date de départ, au format 'yyyy-MM-dd'. */
  startDate: string
  schedule: ScheduleId
  reviews: Review[]
  archived: boolean
  /** Horodatage ISO. */
  createdAt: string
  /** Horodatage ISO. */
  updatedAt: string
}

/** Une révision accompagnée de l'élément auquel elle appartient. */
export interface ReviewEntry {
  item: Item
  review: Review
}
