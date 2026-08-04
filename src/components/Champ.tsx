/**
 * Champ de formulaire (section 8.6).
 *
 * Label toujours au-dessus : jamais de placeholder en guise de label. La
 * taille de police vient de --t-champ (16px), plancher qui empêche iOS de
 * zoomer au focus.
 */
import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

interface ChampProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  /** Message d'erreur, affiché sous le champ et relié par aria-describedby. */
  erreur?: string | null
  /** Précision affichée sous le champ quand il n'y a pas d'erreur. */
  aide?: ReactNode
}

export function Champ({ label, erreur, aide, className, ...props }: ChampProps) {
  const id = useId()
  const idErreur = `${id}-erreur`
  const idAide = `${id}-aide`

  const decrit = [erreur ? idErreur : null, aide ? idAide : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="champ">
      <label className="champ__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={['champ__saisie', className].filter(Boolean).join(' ')}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={decrit || undefined}
        {...props}
      />
      {aide && !erreur && (
        <p className="champ__aide" id={idAide}>
          {aide}
        </p>
      )}
      {erreur && (
        <p className="champ__erreur" id={idErreur}>
          {erreur}
        </p>
      )}
    </div>
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
