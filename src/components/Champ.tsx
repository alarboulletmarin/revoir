/**
 * Champ de formulaire (section 8.6).
 *
 * Label toujours au-dessus : jamais de placeholder en guise de label. La
 * taille de police vient de --t-champ (16px), plancher qui empêche iOS de
 * zoomer au focus.
 */
import {
  useId,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { formatLong } from '../lib/dates'
import { IconeCalendrier } from './Icons'

/** Identifiants des messages reliés au champ par `aria-describedby`. */
function decrire(id: string, erreur?: string | null, aide?: ReactNode) {
  return (
    [erreur ? `${id}-erreur` : null, aide ? `${id}-aide` : null]
      .filter(Boolean)
      .join(' ') || undefined
  )
}

/** Coquille commune : le label au-dessus, l'aide ou l'erreur en dessous. */
function Coquille({
  id,
  label,
  erreur,
  aide,
  children,
}: {
  id: string
  label: string
  erreur?: string | null
  aide?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="champ">
      <label className="champ__label" htmlFor={id}>
        {label}
      </label>
      {children}
      {aide && !erreur && (
        <p className="champ__aide" id={`${id}-aide`}>
          {aide}
        </p>
      )}
      {erreur && (
        <p className="champ__erreur" id={`${id}-erreur`}>
          {erreur}
        </p>
      )}
    </div>
  )
}

interface ChampProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  /** Message d'erreur, affiché sous le champ et relié par aria-describedby. */
  erreur?: string | null
  /** Précision affichée sous le champ quand il n'y a pas d'erreur. */
  aide?: ReactNode
}

export function Champ({ label, erreur, aide, className, ...props }: ChampProps) {
  const id = useId()

  return (
    <Coquille id={id} label={label} erreur={erreur} aide={aide}>
      <input
        id={id}
        className={['champ__saisie', className].filter(Boolean).join(' ')}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={decrire(id, erreur, aide)}
        {...props}
      />
    </Coquille>
  )
}

interface ChampDateProps {
  label: string
  /** Nom accessible du déclencheur, ex. « Choisir la date de départ ». */
  intitule: string
  /** Valeur de référence, au format ISO 'yyyy-MM-dd'. */
  value: string
  onChange: (value: string) => void
  erreur?: string | null
  aide?: ReactNode
}

/**
 * Champ date : un bouton de sélection, pas une saisie.
 *
 * Un `input[type="date"]` n'affiche que le format du navigateur
 * (« 05/08/2026 ») et rien ne permet de le lui faire écrire autrement. La
 * date en toutes lettres est donc peinte au-dessus, et l'input — transparent,
 * étendu à toute la carte — garde ce qu'il fait déjà mieux qu'un composant
 * maison : le sélecteur natif, la valeur ISO, le clavier, iOS.
 */
export function ChampDate({
  label,
  intitule,
  value,
  onChange,
  erreur,
  aide,
}: ChampDateProps) {
  const id = useId()

  /*
   * Au doigt, toucher l'input ouvre déjà le sélecteur. Sur desktop, un clic
   * ne ferait que poser le curseur sur un segment : `showPicker()` ouvre le
   * calendrier pour de bon. Absent avant Safari 16, d'où le garde.
   */
  const ouvrirSelecteur = (event: MouseEvent<HTMLInputElement>) => {
    const champ = event.currentTarget
    if (typeof champ.showPicker !== 'function') return
    try {
      champ.showPicker()
    } catch {
      // Geste refusé par le navigateur : le champ reste utilisable seul.
    }
  }

  return (
    <Coquille id={id} label={label} erreur={erreur} aide={aide}>
      <div className="champ-date">
        {/* Rendu visible de la valeur de l'input : l'input l'annonce déjà. */}
        <span
          className={[
            'champ-date__valeur',
            value === '' ? 'champ-date__valeur--vide' : null,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden="true"
        >
          {value === '' ? 'Choisir une date' : formatLong(value)}
        </span>
        <IconeCalendrier className="champ-date__icone" width="18" height="18" />
        <input
          id={id}
          className="champ-date__saisie"
          type="date"
          value={value}
          aria-label={intitule}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={decrire(id, erreur, aide)}
          onClick={ouvrirSelecteur}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </Coquille>
  )
}

/** Groupe de champs à légende : sélecteur de programme, options. */
export function GroupeChamp({
  legende,
  children,
}: {
  legende: string
  children: ReactNode
}) {
  return (
    <fieldset className="champ">
      <legend className="champ__label">{legende}</legend>
      {children}
    </fieldset>
  )
}
