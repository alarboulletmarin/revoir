import { useEffect, useRef } from 'react'

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
    <dialog ref={ref} className="dialog" onCancel={onCancel} onClose={onCancel}>
      <h2 className="dialog__title">{title}</h2>
      <p className="dialog__message">{message}</p>
      <div className="dialog__actions">
        <button type="button" className="button button--ghost" onClick={onCancel}>
          Annuler
        </button>
        <button
          type="button"
          className={`button${danger ? ' button--danger' : ''}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
