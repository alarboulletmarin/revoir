// SPDX-License-Identifier: AGPL-3.0-only

import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useToast } from '../state/useToast'
import { useTextes } from '../state/usePreferences'

/**
 * Deuxième et dernier usage autorisé du toast (section 8.10) : une nouvelle
 * version a été mise en cache par le Service Worker. L'utilisateur choisit le
 * moment du rechargement, d'où une durée nulle — le toast attend une décision.
 *
 * Le message « prête hors ligne » n'est volontairement pas affiché : c'est une
 * information sur l'application, pas sur les révisions, et le toast n'est pas
 * un canal de notification générique.
 */
export function UpdatePrompt() {
  const { needRefresh, updateServiceWorker } = useMiseAJour()
  const { afficherToast } = useToast()
  const t = useTextes()

  useEffect(() => {
    if (!needRefresh) return
    afficherToast({
      texte: t.toast.miseAJour,
      action: {
        libelle: t.toast.mettreAJour,
        onAction: () => void updateServiceWorker(true),
      },
      duree: 0,
    })
  }, [needRefresh, updateServiceWorker, afficherToast, t])

  return null
}

function useMiseAJour() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  return { needRefresh, updateServiceWorker }
}
