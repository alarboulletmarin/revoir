/**
 * Le statut de pratique d'un sujet : à faire → en cours → terminée.
 *
 * Trois choix affichés, jamais un cycle au toucher. Un tap qui ferait défiler
 * les états rendrait le changement accidentel trop facile — c'est le même
 * raisonnement qui, ailleurs dans l'app, réserve la confirmation à la
 * suppression : ici on ne confirme pas, on choisit.
 *
 * Des radios natifs : les flèches naviguent dans le groupe, l'état est annoncé,
 * et rien de tout cela n'est à réécrire.
 */
import { useId } from 'react'
import type { PracticeStatus } from '../types'

export const LIBELLES_PRATIQUE: Record<PracticeStatus, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminée',
}

const ORDRE: PracticeStatus[] = ['todo', 'in_progress', 'done']

interface SelecteurPratiqueProps {
  valeur: PracticeStatus
  onChange: (statut: PracticeStatus) => void
  legende?: string
}

export function SelecteurPratique({
  valeur,
  onChange,
  legende = 'Pratique',
}: SelecteurPratiqueProps) {
  const groupe = useId()

  return (
    <fieldset className="pratique">
      <legend className="champ__label">{legende}</legend>
      <div className="pratique__choix">
        {ORDRE.map((statut) => (
          <label
            key={statut}
            className={
              valeur === statut ? 'pratique__option pratique__option--actif' : 'pratique__option'
            }
          >
            <input
              className="pratique__radio"
              type="radio"
              name={groupe}
              value={statut}
              checked={valeur === statut}
              onChange={() => onChange(statut)}
            />
            {LIBELLES_PRATIQUE[statut]}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
