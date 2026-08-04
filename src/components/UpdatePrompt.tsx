import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/** Duree d'affichage du message « prete hors ligne », purement informatif. */
const OFFLINE_NOTICE_MS = 6000

/**
 * Toast affiché lorsqu'une nouvelle version a été mise en cache par le
 * Service Worker. L'utilisateur choisit le moment du rechargement.
 */
export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  // Le message hors ligne s'efface seul ; celui de mise à jour attend une
  // décision de l'utilisateur.
  useEffect(() => {
    if (!offlineReady || needRefresh) return
    const timer = setTimeout(() => setOfflineReady(false), OFFLINE_NOTICE_MS)
    return () => clearTimeout(timer)
  }, [offlineReady, needRefresh, setOfflineReady])

  if (!offlineReady && !needRefresh) return null

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div className="toast" role="status" aria-live="polite">
      <p className="toast__text">
        {needRefresh
          ? 'Une nouvelle version est disponible.'
          : 'Revoir est prête à fonctionner hors ligne.'}
      </p>
      <div className="toast__actions">
        {needRefresh && (
          <button
            type="button"
            className="button button--small"
            onClick={() => void updateServiceWorker(true)}
          >
            Mettre à jour
          </button>
        )}
        <button type="button" className="button button--small button--ghost" onClick={close}>
          Fermer
        </button>
      </div>
    </div>
  )
}
