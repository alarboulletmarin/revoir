/**
 * Cellule bento (section 8.1). Réservée au tableau de bord : étendre le bento
 * aux autres écrans le banaliserait (section 7.2).
 *
 * Ordre interne imposé : chiffre → label → contenu. Le chiffre d'abord, parce
 * que c'est ce qu'on vient chercher.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface CelluleProps {
  /** Nom de la zone `grid-area` du bento. */
  zone: string
  /**
   * Fond `--accent` plein. Une seule cellule par écran peut le porter :
   * si deux cellules sont pleines, la hiérarchie est morte (section 3).
   */
  accent?: boolean
  chiffre?: ReactNode
  label?: string
  /** Rend la cellule entière cliquable. */
  vers?: string
  children?: ReactNode
}

export function Cellule({ zone, accent, chiffre, label, vers, children }: CelluleProps) {
  const classes = [
    'cellule',
    accent ? 'cellule--accent' : null,
    vers ? 'cellule--action' : null,
  ]
    .filter(Boolean)
    .join(' ')

  const contenu = (
    <>
      {chiffre !== undefined && (
        <output className="cellule__chiffre">{chiffre}</output>
      )}
      {label && <p className="cellule__label">{label}</p>}
      {children}
    </>
  )

  if (vers) {
    return (
      <Link to={vers} className={classes} style={{ gridArea: zone }}>
        {contenu}
      </Link>
    )
  }

  return (
    <section className={classes} style={{ gridArea: zone }}>
      {contenu}
    </section>
  )
}
