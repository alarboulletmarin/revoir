// SPDX-License-Identifier: AGPL-3.0-only

import { useContext } from 'react'
import { PreferencesContext, type PreferencesContextValue } from './PreferencesContext'
import type { Dictionnaire } from '../i18n'

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error(
      'usePreferences doit être utilisé à l’intérieur de <PreferencesProvider>.',
    )
  }
  return context
}

/**
 * Le dictionnaire de la langue active, abonné au changement.
 *
 * C'est par là que passent les composants — jamais par `textes()`, qui ne
 * réveille personne. Le nom est court parce qu'il apparaît dans chaque fichier
 * de l'interface : `const t = useTextes()`.
 */
export function useTextes(): Dictionnaire {
  return usePreferences().t
}
