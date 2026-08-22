// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Les deux choses que cet appareil retient de la présentation — section 8.24.
 *
 * Ni l'une ni l'autre n'appartient aux données : elles ne s'exportent pas, ne
 * s'importent pas, et ne valent que pour ce navigateur-ci. Avoir vu une
 * présentation est une chose apprise, pas une chose possédée ; et le jeu
 * d'exemple, lui, produit de vrais sujets — c'est seulement le fait de les
 * avoir demandés que l'appareil se rappelle, pour pouvoir les retirer.
 */
import { useCallback } from 'react'
import { estListeIdentifiants } from '../lib/exemple'
import { useDonnees } from './useDonnees'
import { usePreference } from './usePreference'

const CLE_ONBOARDING = 'revoir.onboarding.vu'
const CLE_EXEMPLE = 'revoir.exemple.sujets'

const estVrai = (valeur: unknown): valeur is boolean => typeof valeur === 'boolean'

/** A-t-on déjà vu la présentation sur cet appareil ? */
export function useOnboardingVu() {
  return usePreference<boolean>(CLE_ONBOARDING, false, estVrai)
}

export function useJeuExemple() {
  const { chargerJeuExemple, effacerJeuExemple } = useDonnees()
  const [sujets, setSujets] = usePreference<string[]>(
    CLE_EXEMPLE,
    [],
    estListeIdentifiants,
  )

  const charger = useCallback(async () => {
    const ids = await chargerJeuExemple()
    setSujets(ids)
  }, [chargerJeuExemple, setSujets])

  const effacer = useCallback(async () => {
    await effacerJeuExemple(sujets)
    setSujets([])
  }, [effacerJeuExemple, sujets, setSujets])

  return { charger, effacer, charge: sujets.length > 0, sujets }
}
