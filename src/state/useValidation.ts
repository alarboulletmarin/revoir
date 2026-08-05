import { useCallback } from 'react'
import type { ReviewEntry } from '../types'
import { useDonnees } from './useDonnees'
import { useToast } from './useToast'

/**
 * Le geste central de l'app, au même endroit pour toutes les listes — et
 * maintenant aussi pour les cellules du tableau de suivi.
 *
 * Règle métier n°2 : validation optimiste, aucune confirmation, un toast qui
 * propose « Annuler » pendant 5 secondes. Règle métier n°1 : quand la
 * validation a recalé les échéances suivantes, le toast le dit — discrètement,
 * sur une seconde ligne.
 */
export function useValidation() {
  const { valider, devalider, restaurerRevisions } = useDonnees()
  const { afficherToast } = useToast()

  const validerEntree = useCallback(
    (entry: ReviewEntry) => {
      const effet = valider(entry.review.id)
      if (!effet) return

      afficherToast({
        texte: 'Révision enregistrée',
        detail: effet.deplacees > 0 ? 'Prochaines dates ajustées' : undefined,
        action: {
          libelle: 'Annuler',
          onAction: () => restaurerRevisions(effet.topicId, effet.precedentes),
        },
      })
    },
    [valider, restaurerRevisions, afficherToast],
  )

  const devaliderEntree = useCallback(
    (entry: ReviewEntry) => {
      devalider(entry.review.id)
    },
    [devalider],
  )

  return { validerEntree, devaliderEntree }
}
