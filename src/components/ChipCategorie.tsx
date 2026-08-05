/**
 * Chip de matière, teintée.
 *
 * La couleur ne porte jamais l'information seule — le nom est toujours écrit
 * à côté. Elle sert de repère secondaire, pas de code à mémoriser.
 */
import { teinteDe, type Teintes } from '../lib/categories'
import { proprietesTeinte } from './teinte'

interface ChipCategorieProps {
  categorie: string
  teintes: Teintes
}

export function ChipCategorie({ categorie, teintes }: ChipCategorieProps) {
  if (categorie.trim() === '') return null

  return (
    <span
      className="chip chip--matiere"
      {...proprietesTeinte(teinteDe(categorie, teintes))}
    >
      {categorie}
    </span>
  )
}

/** Pastille seule, quand le nom de la matière est déjà écrit juste à côté. */
export function PastilleCategorie({ categorie, teintes }: ChipCategorieProps) {
  return (
    <span
      className="pastille"
      {...proprietesTeinte(teinteDe(categorie, teintes))}
      aria-hidden="true"
    />
  )
}
