/**
 * Toast (section 8.10). Ancré en bas, au-dessus du FAB, largeur limitée.
 *
 * Deux usages seulement, et c'est une contrainte : validation annulable et
 * mise à jour du Service Worker disponible. Ce n'est pas un canal de
 * notification générique.
 */
import { Bouton } from './Bouton'

interface ToastProps {
  texte: string
  /** Seconde ligne discrète : « Prochaines dates ajustées ». */
  detail?: string
  action?: { libelle: string; onAction: () => void }
  /**
   * Ajoute « Fermer ». Réservé aux toasts qui ne s'effacent pas seuls : à
   * 320px, deux boutons plus le message ne tiennent pas sur une ligne, et un
   * toast de 5 secondes n'a pas besoin qu'on le congédie.
   */
  fermable?: boolean
  onFermer: () => void
}

export function Toast({ texte, detail, action, fermable, onFermer }: ToastProps) {
  return (
    <div className="toast" role="status" aria-live="polite">
      <div className="toast__texte">
        <p className="toast__message">{texte}</p>
        {detail && <p className="toast__detail">{detail}</p>}
      </div>

      <div className="toast__actions">
        {action && (
          <Bouton
            variante="texte"
            className="toast__action"
            onClick={() => {
              action.onAction()
              onFermer()
            }}
          >
            {action.libelle}
          </Bouton>
        )}
        {fermable && (
          <Bouton variante="texte" className="toast__action" onClick={onFermer}>
            Fermer
          </Bouton>
        )}
      </div>
    </div>
  )
}
