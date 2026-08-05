// SPDX-License-Identifier: AGPL-3.0-only

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Toast } from '../components/Toast'

/** Règle métier n°2 : la validation reste annulable pendant 5 secondes. */
export const DUREE_ANNULATION = 5000

export interface ToastDemande {
  texte: string
  /** Seconde ligne discrète : « Prochaines dates ajustées ». */
  detail?: string
  action?: { libelle: string; onAction: () => void }
  /** Durée d'affichage en ms. 0 = reste jusqu'à une action de l'utilisateur. */
  duree?: number
}

/** Un toast qui ne s'efface pas seul doit pouvoir être fermé à la main. */
const estFermable = (duree: number) => duree === 0

interface ToastAffiche extends ToastDemande {
  id: number
}

interface ToastContextValue {
  afficherToast: (demande: ToastDemande) => void
  fermerToast: () => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

/**
 * Un seul toast à la fois : deux messages superposés en bas d'écran se
 * disputeraient la même place que le FAB (section 7.3). Un nouveau toast
 * remplace le précédent.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastAffiche | null>(null)
  const compteur = useRef(0)
  const minuteur = useRef<number | undefined>(undefined)

  const fermerToast = useCallback(() => {
    window.clearTimeout(minuteur.current)
    setToast(null)
  }, [])

  const afficherToast = useCallback((demande: ToastDemande) => {
    window.clearTimeout(minuteur.current)
    compteur.current += 1
    const duree = demande.duree ?? DUREE_ANNULATION
    setToast({ ...demande, id: compteur.current })
    if (duree > 0) {
      minuteur.current = window.setTimeout(() => setToast(null), duree)
    }
  }, [])

  useEffect(() => () => window.clearTimeout(minuteur.current), [])

  const value = useMemo(
    () => ({ afficherToast, fermerToast }),
    [afficherToast, fermerToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Toast
          // La clé force le remontage : sans elle, deux validations d'affilée
          // ne rejoueraient pas l'animation d'entrée.
          key={toast.id}
          texte={toast.texte}
          detail={toast.detail}
          action={toast.action}
          fermable={estFermable(toast.duree ?? DUREE_ANNULATION)}
          onFermer={fermerToast}
        />
      )}
    </ToastContext.Provider>
  )
}
