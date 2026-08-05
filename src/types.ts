/** Identifiant d'un des trois programmes de répétition proposés. */
export type ScheduleId = 'simple' | 'pousse' | 'ultime'

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
