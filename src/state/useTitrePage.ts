// SPDX-License-Identifier: AGPL-3.0-only

import { useEffect } from 'react'

/**
 * Section 10 : un <title> propre à chaque page. C'est aussi ce que lit un
 * lecteur d'écran au changement de route, puisque la navigation côté client
 * ne recharge pas le document.
 */
export function useTitrePage(titre: string) {
  useEffect(() => {
    document.title = `${titre} · Revoir`
  }, [titre])
}

/**
 * Marque le document pendant qu'un panneau ou une feuille modale est ouvert.
 * Le FAB s'efface alors : il ne flotte jamais par-dessus (section 7.3).
 */
export function usePanneauOuvert(ouvert: boolean) {
  useEffect(() => {
    if (!ouvert) return
    document.body.dataset.panneau = 'ouvert'
    return () => {
      delete document.body.dataset.panneau
    }
  }, [ouvert])
}
