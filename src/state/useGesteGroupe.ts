// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Les gestes qui portent sur toute une journée — « Tout marquer comme revu »,
 * « Reporter à demain » (section 8.11).
 *
 * Même forme que le geste unitaire : rien à confirmer, l'affichage change tout
 * de suite, et un toast propose « Annuler » pendant cinq secondes. Deux
 * différences, et elles comptent.
 *
 * **Un seul message, pas un par révision.** Cinq toasts empilés pour un seul
 * tap ne diraient rien de plus et couvriraient l'écran.
 *
 * **Le message dit combien.** « Révision enregistrée » après avoir coché toute
 * une journée laisse croire qu'une seule l'a été.
 */
import { useCallback } from 'react'
import { textes } from '../i18n'
import { useDonnees } from './useDonnees'
import { useToast } from './useToast'
import { useTextes } from './usePreferences'

export function useGesteGroupe() {
  const { validerPlusieurs, reporterPlusieurs, restaurerRevisions } = useDonnees()
  const { afficherToast } = useToast()
  const t = useTextes()

  const marquerToutes = useCallback(
    (reviewIds: string[]) => {
      const effet = validerPlusieurs(reviewIds)
      if (effet.touchees === 0) return

      afficherToast({
        texte: t.jour.marquees(effet.touchees),
        detail: effet.deplacees > 0 ? textes().toast.recalageCourt : undefined,
        action: {
          libelle: t.commun.annuler,
          onAction: () => {
            // Chaque sujet retrouve ses révisions d'avant. Le geste a pu en
            // toucher plusieurs, et « Annuler » ne défait pas à moitié.
            for (const [topicId, precedentes] of effet.precedentes) {
              restaurerRevisions(topicId, precedentes)
            }
          },
        },
      })
    },
    [validerPlusieurs, restaurerRevisions, afficherToast, t],
  )

  const reporterToutes = useCallback(
    (reviewIds: string[]) => {
      const effet = reporterPlusieurs(reviewIds)
      if (effet.touchees === 0) return

      afficherToast({
        texte: t.jour.reportees(effet.touchees),
        action: {
          libelle: t.commun.annuler,
          onAction: () => {
            for (const [topicId, precedentes] of effet.precedentes) {
              restaurerRevisions(topicId, precedentes)
            }
          },
        },
      })
    },
    [reporterPlusieurs, restaurerRevisions, afficherToast, t],
  )

  return { marquerToutes, reporterToutes }
}
