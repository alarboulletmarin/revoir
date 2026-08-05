/**
 * Chip de catégorie, teintée.
 *
 * La couleur ne porte jamais l'information seule — le nom est toujours écrit
 * à côté. Elle sert de repère secondaire, pas de code à mémoriser.
 */
import type { Category } from '../types'
import { teinteDe } from '../lib/categories'
import { proprietesTeinte } from './teinte'

interface ChipCategorieProps {
  /** null pour un sujet sans catégorie : il n'y a alors rien à écrire. */
  categorie: Category | null
}

export function ChipCategorie({ categorie }: ChipCategorieProps) {
  const teinte = teinteDe(categorie)
  if (categorie === null || teinte === null) return null

  return (
    <span className="chip chip--categorie" {...proprietesTeinte(teinte)}>
      {categorie.name}
    </span>
  )
}

/** Pastille seule, quand le nom de la catégorie est déjà écrit juste à côté. */
export function PastilleCategorie({ categorie }: ChipCategorieProps) {
  const teinte = teinteDe(categorie)
  if (teinte === null) return null

  return <span className="pastille" {...proprietesTeinte(teinte)} aria-hidden="true" />
}
