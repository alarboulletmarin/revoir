// SPDX-License-Identifier: AGPL-3.0-only

import { useEffect, useState } from 'react'

/**
 * Des `min-width` (section 7.1), et une exception : `prefers-color-scheme`.
 *
 * Certaines règles ne peuvent pas s'écrire en CSS seul — le nombre d'items de
 * la cellule héros change le libellé du lien « Tout voir », pas seulement
 * l'affichage. Le thème du système, lui, doit être **résolu** en JavaScript :
 * `data-theme` ne porte jamais « système », et les couleurs libres sont
 * ajustées contre le fond réellement rendu, que le CSS ne sait pas rendre.
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
