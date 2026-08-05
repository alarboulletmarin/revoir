import { useEffect, useId, useRef } from 'react'
import { Bouton } from './Bouton'
import { usePanneauOuvert } from '../state/useTitrePage'

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
  const corps = useRef<HTMLDivElement>(null)
  const id = useId()

  // Une boîte de confirmation est une surface modale : le FAB s'efface
  // dessous, il ne flotte jamais par-dessus (section 7.3).
  usePanneauOuvert(open)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // `showModal` viserait « Annuler » : le bouton s'ouvre cerclé de son
      // anneau de focus alors que personne n'a tabulé. On vise le corps —
      // le lecteur d'écran lit le titre, la première tabulation mène au
      // bouton. Même parti pris que FeuilleBas.
      corps.current?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="dialogue"
      aria-labelledby={`${id}-titre`}
      aria-describedby={`${id}-message`}
      onCancel={(event) => {
        // Échap : c'est l'état de la page qui referme la boîte, pas le
        // navigateur, sans quoi le DOM et React divergeraient.
        event.preventDefault()
        onCancel()
      }}
      onClick={(event) => {
        // Clic sur le ::backdrop. La sortie par le fond ne fait qu'annuler,
        // elle ne peut donc rien détruire — comme la feuille du calendrier.
        if (event.target === ref.current) onCancel()
      }}
    >
      <div className="dialogue__corps" ref={corps} tabIndex={-1}>
        <h2 className="dialogue__titre" id={`${id}-titre`}>
          {title}
        </h2>
        <p className="dialogue__message" id={`${id}-message`}>
          {message}
        </p>
        <div className="dialogue__actions">
          <Bouton variante="discret" className="dialogue__action" onClick={onCancel}>
            Annuler
          </Bouton>
          <Bouton
            variante={danger ? 'danger' : 'primaire'}
            className="dialogue__action"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Bouton>
        </div>
      </div>
    </dialog>
  )
}
