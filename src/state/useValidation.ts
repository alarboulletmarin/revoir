import { useCallback } from 'react'
import type { ReviewEntry } from '../types'
import { lire, ecrire } from './usePreference'
import { useDonnees } from './useDonnees'
import { useToast } from './useToast'

/**
 * Le recalage a-t-il déjà été expliqué sur cet appareil ?
 *
 * Il n'appartient pas aux données : c'est une chose apprise, pas une chose
 * possédée. Elle ne s'exporte pas et ne se synchronise pas — d'où
 * localStorage, et d'où le fait qu'une écriture qui échoue ne soit pas une
 * erreur : au pire l'explication reparaît une fois.
 */
const CLE_RECALAGE_VU = 'revoir.recalage.vu'

const estVrai = (valeur: unknown): valeur is true => valeur === true

/**
 * Le détail du toast quand une validation a déplacé des échéances.
 *
 * La première fois, il dit ce qui vient de se passer : personne ne peut
 * deviner qu'« ajustées » veut dire « en gardant les écarts du programme », et
 * voir des dates bouger sans explication ressemble à une erreur de
 * l'application. Ensuite, la phrase courte suffit — une explication qu'on
 * relit à chaque fois cesse d'être lue.
 */
function detailRecalage(): string {
  if (lire(CLE_RECALAGE_VU, estVrai) === true) return 'Prochaines dates ajustées'
  ecrire(CLE_RECALAGE_VU, true)
  return 'Les suivantes gardent leurs écarts, à partir d’aujourd’hui'
}

/**
 * Le geste central de l'app, au même endroit pour toutes les listes, pour les
 * cellules du tableau de suivi et pour la fiche d'un sujet.
 *
 * Règle métier n°2 : validation optimiste, aucune confirmation, un toast qui
 * propose « Annuler » pendant 5 secondes. Règle métier n°1 : quand la
 * validation a recalé les échéances suivantes, le toast le dit — discrètement,
 * sur une seconde ligne.
 */
export function useValidation() {
  const { valider, devalider, restaurerRevisions } = useDonnees()
  const { afficherToast } = useToast()

  /** La validation par identifiant : c'est ce que connaît une cellule. */
  const validerRevision = useCallback(
    (reviewId: string) => {
      const effet = valider(reviewId)
      if (!effet) return

      afficherToast({
        texte: 'Révision enregistrée',
        detail: effet.deplacees > 0 ? detailRecalage() : undefined,
        action: {
          libelle: 'Annuler',
          onAction: () => restaurerRevisions(effet.topicId, effet.precedentes),
        },
      })
    },
    [valider, restaurerRevisions, afficherToast],
  )

  const validerEntree = useCallback(
    (entry: ReviewEntry) => validerRevision(entry.review.id),
    [validerRevision],
  )

  const devaliderEntree = useCallback(
    (entry: ReviewEntry) => {
      devalider(entry.review.id)
    },
    [devalider],
  )

  return { validerRevision, validerEntree, devaliderEntree }
}
