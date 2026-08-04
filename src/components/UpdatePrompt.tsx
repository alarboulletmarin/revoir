import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useToast } from '../state/useToast'

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

  useEffect(() => {
    if (!needRefresh) return
    afficherToast({
      texte: 'Une nouvelle version est disponible.',
      action: {
        libelle: 'Mettre à jour',
        onAction: () => void updateServiceWorker(true),
      },
      duree: 0,
    })
  }, [needRefresh, updateServiceWorker, afficherToast])

  return null
}

function useMiseAJour() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  return { needRefresh, updateServiceWorker }
}
