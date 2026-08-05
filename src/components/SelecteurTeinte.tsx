/**
 * Choix de la teinte d'une matière : huit pastilles, une par teinte.
 *
 * Chaque pastille est un vrai bouton radio, masqué visuellement mais bien
 * présent : le groupe se parcourt aux flèches et s'annonce comme un choix.
 * Le nom de la teinte est lu par les lecteurs d'écran, la couleur seule ne
 * suffirait pas.
 */
import { useId } from 'react'
import { NOM_TEINTE, TEINTES, type Teinte } from '../lib/categories'

interface SelecteurTeinteProps {
  valeur: Teinte
  onChange: (teinte: Teinte) => void
  /** Distingue deux groupes de radios présents sur le même écran. */
  groupe: string
  legende: string
  /**
   * Masque visuellement la légende sans la retirer : quand le nom de la
   * matière est déjà écrit juste au-dessus, la répéter n'apporte rien à
   * l'œil, mais un lecteur d'écran a toujours besoin de l'intitulé.
   */
  legendeMasquee?: boolean
}

export function SelecteurTeinte({
  valeur,
  onChange,
  groupe,
  legende,
  legendeMasquee = false,
}: SelecteurTeinteProps) {
  const id = useId()

  return (
    <fieldset className="teintes">
      <legend className={legendeMasquee ? 'invisible' : 'champ__label'}>
        {legende}
      </legend>
      <div className="teintes__liste">
        {TEINTES.map((teinte) => (
          <label
            key={teinte}
            className={
              teinte === valeur ? 'teintes__choix teintes__choix--actif' : 'teintes__choix'
            }
            data-teinte={teinte}
          >
            <input
              className="teintes__radio"
              type="radio"
              name={`${groupe}-${id}`}
              value={teinte}
              checked={teinte === valeur}
              onChange={() => onChange(teinte)}
            />
            <span className="teintes__pastille" aria-hidden="true" />
            <span className="invisible">{NOM_TEINTE[teinte]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
