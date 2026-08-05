// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Feuille glissant depuis le bas (section 8.11).
 *
 * Bâtie sur `<dialog>` natif, comme ConfirmDialog : le focus qui entre à
 * l'ouverture et revient au déclencheur à la fermeture, la touche Échap et
 * l'arrière-plan inerte sont gratuits, et aucune de ces trois choses n'est
 * simple à réécrire correctement.
 *
 * Elle se ferme de quatre façons : le bouton, Échap, un clic sur le
 * `::backdrop`, et le glissement vers le bas.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react'

/** Course au-delà de laquelle le geste ferme au lieu de revenir en place. */
const SEUIL_FERMETURE = 96

interface FeuilleBasProps {
  ouverte: boolean
  titre: string
  onFermer: () => void
  /**
   * Ce que le focus vise à l'ouverture, à la place du corps.
   *
   * Une feuille qu'on lit vise son corps : l'anneau ne doit pas se poser sur
   * « Fermer », qui est une sortie et non une action. L'argument tombe pour une
   * feuille qui n'existe que pour qu'on y écrive — l'y laisser imposerait un
   * geste de plus avant d'atteindre le premier champ.
   */
  cibleFocus?: RefObject<HTMLElement | null>
  children: ReactNode
}

export function FeuilleBas({
  ouverte,
  titre,
  onFermer,
  cibleFocus,
  children,
}: FeuilleBasProps) {
  const reference = useRef<HTMLDialogElement>(null)
  const corps = useRef<HTMLDivElement>(null)
  const depart = useRef<number | null>(null)
  const [course, setCourse] = useState(0)

  useEffect(() => {
    const feuille = reference.current
    if (!feuille) return
    if (ouverte && !feuille.open) {
      feuille.showModal()
      // `showModal` viserait le premier élément focalisable — le bouton
      // « Fermer », annoncé avant la date et cerclé d'un anneau de focus dès
      // l'ouverture. On prend la feuille elle-même : le lecteur d'écran lit
      // son intitulé, et la première tabulation mène au bouton. Sauf si
      // l'appelant désigne un champ : la visée doit alors avoir lieu ici,
      // après `showModal` — `autoFocus` a tiré à blanc au montage, bien avant
      // que la feuille ne s'ouvre.
      ;(cibleFocus?.current ?? corps.current)?.focus()
    }
    if (!ouverte && feuille.open) feuille.close()
  }, [ouverte, cibleFocus])

  // Une feuille rouverte repart du bas, jamais de la position où le geste
  // précédent l'avait laissée.
  useEffect(() => {
    if (ouverte) setCourse(0)
  }, [ouverte])

  const terminer = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (depart.current === null) return
      const parcourue = event.clientY - depart.current
      depart.current = null
      if (parcourue > SEUIL_FERMETURE) onFermer()
      else setCourse(0)
    },
    [onFermer],
  )

  /*
   * Le geste ne part que de l'en-tête : plus bas, un glissement vertical
   * appartient à la liste, qui défile. Vers le haut, la feuille ne bouge pas —
   * elle n'a qu'une position ouverte.
   */
  const suivre = (event: PointerEvent<HTMLElement>) => {
    if (depart.current === null) return
    setCourse(Math.max(0, event.clientY - depart.current))
  }

  const saisir = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse') return
    depart.current = event.clientY
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  return (
    <dialog
      ref={reference}
      className="feuille"
      aria-label={titre}
      style={course > 0 ? { transform: `translateY(${course}px)` } : undefined}
      onCancel={(event) => {
        // Échap : c'est l'état de la page qui referme la feuille, pas le
        // navigateur, sans quoi React la rouvrirait au rendu suivant.
        event.preventDefault()
        onFermer()
      }}
      onClick={(event) => {
        if (event.target === reference.current) onFermer()
      }}
    >
      <div className="feuille__corps" ref={corps} tabIndex={-1}>
        <header
          className="feuille__entete"
          onPointerDown={saisir}
          onPointerMove={suivre}
          onPointerUp={terminer}
          onPointerCancel={terminer}
        >
          <span className="feuille__poignee" aria-hidden="true" />
          <div className="feuille__barre">
            <h2 className="feuille__titre">{titre}</h2>
            <button type="button" className="feuille__fermer" onClick={onFermer}>
              Fermer
            </button>
          </div>
        </header>

        <div className="feuille__contenu">{children}</div>
      </div>
    </dialog>
  )
}
