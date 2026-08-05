/**
 * La marque d'une cellule du tableau de suivi (section 8.13).
 *
 * Cinq états, cinq **formes** : la couleur ne porte jamais l'information seule,
 * et les cinq doivent se distinguer en niveaux de gris.
 *
 *   ✓  faite            disque plein, coche à l'intérieur
 *   ○  à faire ce jour  anneau
 *   ⊙  en retard        anneau, point plein au centre
 *   ·  à venir          point
 *   —  hors programme   filet
 *
 * Tout est dessiné en CSS : la section 11 arrête la liste des icônes à six, et
 * la coche — qui en fait partie — est la seule reprise ici.
 */
import type { EtatCellule } from '../lib/suivi'
import { IconeCoche } from './Icons'

export function MarqueCellule({ etat }: { etat: EtatCellule }) {
  return (
    <span className={`marque marque--${etat}`} aria-hidden="true">
      {etat === 'faite' && <IconeCoche className="marque__coche" />}
    </span>
  )
}
