// SPDX-License-Identifier: AGPL-3.0-only

/**
 * La frise — signature de l'application (section 2 du design system).
 *
 * L'écart entre deux graduations est proportionnel à l'écart réel entre les
 * dates, compressé en racine carrée. L'espacement de la répétition espacée
 * devient littéralement visible.
 *
 * Elle n'apparaît qu'à trois endroits : fiche d'un sujet, ligne de liste,
 * aperçu du formulaire. Une signature qui se répète cesse d'en être une.
 */
import { useEffect, useRef, useState } from 'react'
import type { Review } from '../types'
import { formatShort, todayKey, type DateKey } from '../lib/dates'
import { geometrieFrise } from '../lib/frise'

/** Sous cette largeur, un libellé chevaucherait son voisin (section 7.4). */
const LARGEUR_LIBELLE_MINIMUM = 32

export type LibellesFrise = 'aucun' | 'decalage' | 'date'

interface FriseProps {
  /** Date de départ du sujet : le `├` qui ouvre la frise. */
  origine: DateKey
  reviews: Review[]
  aujourdhui?: DateKey
  /** `mini` : 24px de haut, sans libellés, pour les items de liste. */
  variante?: 'grande' | 'mini'
  libelles?: LibellesFrise
  /** Complète l'étiquette lue par les lecteurs d'écran. */
  intitule?: string
  /**
   * La frise se trace une fois, de gauche à droite, à l'ouverture de l'écran
   * (section 6, animation n°3 de l'onboarding). Réservée à la présentation :
   * c'est là qu'il faut *montrer* que les écarts grandissent, alors qu'ailleurs
   * la frise se lit d'un coup d'œil et n'a rien à démontrer.
   */
  tracee?: boolean
}

const pourcent = (valeur: number) => `${(valeur * 100).toFixed(3)}%`

export function Frise({
  origine,
  reviews,
  aujourdhui = todayKey(),
  variante = 'grande',
  libelles = 'aucun',
  intitule,
  tracee = false,
}: FriseProps) {
  const element = useRef<HTMLDivElement>(null)
  const largeur = useLargeur(element)

  const { graduations, parcours, curseur } = geometrieFrise(origine, reviews, aujourdhui)
  if (graduations.length === 0) return null

  const faites = graduations.filter((graduation) => graduation.faite).length
  const classes = [
    'frise',
    variante === 'mini' ? 'frise--mini' : null,
    tracee ? 'frise--tracee' : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={element}
      className={classes}
      role="img"
      aria-label={resume(intitule, graduations.length, faites)}
    >
      <div className="frise__piste">
        {/* Le `├` qui ouvre la frise : la date de départ. */}
        <span className="frise__graduation frise__graduation--origine" />

        <div className="frise__segments">
          {graduations.map((graduation, index) => {
            const debut = index === 0 ? 0 : graduations[index - 1].position
            const etendue = graduation.position - debut
            // Part du segment déjà franchie par le curseur : c'est elle qui
            // est tracée en --accent, le reste reste en --trait.
            const franchi =
              etendue <= 0 ? 0 : borner((parcours - debut) / etendue)

            return (
              <div
                key={graduation.intervalInDays}
                className="frise__segment"
                style={{ flexGrow: graduation.poids }}
              >
                <span className="frise__trace" style={{ width: pourcent(franchi) }} />
                <span
                  className={
                    graduation.faite
                      ? 'frise__graduation frise__graduation--faite'
                      : 'frise__graduation'
                  }
                />
              </div>
            )
          })}
        </div>

        {/*
          Le tracé de la présentation : une bande d'un pixel qui balaie la
          frise de gauche à droite. Une seule, posée sur toute la piste, plutôt
          qu'une par segment — cinq bandes lancées ensemble se rempliraient en
          parallèle et ne raconteraient rien.
        */}
        {tracee && <span className="frise__tracage" aria-hidden="true" />}

        {/* Seul élément qui dépasse la frise. */}
        {curseur !== null && (
          <span className="frise__curseur" style={{ left: pourcent(curseur) }} />
        )}
      </div>

      {libelles !== 'aucun' && (
        <div className="frise__libelles" aria-hidden="true">
          {graduations.map((graduation) => {
            // Tant que la largeur n'est pas mesurée, on n'affiche rien plutôt
            // que d'afficher tout puis de retirer la moitié des libellés.
            const place = largeur * graduation.part >= LARGEUR_LIBELLE_MINIMUM
            if (largeur === 0 || !place) return null
            return (
              <span
                key={graduation.intervalInDays}
                className={`frise__libelle ${ancrage(graduation.position)}`}
                style={{ left: pourcent(graduation.position) }}
              >
                {libelles === 'date'
                  ? formatShort(graduation.date)
                  : `J+${graduation.intervalInDays}`}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

const borner = (valeur: number) => Math.min(1, Math.max(0, valeur))

/**
 * Un libellé centré sur la dernière graduation déborderait de la frise de la
 * moitié de sa largeur. Aux deux extrémités, on l'aligne vers l'intérieur.
 */
function ancrage(position: number): string {
  if (position >= 0.97) return 'frise__libelle--fin'
  if (position <= 0.03) return 'frise__libelle--debut'
  return 'frise__libelle--centre'
}

function resume(intitule: string | undefined, total: number, faites: number): string {
  const echeances = `${total} échéance${total > 1 ? 's' : ''}, ${faites} faite${faites > 1 ? 's' : ''}`
  return intitule ? `${intitule} : ${echeances}` : `Programme de révision : ${echeances}`
}

/**
 * Largeur rendue de la frise, en pixels. La règle des 32px de la section 7.4
 * porte sur des pixels réels : elle ne peut pas s'exprimer en CSS seul, car
 * elle dépend du poids de chaque segment.
 */
function useLargeur(reference: React.RefObject<HTMLElement | null>): number {
  const [largeur, setLargeur] = useState(0)

  useEffect(() => {
    const cible = reference.current
    if (!cible) return
    if (typeof ResizeObserver === 'undefined') {
      setLargeur(cible.getBoundingClientRect().width)
      return
    }
    const observateur = new ResizeObserver(([entree]) => {
      setLargeur(entree.contentRect.width)
    })
    observateur.observe(cible)
    return () => observateur.disconnect()
  }, [reference])

  return largeur
}
