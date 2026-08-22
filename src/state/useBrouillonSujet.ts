// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Le brouillon de création, porté d'une page à l'autre.
 *
 * Pas de contexte, pas de fournisseur : les trois pages sont des routes
 * sœurs, elles se démontent l'une après l'autre, et un état partagé en
 * mémoire n'aurait servi qu'à survivre à ce démontage — ce que le
 * `sessionStorage` fait déjà, en survivant en plus au rechargement de la page.
 *
 * La validation vit dans `lib/brouillon.ts`, avec ses tests : ce qui sort du
 * stockage est une donnée extérieure, et ce n'est pas à un hook d'en décider.
 */
import { useCallback, useState } from 'react'
import {
  CLE_BROUILLON,
  brouillonVide,
  lireBrouillon,
  type BrouillonSujet,
} from '../lib/brouillon'

function lire(): BrouillonSujet {
  try {
    const brut = sessionStorage.getItem(CLE_BROUILLON)
    return lireBrouillon(brut === null ? null : JSON.parse(brut))
  } catch {
    // Stockage indisponible ou contenu illisible : on repart d'un brouillon
    // neuf. La création reste possible, elle ne franchit simplement pas un
    // rechargement.
    return brouillonVide()
  }
}

function ecrire(brouillon: BrouillonSujet): void {
  try {
    sessionStorage.setItem(CLE_BROUILLON, JSON.stringify(brouillon))
  } catch {
    // Sans persistance, le brouillon ne vit que le temps de la navigation :
    // ce n'est pas une raison de refuser la saisie.
  }
}

export function effacerBrouillon(): void {
  try {
    sessionStorage.removeItem(CLE_BROUILLON)
  } catch {
    // Rien à nettoyer si rien n'a pu être écrit.
  }
}

export function useBrouillonSujet() {
  const [brouillon, setBrouillon] = useState<BrouillonSujet>(lire)

  /**
   * Une modification partielle, écrite aussitôt. Le brouillon n'a pas de
   * moment d'enregistrement : chaque réponse est acquise dès qu'elle est
   * donnée, et c'est ce qui rend le retour en arrière sans conséquence.
   */
  const majBrouillon = useCallback((partiel: Partial<BrouillonSujet>) => {
    setBrouillon((precedent) => {
      const suivant = { ...precedent, ...partiel }
      ecrire(suivant)
      return suivant
    })
  }, [])

  return { brouillon, majBrouillon }
}
