// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Génération d'identifiants.
 *
 * Extraite du contexte React parce que la migration et l'import de sauvegarde
 * en ont besoin sans passer par lui, et qu'elle doit rester injectable dans
 * les tests : un identifiant aléatoire ne se compare pas.
 */

/** Fabrique d'identifiants — le paramètre que les tests remplacent. */
export type NouvelId = () => string

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Une fabrique déterministe : `prefixe-1`, `prefixe-2`… Réservée aux tests et
 * à rien d'autre — deux exécutions produiraient les mêmes identifiants.
 */
export function compteur(prefixe: string): NouvelId {
  let rang = 0
  return () => {
    rang += 1
    return `${prefixe}-${rang}`
  }
}
