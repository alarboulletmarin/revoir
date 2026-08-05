/**
 * Le pont entre une teinte et le DOM.
 *
 * Les composants lisent deux variables et ne savent pas ce qu'elles valent :
 * `--teinte`, la couleur de la matière — pastilles, points, bordures —, et
 * `--teinte-texte`, la même en encre, assez foncée pour se lire sur le
 * papier. Les huit teintes intégrées tiennent déjà 5,5:1 : les deux valent la
 * même chose. Une couleur libre peut être pâle, et alors seule la seconde
 * s'assombrit.
 *
 * Une des huit passe par son attribut `data-teinte`, qui la fait pointer sur
 * ses variables de palette ; une couleur libre les pose directement, n'ayant
 * pas de variable à elle.
 *
 * Un seul endroit fait ce choix, pour que chip, pastille, point de calendrier
 * et sélecteur ne divergent jamais.
 */
import type { CSSProperties } from 'react'
import { couleurLibre, type Teinte } from '../lib/categories'
import { couleurTexte } from '../lib/couleurs'

interface ProprietesTeinte {
  'data-teinte'?: Teinte
  style?: CSSProperties
}

export function proprietesTeinte(teinte: Teinte): ProprietesTeinte {
  const libre = couleurLibre(teinte)
  if (!libre) return { 'data-teinte': teinte }
  // Les propriétés personnalisées n'existent pas dans le type CSSProperties
  // de React : c'est le seul endroit du projet qui ait besoin de les poser.
  return {
    style: {
      '--teinte': libre,
      '--teinte-texte': couleurTexte(libre),
    } as CSSProperties,
  }
}
