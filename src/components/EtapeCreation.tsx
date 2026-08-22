// SPDX-License-Identifier: AGPL-3.0-only

/**
 * La coque des trois pages de création — section 8.22 du design system.
 *
 * Elle porte ce que les trois écrans ont en commun et rien d'autre : les trois
 * segments d'avancement, la question en titre, et la barre d'action fixe en
 * bas. Chaque page apporte sa question et ses réponses.
 *
 * **La barre d'action est fixe, et la barre de navigation s'efface** (section
 * 7.3) : empiler 52 px d'action sur 58 px de navigation et la marge système,
 * c'est cent vingt pixels de chrome sous le pouce et deux barres qui se
 * disputent la même zone. Ces pages sont un parcours à sortir, pas une vue à
 * quitter — la sortie est écrite à gauche de la barre, et le retour en haut.
 */
import type { ReactNode } from 'react'
import { useTextes } from '../state/usePreferences'
import { BarreAction } from './BarreAction'

export const ETAPES_CREATION = 3

interface EtapeCreationProps {
  /** Rang de l'étape, à partir de 1. */
  rang: number
  question: string
  intro?: ReactNode
  /**
   * La sortie, à gauche : « Plus tard » sur la première, « Passer » sur la
   * deuxième. La dernière n'en a pas — il n'y a plus de question à sauter, et
   * un « Passer » y voudrait dire « créer », ce que le bouton dit déjà.
   */
  sortie?: { libelle: string; onClick: () => void }
  /** L'action, à droite. Désactivée, elle reste lisible et dit pourquoi. */
  action: { libelle: string; onClick: () => void; desactivee?: boolean }
  children: ReactNode
}

export function EtapeCreation({
  rang,
  question,
  intro,
  sortie,
  action,
  children,
}: EtapeCreationProps) {
  const t = useTextes()

  return (
    <div className="etape">
      {/*
        Trois segments plutôt qu'une barre continue : on ne mesure pas une
        progression en pourcentage quand il y a trois questions, on les compte.
        Le compte est aussi écrit dans l'en-tête, en chiffres.
      */}
      <ol
        className="etape__progression"
        aria-label={t.creation.etapeIntitule(rang, ETAPES_CREATION)}
      >
        {Array.from({ length: ETAPES_CREATION }, (_, index) => (
          <li
            key={index}
            className={
              index < rang ? 'etape__segment etape__segment--fait' : 'etape__segment'
            }
            aria-current={index + 1 === rang ? 'step' : undefined}
          />
        ))}
      </ol>

      <div className="etape__entete">
        <h1 className="titre-page">{question}</h1>
        {intro !== undefined && <p className="etape__intro">{intro}</p>}
      </div>

      <div className="etape__corps">{children}</div>

      <BarreAction sortie={sortie} action={action} />
    </div>
  )
}
