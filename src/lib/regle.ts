// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Géométrie de la règle — section 8.8 du design system.
 *
 * La règle est la structure de l'écran « Aujourd'hui » : quatorze jours à
 * partir d'aujourd'hui, une graduation par jour, et la hauteur de chaque
 * graduation donne la charge de sa journée.
 *
 * **Ce n'est pas la frise.** La frise porte un axe en racine carrée où
 * l'abscisse est une échéance et l'écart entre deux graduations vaut l'écart
 * réel entre deux dates. La règle porte un axe calendaire à pas constant où
 * l'ordonnée est un effectif. Les deux se ressemblent parce qu'elles viennent
 * du même objet — une règle graduée — et elles ne se lisent pas pareil :
 * fondre les deux géométries dans un composant coûterait à la frise ce qui en
 * fait la signature (section 2).
 *
 * **Quatre niveaux, pas une échelle continue.** Une hauteur proportionnelle
 * dirait « deux fois plus » là où l'œil ne lit qu'« un peu plus », et se
 * réétalonnerait à chaque changement du maximum : la même journée à trois
 * révisions monterait ou descendrait selon ce qui l'entoure. Quatre paliers
 * fixes gardent la même journée à la même hauteur d'un jour à l'autre.
 *
 * Ce module ne produit que des nombres et des noms de palier. Le rendu vit
 * dans `components/Regle.tsx`.
 */
import type { DayLoad } from './stats'
import type { DateKey } from './dates'

/**
 * Quatorze jours : deux semaines pleines, donc le même jour de la semaine aux
 * deux bouts, et une largeur de cellule qui reste au-dessus de 20 px à 320 px.
 */
export const JOURS_REGLE = 14

/**
 * Les quatre paliers de charge. `vide` n'est pas l'absence de graduation : une
 * journée sans révision garde la sienne, courte et en `--trait`. Sans elle, la
 * règle deviendrait une suite de bâtons isolés dont on ne saurait plus compter
 * les jours qui les séparent.
 */
export type NiveauRegle = 'vide' | 'faible' | 'moyen' | 'fort'

export interface GraduationRegle {
  date: DateKey
  count: number
  niveau: NiveauRegle
  /** Le jour courant : seul à porter `--accent`, et seul à être animé. */
  estAujourdhui: boolean
  /** Cette graduation porte un repère de date sous l'axe. */
  repere: boolean
}

/**
 * Le palier d'une journée.
 *
 * Le seuil haut est à trois et non au maximum observé : au-delà de trois
 * révisions dans une journée, ce qui compte n'est plus le compte exact mais le
 * fait que la journée est chargée. Le nombre reste écrit au-dessus de la
 * graduation pour qui veut le lire.
 */
export function niveauRegle(count: number): NiveauRegle {
  if (count <= 0) return 'vide'
  if (count === 1) return 'faible'
  if (count === 2) return 'moyen'
  return 'fort'
}

/**
 * Les trois repères de date posés sous l'axe : le premier jour, le milieu, le
 * dernier.
 *
 * Trois, pas quatorze : à 320 px, quatorze dates disposeraient de vingt pixels
 * chacune. Ils sont centrés dans leur cellule et non répartis aux extrémités —
 * un repère aligné sur le bord de la règle ne désignerait aucune graduation.
 */
export function reperesRegle(jours: number): number[] {
  if (jours <= 0) return []
  if (jours <= 2) return [0]
  return [0, Math.floor(jours / 2), jours - 1]
}

/**
 * @param charge les journées à venir, dans l'ordre, telles que `loadForDays`
 *   les produit : aujourd'hui en premier.
 */
export function geometrieRegle(
  charge: DayLoad[],
  aujourdhui: DateKey,
): GraduationRegle[] {
  const reperes = new Set(reperesRegle(charge.length))

  return charge.map((jour, index) => ({
    date: jour.date,
    count: jour.count,
    niveau: niveauRegle(jour.count),
    estAujourdhui: jour.date === aujourdhui,
    repere: reperes.has(index),
  }))
}
