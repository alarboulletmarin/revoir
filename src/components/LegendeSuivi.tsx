// SPDX-License-Identifier: AGPL-3.0-only

/**
 * La légende du tableau de suivi (section 8.13).
 *
 * Cinq états, cinq formes — et jusqu'ici aucun endroit où lire ce qu'elles
 * disent. Les lecteurs d'écran avaient le texte complet de chaque cellule ;
 * l'œil, lui, devait deviner qu'un anneau au point central veut dire « en
 * retard ». Une forme ne se lit pas, elle s'apprend une fois.
 *
 * Écrite une seule fois, rendue à deux endroits : repliée sous le premier
 * tableau du suivi, dépliée sur la page d'aide.
 */
import type { EtatCellule } from '../lib/suivi'
import { MarqueCellule } from './MarqueCellule'
import { useTextes } from '../state/usePreferences'

/** Dans l'ordre de la vie d'une révision, pas dans celui du dictionnaire. */
const ETATS: EtatCellule[] = [
  'faite',
  'aujourdhui',
  'retard',
  'avenir',
  'hors-programme',
]

export function LegendeSuivi() {
  const t = useTextes()

  return (
    <ul className="legende">
      {ETATS.map((etat) => (
        <li key={etat} className="legende__entree">
          <MarqueCellule etat={etat} />
          {t.suivi.etats[etat]}
        </li>
      ))}
    </ul>
  )
}
