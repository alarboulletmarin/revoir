/**
 * Le pont entre une teinte et le DOM.
 *
 * Les composants ne lisent qu'une variable, `--teinte` (section 12) : ils ne
 * savent pas laquelle ils portent. Une des huit l'obtient par son attribut
 * `data-teinte`, qui la fait pointer sur sa variable de palette ; une couleur
 * libre la pose directement, puisqu'elle n'a pas de variable à elle.
 *
 * Un seul endroit fait ce choix, pour que chip, pastille, point de calendrier
 * et sélecteur ne divergent jamais.
 */
import type { CSSProperties } from 'react'
import { couleurLibre, type Teinte } from '../lib/categories'

interface ProprietesTeinte {
  'data-teinte'?: Teinte
  style?: CSSProperties
}

export function proprietesTeinte(teinte: Teinte): ProprietesTeinte {
  const libre = couleurLibre(teinte)
  // La propriété personnalisée n'existe pas dans le type CSSProperties de
  // React : c'est le seul endroit du projet qui a besoin de la poser.
  return libre
    ? { style: { '--teinte': libre } as CSSProperties }
    : { 'data-teinte': teinte }
}
