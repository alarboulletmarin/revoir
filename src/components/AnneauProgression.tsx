// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Anneau de progression de la cellule « restantes » (section 7.2).
 *
 * Le `conic-gradient` prescrit par le design system est le seul du projet, et
 * ses arrêts sont francs : ce qui est tracé est un arc, pas un dégradé.
 */
import type { CSSProperties } from 'react'

interface AnneauProgressionProps {
  /** Progression de 0 à 1. */
  part: number
  label: string
}

export function AnneauProgression({ part, label }: AnneauProgressionProps) {
  const borne = Math.min(1, Math.max(0, part))

  return (
    <div
      className="anneau"
      style={{ '--part': borne } as CSSProperties}
      role="progressbar"
      aria-valuenow={Math.round(borne * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    />
  )
}
