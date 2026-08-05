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
 */

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

export type Teinte = (typeof TEINTES)[number]

/** Libellés affichés dans le sélecteur, pour que la couleur soit nommable. */
export const NOM_TEINTE: Record<Teinte, string> = {
  ardoise: 'Ardoise',
  prune: 'Prune',
  olive: 'Olive',
  terre: 'Terre',
  bleu: 'Bleu',
  teal: 'Sarcelle',
  mauve: 'Mauve',
  ocre: 'Ocre',
}

export function estTeinte(valeur: unknown): valeur is Teinte {
  return typeof valeur === 'string' && (TEINTES as readonly string[]).includes(valeur)
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
export function teinteParDefaut(nom: string): Teinte {
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
