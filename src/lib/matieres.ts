/**
 * Regroupement des éléments par matière, pour le tableau de bord.
 */
import type { Item, Review } from '../types'
import { activeItems } from './stats'
import { cleCategorie } from './categories'
import type { DateKey } from './dates'

/**
 * Les éléments sans catégorie ne sont pas perdus : ils forment leur propre
 * groupe.
 *
 * « Catégorie » et pas « matière » : c'est le mot du champ que l'utilisateur
 * remplit, et celui du modèle de données (`item.category`). Le code, lui,
 * garde `matiere` — le renommer partout ne changerait rien à l'écran.
 */
export const SANS_CATEGORIE = 'Sans catégorie'

export interface Matiere {
  /** Clé stable, utilisée pour mémoriser l'état plié/déplié. */
  cle: string
  nom: string
  items: Item[]
  /** Révisions restantes sur l'ensemble du groupe. */
  restantes: number
  /** Prochaine échéance non faite du groupe, toutes matières confondues. */
  prochaine: DateKey | null
}

/**
 * Groupes triés par nom, « Sans catégorie » en dernier. À l'intérieur d'un
 * groupe, les éléments sont classés par prochaine échéance : ce qui revient
 * bientôt se lit en premier.
 */
export function grouperParMatiere(items: Item[]): Matiere[] {
  const groupes = new Map<string, Matiere>()

  for (const item of activeItems(items)) {
    const nom = item.category.trim() === '' ? SANS_CATEGORIE : item.category.trim()
    const cle = cleCategorie(nom)
    const groupe = groupes.get(cle) ?? {
      cle,
      nom,
      items: [],
      restantes: 0,
      prochaine: null,
    }
    groupe.items.push(item)
    groupe.restantes += item.reviews.filter((review) => !review.done).length

    const prochaine = prochaineEcheance(item)
    if (prochaine && (groupe.prochaine === null || prochaine < groupe.prochaine)) {
      groupe.prochaine = prochaine
    }
    groupes.set(cle, groupe)
  }

  for (const groupe of groupes.values()) {
    groupe.items.sort(comparerItems)
  }

  return [...groupes.values()].sort((a, b) => {
    if (a.nom === SANS_CATEGORIE) return 1
    if (b.nom === SANS_CATEGORIE) return -1
    return a.nom.localeCompare(b.nom, 'fr')
  })
}

/**
 * Première révision non faite d'un élément, ou null s'il est terminé.
 *
 * L'objet plutôt que la date seule : le tableau de bord a besoin du décalage
 * pour dire à quelle étape du programme on en est.
 */
export function prochaineRevision(item: Item): Review | null {
  let prochaine: Review | null = null
  for (const review of item.reviews) {
    if (review.done) continue
    if (prochaine === null || review.date < prochaine.date) prochaine = review
  }
  return prochaine
}

/** Sa date seule — c'est tout ce que le tri et le regroupement demandent. */
export function prochaineEcheance(item: Item): DateKey | null {
  return prochaineRevision(item)?.date ?? null
}

/** Ce qui revient le plus tôt d'abord ; les éléments terminés à la fin. */
function comparerItems(a: Item, b: Item): number {
  const da = prochaineEcheance(a)
  const db = prochaineEcheance(b)
  if (da === null && db === null) return a.title.localeCompare(b.title, 'fr')
  if (da === null) return 1
  if (db === null) return -1
  if (da !== db) return da < db ? -1 : 1
  return a.title.localeCompare(b.title, 'fr')
}
