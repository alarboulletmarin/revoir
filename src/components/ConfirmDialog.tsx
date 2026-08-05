import { useEffect, useRef } from 'react'
import { Bouton } from './Bouton'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * S'appuie sur <dialog> natif : gestion du focus, de la touche Échap et de
 * l'arrière-plan inerte sans code supplémentaire.
 *
 * Réservé à la suppression et au remplacement des données par un import —
 * les deux seules actions destructrices. Le reste s'annule, ne se confirme
 * pas (règle métier n°3).
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} className="dialogue" onCancel={onCancel} onClose={onCancel}>
      <div className="dialogue__corps">
        <h2 className="dialogue__titre">{title}</h2>
        <p className="dialogue__message">{message}</p>
        <div className="dialogue__actions">
          <Bouton variante="discret" onClick={onCancel}>
            Annuler
          </Bouton>
          <Bouton variante={danger ? 'danger' : 'primaire'} onClick={onConfirm}>
            {confirmLabel}
          </Bouton>
        </div>
      </div>
    </dialog>
  )
}
