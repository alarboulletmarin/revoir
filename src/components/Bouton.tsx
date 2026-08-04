/**
 * Boutons (section 8.4). Quatre variantes, hauteur minimale 44px partout,
 * focus toujours visible.
 *
 * `.btn--primaire` : une seule par écran.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type VarianteBouton = 'primaire' | 'discret' | 'texte' | 'danger'

interface CommunProps {
  variante?: VarianteBouton
  /** Occupe toute la largeur disponible. */
  pleineLargeur?: boolean
  children: ReactNode
}

type BoutonProps = CommunProps & ButtonHTMLAttributes<HTMLButtonElement>

function classes(variante: VarianteBouton, pleineLargeur?: boolean, extra?: string) {
  return [
    'btn',
    `btn--${variante}`,
    pleineLargeur ? 'btn--large' : null,
    extra,
  ]
    .filter(Boolean)
    .join(' ')
}

export function Bouton({
  variante = 'discret',
  pleineLargeur,
  className,
  type = 'button',
  children,
  ...props
}: BoutonProps) {
  return (
    <button
      type={type}
      className={classes(variante, pleineLargeur, className)}
      {...props}
    >
      {children}
    </button>
  )
}

interface LienBoutonProps extends CommunProps {
  vers: string
  className?: string
  'aria-label'?: string
}

/** Même apparence, sémantique de lien : à utiliser dès que ça navigue. */
export function LienBouton({
  vers,
  variante = 'discret',
  pleineLargeur,
  className,
  children,
  ...props
}: LienBoutonProps) {
  return (
    <Link to={vers} className={classes(variante, pleineLargeur, className)} {...props}>
      {children}
    </Link>
  )
}
