// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Les deux langues de l'application, et la langue active.
 *
 * **Une langue est active à la fois, pour tout l'onglet.** Elle vit donc dans
 * ce module plutôt que d'être portée en argument à travers une quinzaine de
 * fonctions pures — `formatLong`, `nommerEcart`, `resumeCategorie` — qui n'ont
 * rien à décider et se contenteraient de la faire suivre. C'est le seul état
 * global du projet, et il est écrit à un seul endroit : `PreferencesProvider`.
 *
 * Les composants, eux, ne lisent pas `textes()` : ils passent par `useTextes()`,
 * qui les abonne au changement. Ce module sert les modules `lib/`, qui ne sont
 * pas des composants et n'ont personne à réveiller.
 *
 * Le français est le dictionnaire de référence : `Dictionnaire` vaut sa forme,
 * et l'anglais ne compile que s'il la respecte au champ près.
 */
import type { Locale } from 'date-fns'
import { enUS, fr as frLocale } from 'date-fns/locale'
import { fr } from './fr'
import { en } from './en'

export type Dictionnaire = typeof fr

export type Langue = 'fr' | 'en'

/** Dans l'ordre où le sélecteur des réglages les propose. */
export const LANGUES: Langue[] = ['fr', 'en']

const DICTIONNAIRES: Record<Langue, Dictionnaire> = { fr, en }

/** Les locales date-fns correspondantes : noms de mois, de jours, ordinaux. */
const LOCALES: Record<Langue, Locale> = { fr: frLocale, en: enUS }

/**
 * Le français par défaut, et non l'anglais : c'est la langue d'origine de
 * l'application, celle de ses tests et celle que le document sert avant que
 * React n'ait choisi.
 */
let courante: Langue = 'fr'

export function estLangue(valeur: unknown): valeur is Langue {
  return valeur === 'fr' || valeur === 'en'
}

export function langueActive(): Langue {
  return courante
}

/** Le dictionnaire de la langue active. */
export function textes(): Dictionnaire {
  return DICTIONNAIRES[courante]
}

/** La locale date-fns de la langue active. */
export function localeActive(): Locale {
  return LOCALES[courante]
}

/**
 * Change la langue active. Idempotent : appelé à chaque rendu du fournisseur
 * de préférences, il ne fait rien tant que la langue n'a pas bougé.
 */
export function definirLangueActive(langue: Langue): void {
  courante = langue
}

/**
 * La langue que le navigateur réclame, si l'application la parle.
 *
 * `navigator.languages` d'abord : quelqu'un dont le système est en espagnol
 * mais qui a listé le français en second préfère le français à l'anglais par
 * défaut. Le premier de la liste que l'on sait rendre l'emporte.
 */
export function langueDuNavigateur(): Langue {
  if (typeof navigator === 'undefined') return 'fr'
  const demandees = navigator.languages ?? [navigator.language]
  for (const demandee of demandees) {
    const base = demandee.split('-')[0]?.toLowerCase()
    if (estLangue(base)) return base
  }
  return 'fr'
}

/**
 * Comparaison de chaînes dans la langue active — tri des catégories, des
 * sujets, des groupes. `localeCompare` sans étiquette suivrait la locale du
 * navigateur, qui n'est pas forcément celle de l'interface : deux appareils
 * afficheraient alors la même liste dans deux ordres.
 */
export function comparerTextes(a: string, b: string): number {
  return a.localeCompare(b, courante)
}
