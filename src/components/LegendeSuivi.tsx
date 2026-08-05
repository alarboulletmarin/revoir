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

const ETATS: { etat: EtatCellule; libelle: string }[] = [
  { etat: 'faite', libelle: 'Effectuée' },
  { etat: 'aujourdhui', libelle: 'À effectuer aujourd’hui' },
  { etat: 'retard', libelle: 'En retard' },
  { etat: 'avenir', libelle: 'À venir' },
  { etat: 'hors-programme', libelle: 'Hors programme' },
]

export function LegendeSuivi() {
  return (
    <ul className="legende">
      {ETATS.map(({ etat, libelle }) => (
        <li key={etat} className="legende__entree">
          <MarqueCellule etat={etat} />
          {libelle}
        </li>
      ))}
    </ul>
  )
}
