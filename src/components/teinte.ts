// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Le pont entre une teinte et le DOM.
 *
 * Les composants lisent deux variables et ne savent pas ce qu'elles valent :
 * `--teinte`, la couleur de la catégorie — pastilles, points, bordures —, et
 * `--teinte-texte`, la même en encre, assez contrastée pour se lire sur le
 * papier du moment. Les huit teintes intégrées tiennent déjà 5,5:1 dans les
 * deux thèmes : les deux valent la même chose. Une couleur libre peut être
 * pâle, ou très sombre, et alors elles divergent.
 *
 * Une des huit passe par son attribut `data-teinte`, qui la fait pointer sur
 * ses variables de palette — et `tokens.css` en redéfinit les huit valeurs pour
 * le thème sombre, sans que ce module ait à le savoir. Une couleur libre n'a
 * pas de variable à elle : elle est calculée ici, contre le fond réellement
 * rendu. Un rose pâle s'écrit en rose foncé sur le papier crème et reste rose
 * pâle sur le papier de nuit ; un bleu marine fait exactement l'inverse.
 *
 * Ce calcul a lieu au rendu, jamais à l'enregistrement : ce qui part en base
 * est la couleur choisie, la même quel que soit l'écran (voir
 * `lib/couleurs.ts`).
 *
 * Un seul endroit fait ce choix, pour que chip, pastille, point de calendrier
 * et sélecteur ne divergent jamais.
 */
import type { CSSProperties } from 'react'
import { couleurLibre, type Teinte } from '../lib/categories'
import { couleurAffichee, couleurTexte } from '../lib/couleurs'

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
      '--teinte': couleurAffichee(libre),
      '--teinte-texte': couleurTexte(libre),
    } as CSSProperties,
  }
}
