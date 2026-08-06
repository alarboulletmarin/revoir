// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Un choix parmi deux ou trois, tout entier visible.
 *
 * C'est le gabarit que le sélecteur de pratique a inauguré et que le mode de
 * colonnes du suivi a repris : des radios natifs — les flèches naviguent dans
 * le groupe, l'état est annoncé — habillés en segments. Le thème et la langue
 * en avaient besoin à leur tour ; à la troisième copie, il valait mieux
 * l'écrire une fois.
 *
 * Jamais un cycle au toucher : un tap qui ferait défiler les valeurs rendrait
 * le changement accidentel trop facile. Ici on ne confirme pas, on choisit.
 *
 * Les classes restent celles du sélecteur de pratique. Renommer une famille de
 * classes CSS pour la seule raison qu'un deuxième écran s'en sert coûterait
 * plus de lignes que d'en partager le nom.
 */
import { useId } from 'react'

interface BasculeProps<T extends string> {
  legende: string
  /**
   * Masque visuellement la légende sans la retirer : le titre de section la
   * répète parfois déjà, mais un lecteur d'écran a toujours besoin de
   * l'intitulé du groupe.
   */
  legendeMasquee?: boolean
  valeur: T
  options: readonly { valeur: T; libelle: string }[]
  onChange: (valeur: T) => void
  /** Classe du conteneur des segments, quand un écran resserre sa largeur. */
  className?: string
}

export function Bascule<T extends string>({
  legende,
  legendeMasquee = false,
  valeur,
  options,
  onChange,
  className,
}: BasculeProps<T>) {
  const groupe = useId()

  return (
    <fieldset className="pratique">
      <legend className={legendeMasquee ? 'invisible' : 'champ__label'}>
        {legende}
      </legend>
      <div className={['pratique__choix', className].filter(Boolean).join(' ')}>
        {options.map((option) => (
          <label
            key={option.valeur}
            className={
              valeur === option.valeur
                ? 'pratique__option pratique__option--actif'
                : 'pratique__option'
            }
          >
            <input
              className="pratique__radio"
              type="radio"
              name={groupe}
              value={option.valeur}
              checked={valeur === option.valeur}
              onChange={() => onChange(option.valeur)}
            />
            {option.libelle}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
