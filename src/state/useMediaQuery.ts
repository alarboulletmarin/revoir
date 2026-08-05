// SPDX-License-Identifier: AGPL-3.0-only

import { useEffect, useState } from 'react'

/**
 * Uniquement des `min-width` (section 7.1). Certaines règles ne peuvent pas
 * s'écrire en CSS seul — le nombre d'items de la cellule héros change le
 * libellé du lien « Tout voir », pas seulement l'affichage.
 */
export function useMediaQuery(query: string): boolean {
  const [correspond, setCorrespond] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const liste = window.matchMedia(query)
    const surChangement = () => setCorrespond(liste.matches)
    surChangement()
    liste.addEventListener('change', surChangement)
    return () => liste.removeEventListener('change', surChangement)
  }, [query])

  return correspond
}
