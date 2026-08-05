// SPDX-License-Identifier: AGPL-3.0-only

import { addDays, differenceInCalendarDays, format, parse } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Les dates sont manipulées comme des chaînes 'yyyy-MM-dd' interprétées en
 * heure locale. On évite ainsi les décalages d'un jour que provoquerait un
 * aller-retour par l'UTC (`new Date('2026-01-01')` est minuit UTC).
 */
export type DateKey = string

const KEY_FORMAT = 'yyyy-MM-dd'

/** Convertit une Date en clé 'yyyy-MM-dd' locale. */
export function toKey(date: Date): DateKey {
  return format(date, KEY_FORMAT)
}

/** Convertit une clé 'yyyy-MM-dd' en Date locale à minuit. */
export function fromKey(key: DateKey): Date {
  return parse(key, KEY_FORMAT, new Date())
}

/** La date du jour, en clé locale. */
export function todayKey(): DateKey {
  return toKey(new Date())
}

/**
 * Millisecondes avant le prochain minuit local.
 *
 * L'application est installable : elle passe la nuit ouverte sur un téléphone
 * posé sur une table. Sans réveil, « aujourd'hui » resterait la veille au
 * matin — mauvaise date en tête de page, mauvaise liste du jour, retard
 * inventé. C'est ce nombre qui arme le minuteur.
 *
 * Une seconde de marge : un minuteur réveillé à 23:59:59,998 relirait encore
 * la veille, puis se reprogrammerait pour deux millisecondes.
 */
export function msAvantMinuit(maintenant: Date = new Date()): number {
  const minuit = new Date(maintenant)
  minuit.setHours(24, 0, 0, 0)
  return minuit.getTime() - maintenant.getTime() + 1000
}

/** Décale une clé de `days` jours. */
export function addDaysToKey(key: DateKey, days: number): DateKey {
  return toKey(addDays(fromKey(key), days))
}

/** Nombre de jours calendaires entre deux clés (positif si `key` est après `from`). */
export function daysBetween(from: DateKey, key: DateKey): number {
  return differenceInCalendarDays(fromKey(key), fromKey(from))
}

export function isToday(key: DateKey, today: DateKey = todayKey()): boolean {
  return key === today
}

export function isPast(key: DateKey, today: DateKey = todayKey()): boolean {
  return key < today
}

export function isFuture(key: DateKey, today: DateKey = todayKey()): boolean {
  return key > today
}

/** « 14 mars 2026 » */
export function formatLong(key: DateKey): string {
  return format(fromKey(key), 'd MMMM yyyy', { locale: fr })
}

/** « sam. 14 mars » */
export function formatShort(key: DateKey): string {
  return format(fromKey(key), 'EEE d MMM', { locale: fr })
}

/** « 14/03 » */
export function formatCompact(key: DateKey): string {
  return format(fromKey(key), 'dd/MM', { locale: fr })
}

/**
 * « 8 août » — la date sans son année, tant qu'elle tombe dans celle de
 * `reference`. Un programme « Ultime » va jusqu'à J+365 : au-delà du
 * changement d'année, l'année revient, sans quoi « 8 août » désignerait deux
 * jours différents dans la même liste.
 */
export function formatEcheance(key: DateKey, reference: DateKey): string {
  const memeAnnee = key.slice(0, 4) === reference.slice(0, 4)
  return format(fromKey(key), memeAnnee ? 'd MMMM' : 'd MMMM yyyy', { locale: fr })
}

/** « mars 2026 » */
export function formatMonth(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: fr })
}

/**
 * Libellé relatif court : « aujourd'hui », « demain », « il y a 3 jours »,
 * « dans 12 jours ».
 */
export function formatRelative(key: DateKey, today: DateKey = todayKey()): string {
  const diff = daysBetween(today, key)
  if (diff === 0) return "aujourd'hui"
  if (diff === 1) return 'demain'
  if (diff === -1) return 'hier'
  if (diff < 0) return `il y a ${-diff} jours`
  return `dans ${diff} jours`
}

/** Formate un horodatage ISO en date longue, ou null si la valeur est invalide. */
export function formatIsoDate(iso: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return format(date, 'd MMMM yyyy', { locale: fr })
}
