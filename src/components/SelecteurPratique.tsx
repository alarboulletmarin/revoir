// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Le statut de pratique d'un sujet : à faire → en cours → terminée.
 *
 * Trois choix affichés, jamais un cycle au toucher. Un tap qui ferait défiler
 * les états rendrait le changement accidentel trop facile — c'est le même
 * raisonnement qui, ailleurs dans l'app, réserve la confirmation à la
 * suppression : ici on ne confirme pas, on choisit.
 *
 * Le gabarit — radios natifs habillés en segments — est celui de `Bascule`,
 * que le thème et la langue partagent maintenant.
 */
import type { PracticeStatus } from '../types'
import { textes } from '../i18n'
import { useTextes } from '../state/usePreferences'
import { Bascule } from './Bascule'

/**
 * Le libellé d'un statut. Une fonction et non une table figée : le tableau de
 * suivi l'écrit dans ses cellules, la fiche dans son sélecteur, et les deux
 * doivent changer de langue ensemble.
 */
export function libellePratique(statut: PracticeStatus): string {
  return textes().pratique[statut]
}

const ORDRE: PracticeStatus[] = ['todo', 'in_progress', 'done']

interface SelecteurPratiqueProps {
  valeur: PracticeStatus
  onChange: (statut: PracticeStatus) => void
  /** Par défaut, le mot « Pratique » lui-même. */
  legende?: string
}

export function SelecteurPratique({
  valeur,
  onChange,
  legende,
}: SelecteurPratiqueProps) {
  const t = useTextes()

  return (
    <Bascule<PracticeStatus>
      legende={legende ?? t.pratique.legende}
      valeur={valeur}
      options={ORDRE.map((statut) => ({ valeur: statut, libelle: t.pratique[statut] }))}
      onChange={onChange}
    />
  )
}
