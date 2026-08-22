// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Catégories et teintes.
 *
 * Une catégorie est une entité, et elle se gère comme telle : on la crée, on la
 * renomme, on la recolore, on la supprime, et elle survit sans aucun sujet.
 * Elle n'est plus le sous-produit d'une saisie libre — les sujets la désignent
 * par identifiant, ils ne la répètent pas, et la renommer une fois la renomme
 * partout.
 *
 * Aucune couleur n'est obligatoire : une catégorie jamais configurée reçoit
 * une teinte dérivée de son nom. Deux appareils qui n'ont jamais échangé
 * affichent ainsi « Mathématiques » de la même couleur, et `tint` ne porte que
 * les choix explicites de l'utilisateur.
 *
 * Une catégorie peut aussi porter n'importe quelle couleur, en dehors des
 * huit. Elle est retenue telle quelle : `lib/couleurs.ts` ne fait qu'écarter
 * l'invisible et dériver la couleur d'encre qui rendra le libellé lisible.
 */
import type { Category, Topic } from '../types'
import { textes } from '../i18n'
import {
  couleurRetenue,
  estCouleurPersonnalisee,
  type CouleurPersonnalisee,
} from './couleurs'
import { newId, type NouvelId } from './ids'

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

/** Ce qu'une catégorie peut porter : une des huit, ou une couleur libre. */
export type Teinte = TeinteNommee | CouleurPersonnalisee

/** Le libellé d'une teinte, pour que la couleur soit nommable au clavier. */
export function nomTeinte(teinte: TeinteNommee): string {
  return textes().teintes[teinte]
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
 * Deux catégories écrites différemment (« maths », « Maths ») sont la même.
 * La casse d'origine reste affichée, seule la clé est normalisée.
 *
 * C'est ce que le formulaire emprunte pour rattacher une saisie à une
 * catégorie existante plutôt que d'en créer une deuxième, et ce dont la
 * migration se sert pour rassembler les anciennes chaînes libres.
 */
export function cleCategorie(nom: string): string {
  return nom.trim().toLocaleLowerCase('fr')
}

/**
 * Les sujets sans catégorie ne sont pas perdus : ils forment leur propre
 * groupe. Ce n'est pas une catégorie de la base — c'est le nom que l'affichage
 * donne à leur absence, et il se traduit comme le reste de l'interface.
 */
export function sansCategorie(): string {
  return textes().commun.sansCategorie
}

/** La catégorie portant ce nom, à la casse près, ou null. */
export function trouverCategorie(nom: string, categories: Category[]): Category | null {
  const cle = cleCategorie(nom)
  if (cle === '') return null
  return categories.find((categorie) => cleCategorie(categorie.name) === cle) ?? null
}

/**
 * La catégorie qui porte déjà ce nom, hors celle qu'on est en train de modifier.
 *
 * Même clé que `trouverCategorie`, usage inverse : tant que la catégorie
 * naissait d'une saisie, « maths » rejoignait « Maths » ; maintenant qu'on la
 * crée sciemment, la même égalité sert à **refuser** le doublon. Deux
 * catégories qui ne se distinguent que par leur casse seraient deux couleurs
 * pour une même idée.
 *
 * `sauf` est l'identifiant du formulaire d'édition : se renommer soi-même, ne
 * serait-ce qu'en changeant une majuscule, ne doit pas buter sur son propre nom.
 */
export function categorieHomonyme(
  nom: string,
  categories: Category[],
  sauf?: string,
): Category | null {
  const trouvee = trouverCategorie(nom, categories)
  if (trouvee === null || trouvee.id === sauf) return null
  return trouvee
}

/**
 * Ce que l'application livre à la première installation : six catégories,
 * chacune avec son nom et sa couleur.
 *
 * Elles portent une teinte **explicite** plutôt que celle que leur nom leur
 * vaudrait : le hachage n'a aucune raison de les répartir, et deux catégories
 * livrées ensemble de la même couleur seraient un défaut visible dès le premier
 * écran. Les six sont distinctes et laissent `mauve` et `ocre` aux créations.
 *
 * Ce sont des catégories ordinaires, pas des lignes protégées : elles se
 * renomment, se recolorent et se suppriment comme les autres.
 */
const CLES_PROPOSEES = [
  { cle: 'etudes', tint: 'bleu' },
  { cle: 'travail', tint: 'ardoise' },
  { cle: 'langues', tint: 'teal' },
  { cle: 'developpement', tint: 'prune' },
  { cle: 'lecture', tint: 'olive' },
  { cle: 'personnel', tint: 'terre' },
] as const

/**
 * Leur nom suit la langue au moment où on les crée, et **pas ensuite** : ce
 * sont des catégories ordinaires dès qu'elles existent, avec le nom qu'elles
 * ont reçu. Traduire après coup renommerait des données que l'utilisateur a pu
 * modifier — et rien ne distingue plus une proposée d'une catégorie à lui.
 */
export function propositionsCategories(): { name: string; tint: TeinteNommee }[] {
  return CLES_PROPOSEES.map(({ cle, tint }) => ({
    name: textes().categoriesProposees[cle],
    tint,
  }))
}

/**
 * Les six, matérialisées. `nouvelId` est injectable comme dans `migration.ts` :
 * un identifiant aléatoire ne se compare pas dans un test.
 *
 * Deux appelants : le semis de la base neuve (`db/database.ts`) et le bouton
 * « Ajouter les catégories proposées » de l'écran des catégories, qui rattrape
 * les installations antérieures — la même liste, jamais deux.
 */
/**
 * La teinte qu'une catégorie livrée reçoit à sa création.
 *
 * Elle sert à **retrouver** une de ces six sans passer par son nom : le nom
 * suit la langue du jour où elle a été créée, et il a pu être modifié depuis.
 * La teinte, elle, est fixe et distincte d'une proposition à l'autre.
 */
export function teinteProposee(cle: CleProposee): TeinteNommee {
  return CLES_PROPOSEES.find((proposition) => proposition.cle === cle)!.tint
}

export type CleProposee = (typeof CLES_PROPOSEES)[number]['cle']

export function categoriesProposees(
  maintenant: string,
  nouvelId: NouvelId = newId,
): Category[] {
  return propositionsCategories().map(({ name, tint }) => ({
    id: nouvelId(),
    name,
    tint,
    createdAt: maintenant,
    updatedAt: maintenant,
  }))
}

/**
 * Les sujets d'une catégorie supprimée, détachés.
 *
 * Supprimer une catégorie ne supprime aucun sujet : ceux qui la portaient
 * rejoignent « Sans catégorie », qui est un état normal du modèle et non une
 * ligne de la base. Perdre un sujet parce qu'on a rangé ses étiquettes serait
 * la pire surprise que cette app puisse faire.
 *
 * Ne rend que les sujets modifiés — c'est ce qu'il y a à réécrire, et rien de
 * plus. `updatedAt` est rafraîchi : c'est bien une modification du sujet.
 */
export function detacherCategorie(
  categoryId: string,
  topics: Topic[],
  maintenant: string,
): Topic[] {
  return topics
    .filter((topic) => topic.categoryId === categoryId)
    .map((topic) => ({ ...topic, categoryId: null, updatedAt: maintenant }))
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

/**
 * La teinte d'une catégorie : son choix explicite, sinon celle que son nom lui
 * vaut. `null` couvre les sujets sans catégorie, qui retombent sur `--accent`.
 */
export function teinteDe(categorie: Category | null): Teinte | null {
  if (categorie === null) return null
  return categorie.tint ?? teinteParDefaut(categorie.name)
}
