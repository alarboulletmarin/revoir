import { useCallback } from 'react'
import type { Review } from '../types'
import { formatEcheance, type DateKey } from '../lib/dates'
import { useDonnees } from './useDonnees'
import { useToast } from './useToast'

/**
 * Le libellé du report, qui dit où l'échéance va.
 *
 * « À demain » pour ce qui est en retard ou tombe aujourd'hui — c'est
 * littéralement demain. « D'un jour » pour une échéance à venir, qui recule
 * depuis sa propre date : « reporter à demain » une révision prévue dans huit
 * jours serait un mensonge.
 */
export function libelleReport(review: Review, aujourdhui: DateKey): string {
  return review.dueDate <= aujourdhui ? 'Reporter à demain' : 'Reporter d’un jour'
}

/**
 * Le report d'une échéance — règle métier n°6, au même endroit pour les deux
 * écrans qui le proposent.
 *
 * Même forme que la validation : rien à confirmer, l'affichage change tout de
 * suite, et le toast propose « Annuler ». Le détail dit la nouvelle date, sans
 * quoi le geste n'a aucun retour visible depuis le tableau de suivi, où la
 * cellule reportée sort simplement de la colonne du jour.
 */
export function useReport() {
  const { reporter, restaurerRevisions } = useDonnees()
  const { afficherToast } = useToast()

  return useCallback(
    (reviewId: string, aujourdhui: DateKey) => {
      const effet = reporter(reviewId)
      if (!effet) return

      afficherToast({
        texte: 'Révision reportée',
        detail: `Au ${formatEcheance(effet.date, aujourdhui)}`,
        action: {
          libelle: 'Annuler',
          onAction: () => restaurerRevisions(effet.topicId, effet.precedentes),
        },
      })
    },
    [reporter, restaurerRevisions, afficherToast],
  )
}
