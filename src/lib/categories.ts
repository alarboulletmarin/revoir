/**
 * Teintes de matière.
 *
 * Une catégorie n'est pas une entité : c'est une chaîne libre portée par
 * chaque élément. La couleur, elle, doit être commune à tous les éléments
 * d'une même matière — elle vit donc à part, dans sa propre table.
 *
 * Aucune couleur n'est obligatoire : une matière jamais configurée reçoit une
 * teinte dérivée de son nom. Deux appareils qui n'ont jamais échangé
 * affichent ainsi « Mathématiques » de la même couleur, et la table ne
 * contient que les choix explicites de l'utilisateur.
 *
 * Une matière peut aussi porter n'importe quelle couleur, en dehors des huit.
 * Elle est retenue telle quelle : `lib/couleurs.ts` ne fait qu'écarter
 * l'invisible et dériver la couleur d'encre qui rendra le libellé lisible.
 */
import {
  couleurRetenue,
  estCouleurPersonnalisee,
  type CouleurPersonnalisee,
} from './couleurs'

export const TEINTES = [
  'ardoise',
  'prune',
  'olive',
  'terre',
  'bleu',
  'teal',
  'mauve',
  'ocre',
] as const

/** Une des huit teintes de la palette, désignée par son nom. */
export type TeinteNommee = (typeof TEINTES)[number]

/** Ce qu'une matière peut porter : une des huit, ou une couleur libre. */
export type Teinte = TeinteNommee | CouleurPersonnalisee

/** Libellés affichés dans le sélecteur, pour que la couleur soit nommable. */
export const NOM_TEINTE: Record<TeinteNommee, string> = {
  ardoise: 'Ardoise',
  prune: 'Prune',
  olive: 'Olive',
  terre: 'Terre',
  bleu: 'Bleu',
  teal: 'Sarcelle',
  mauve: 'Mauve',
  ocre: 'Ocre',
}

export function estTeinteNommee(valeur: unknown): valeur is TeinteNommee {
  return typeof valeur === 'string' && (TEINTES as readonly string[]).includes(valeur)
}

export function estTeinte(valeur: unknown): valeur is Teinte {
  return estTeinteNommee(valeur) || estCouleurPersonnalisee(valeur)
}

/**
 * La couleur libre d'une teinte, ou null pour l'une des huit — celles-ci
 * passent par leur variable CSS, pas par une valeur en dur.
 */
export function couleurLibre(teinte: Teinte): CouleurPersonnalisee | null {
  return estCouleurPersonnalisee(teinte) ? teinte : null
}

/**
 * Le point de passage unique d'une couleur : sélecteur, import et migration
 * l'empruntent tous. Une couleur libre en ressort telle qu'elle a été
 * choisie, sauf si elle est invisible sur le papier.
 */
export function retenirTeinte(valeur: string): Teinte | null {
  if (estTeinteNommee(valeur)) return valeur
  if (estCouleurPersonnalisee(valeur)) return couleurRetenue(valeur)
  return null
}

/**
 * Deux matières écrites différemment (« maths », « Maths ») sont la même.
 * La casse d'origine reste affichée, seule la clé est normalisée.
 */
export function cleCategorie(nom: string): string {
  return nom.trim().toLocaleLowerCase('fr')
}

/**
 * Teinte dérivée du nom. Hachage FNV-1a : court, stable d'une exécution à
 * l'autre, et surtout identique d'un appareil à l'autre — ce que ne garantit
 * pas un simple `hashCode` dépendant de l'ordre d'insertion.
 */
export function teinteParDefaut(nom: string): TeinteNommee {
  const cle = cleCategorie(nom)
  let hachage = 0x811c9dc5
  for (let index = 0; index < cle.length; index += 1) {
    hachage ^= cle.charCodeAt(index)
    hachage = Math.imul(hachage, 0x01000193) >>> 0
  }
  return TEINTES[hachage % TEINTES.length]
}

/** Choix explicites de l'utilisateur, indexés par clé de catégorie. */
export type Teintes = Record<string, Teinte>

export function teinteDe(nom: string, teintes: Teintes): Teinte {
  return teintes[cleCategorie(nom)] ?? teinteParDefaut(nom)
}
