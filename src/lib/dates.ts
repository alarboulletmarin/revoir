// SPDX-License-Identifier: AGPL-3.0-only

import { addDays, differenceInCalendarDays, format, parse } from 'date-fns'
import { localeActive, textes } from '../i18n'

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

/**
 * Les gabarits viennent du dictionnaire, pas du code.
 *
 * Une date n'est pas la même chaîne traduite d'une langue à l'autre : le
 * français écrit « 14 mars 2026 », l'anglais « March 14, 2026 ». C'est l'ordre
 * des champs qui change, pas seulement les mots — un gabarit unique arroserait
 * de virgules la moitié des langues et en priverait l'autre.
 */
function formater(date: Date, gabarit: string): string {
  return format(date, gabarit, { locale: localeActive() })
}

/** « 14 mars 2026 » · « March 14, 2026 » */
export function formatLong(key: DateKey): string {
  return formater(fromKey(key), textes().dates.long)
}

/**
 * « vendredi 21 août » · « Friday, August 21 » — le jour en toutes lettres,
 * sans son année.
 *
 * C'est le sur-titre de l'écran « Aujourd'hui » et le titre de la page du
 * jour : à cet endroit, l'année n'apprend rien, et le nom du jour est
 * justement ce qu'on vient vérifier.
 */
export function formatJourLong(key: DateKey): string {
  return formater(fromKey(key), textes().dates.jourLong)
}

/** « sam. 14 mars » · « Sat, Mar 14 » */
export function formatShort(key: DateKey): string {
  return formater(fromKey(key), textes().dates.court)
}

/** « 14/03 » · « 03/14 » */
export function formatCompact(key: DateKey): string {
  return formater(fromKey(key), textes().dates.compact)
}

/**
 * « 8 août » — la date sans son année, tant qu'elle tombe dans celle de
 * `reference`. Un programme « Ultime » va jusqu'à J+365 : au-delà du
 * changement d'année, l'année revient, sans quoi « 8 août » désignerait deux
 * jours différents dans la même liste.
 */
export function formatEcheance(key: DateKey, reference: DateKey): string {
  const memeAnnee = key.slice(0, 4) === reference.slice(0, 4)
  const { echeance, echeanceAnnee } = textes().dates
  return formater(fromKey(key), memeAnnee ? echeance : echeanceAnnee)
}

/** « mars 2026 » · « March 2026 » */
export function formatMonth(date: Date): string {
  return formater(date, textes().dates.mois)
}

/**
 * « mars » et « 2026 », séparément.
 *
 * L'en-tête du calendrier les compose lui-même : le mois porte la voix de
 * l'écran, l'année l'accompagne en chiffres. Un seul gabarit les aurait rendus
 * de même poids, et l'ordre des deux change avec la langue.
 */
export function formatMoisSeul(date: Date): string {
  return formater(date, textes().dates.moisSeul)
}

export function formatAnnee(date: Date): string {
  return formater(date, textes().dates.annee)
}

/**
 * Libellé relatif court : « aujourd'hui », « demain », « il y a 3 jours »,
 * « dans 12 jours ».
 */
export function formatRelative(key: DateKey, today: DateKey = todayKey()): string {
  const { relatif } = textes().dates
  const diff = daysBetween(today, key)
  if (diff === 0) return relatif.aujourdhui
  if (diff === 1) return relatif.demain
  if (diff === -1) return relatif.hier
  if (diff < 0) return relatif.passe(-diff)
  return relatif.futur(diff)
}

/** Formate un horodatage ISO en date longue, ou null si la valeur est invalide. */
export function formatIsoDate(iso: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return formater(date, textes().dates.long)
}

/**
 * Le premier jour de la semaine, dans la langue active — lundi en français,
 * dimanche en anglais.
 *
 * Rendu sous la forme qu'attendent `startOfWeek` et `endOfWeek` : la grille du
 * calendrier, ses touches Origine et Fin, et la rangée d'initiales en tirent
 * tous le même début, et ne peuvent donc pas se désaccorder d'un jour.
 */
export function debutSemaine(): { weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 } {
  return { weekStartsOn: textes().dates.debutSemaine as 0 | 1 }
}
