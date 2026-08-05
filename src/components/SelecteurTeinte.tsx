/**
 * Choix de la teinte d'une matière : les huit pastilles de la palette, plus un
 * neuvième cercle pour une couleur libre.
 *
 * Chaque pastille de la palette est un vrai bouton radio, masqué visuellement
 * mais bien présent : le groupe se parcourt aux flèches et s'annonce comme un
 * choix. Le nom de la teinte est lu par les lecteurs d'écran, la couleur seule
 * ne suffirait pas.
 *
 * Le neuvième cercle n'est pas un radio mais un `input[type=color]` : c'est le
 * sélecteur du système qui s'ouvre, au doigt comme au clavier, et un
 * composant maison ne se justifierait pas — même parti pris que le champ date
 * (section 8.6). Il porte un « + » tant qu'aucune couleur libre n'est en
 * cours, la couleur elle-même ensuite.
 *
 * La couleur choisie est ramenée dans le registre des huit avant d'être
 * retenue (voir `lib/couleurs.ts`) : c'est ce qui permet de l'ouvrir sans que
 * la section 3 bis s'effondre. Le cercle montre le résultat, pas la valeur
 * brute.
 */
import { useId } from 'react'
import {
  NOM_TEINTE,
  TEINTES,
  couleurLibre,
  estTeinteNommee,
  type Teinte,
} from '../lib/categories'
import { normaliserCouleur } from '../lib/couleurs'
import { IconePlus } from './Icons'
import { proprietesTeinte } from './teinte'

/**
 * Les huit teintes en dur, uniquement pour amorcer le sélecteur du système :
 * il attend une valeur hexadécimale et ne sait pas lire une variable CSS.
 * Miroir de la section « Teintes de matière » de tokens.css.
 */
const HEX_TEINTE: Record<(typeof TEINTES)[number], string> = {
  ardoise: '#4a6572',
  prune: '#6b5b7b',
  olive: '#5a6b3c',
  terre: '#7a5b45',
  bleu: '#3f6389',
  teal: '#3e6b68',
  mauve: '#7a5470',
  ocre: '#75632a',
}

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
  const libre = couleurLibre(valeur)
  // Le sélecteur du système s'ouvre sur la couleur en cours, pas sur du noir.
  const amorce = estTeinteNommee(valeur) ? HEX_TEINTE[valeur] : valeur

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
            {...proprietesTeinte(teinte)}
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

        <label
          className={
            libre ? 'teintes__choix teintes__choix--actif' : 'teintes__choix'
          }
          {...(libre ? proprietesTeinte(libre) : {})}
        >
          {/*
            Non contrôlé : renvoyer la couleur normalisée dans `value` ferait
            sauter le sélecteur du système sous le doigt, en plein glissement.
            Il garde la valeur brute, le cercle montre le résultat.
          */}
          <input
            className="teintes__pipette"
            type="color"
            defaultValue={amorce}
            onChange={(event) => onChange(normaliserCouleur(event.target.value))}
          />
          <span className="teintes__pastille teintes__pastille--libre" aria-hidden="true">
            {!libre && <IconePlus width="16" height="16" strokeWidth="2" />}
          </span>
          <span className="invisible">Couleur personnalisée</span>
        </label>
      </div>
    </fieldset>
  )
}
