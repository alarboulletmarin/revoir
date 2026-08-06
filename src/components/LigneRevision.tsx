// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Ligne de révision — le composant le plus important de l'app (section 8.2).
 *
 * Deux cibles distinctes : la case valide sans ouvrir quoi que ce soit, le
 * corps ouvre la fiche. Le geste central est la validation, il doit tomber
 * sous le pouce sans détour.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ReviewEntry } from '../types'
import { formatEcheance, formatRelative, formatShort, type DateKey } from '../lib/dates'
import { progressionEntree } from '../lib/stats'
import { estFaite, revisionsDe } from '../lib/sujets'
import { IconeCoche } from './Icons'
import { Frise } from './Frise'
import { ChipCategorie } from './ChipCategorie'
import { useDonnees } from '../state/useDonnees'
import { useTextes } from '../state/usePreferences'

/**
 * Durée de la ligne barrée avant retrait de la liste (section 8.2).
 * Correspond à --duree-moyen ; le CSS et cette constante doivent bouger
 * ensemble.
 */
const DUREE_SORTIE = 200

interface LigneRevisionProps {
  entry: ReviewEntry
  aujourdhui: DateKey
  onValider: (entry: ReviewEntry) => void
  onDevalider: (entry: ReviewEntry) => void
  /** Masque la date lorsque la liste est déjà groupée par jour. */
  masquerDate?: boolean
  /**
   * Ce qui accompagne le titre :
   *   `frise`       — la frise miniature, valeur par défaut des listes aérées ;
   *   `progression` — « Révision 2 sur 5 · Prochaine : 8 août », en toutes
   *                   lettres, avec une ligne resserrée : la feuille du
   *                   calendrier n'a ni la hauteur ni le calme d'une page
   *                   pleine pour qu'une frise s'y lise ;
   *   `aucun`       — ni l'une ni l'autre, pour la cellule héros déjà dense.
   */
  detail?: 'frise' | 'progression' | 'aucun'
}

export function LigneRevision({
  entry,
  aujourdhui,
  onValider,
  onDevalider,
  masquerDate = false,
  detail = 'frise',
}: LigneRevisionProps) {
  const { topic, review } = entry
  const t = useTextes()
  // Les catégories et les révisions viennent du contexte plutôt que d'une
  // prop : le composant est appelé depuis quatre écrans, et ce sont des
  // données d'affichage, pas d'entrée.
  const { categories, reviews } = useDonnees()
  const [partante, setPartante] = useState(false)
  const minuteur = useRef<number | undefined>(undefined)
  /** La validation retardée par l'animation de sortie, tant qu'elle n'a pas eu lieu. */
  const enAttente = useRef<(() => void) | null>(null)

  /**
   * Une validation en attente est **exécutée** au démontage, pas annulée.
   *
   * Les 200 ms qui séparent la coche du retrait de la ligne appartiennent à
   * l'animation, pas à la décision : celle-ci est prise au moment du tap. Un
   * nettoyage qui se contentait de couper le minuteur perdait la validation
   * en silence — la coche s'était affichée, la ligne s'était barrée, et rien
   * n'était écrit. Il suffisait de refermer la feuille du calendrier ou
   * d'ouvrir la fiche dans la foulée.
   */
  useEffect(
    () => () => {
      window.clearTimeout(minuteur.current)
      const differee = enAttente.current
      enAttente.current = null
      differee?.()
    },
    [],
  )

  const revisions = useMemo(
    () => revisionsDe(topic.id, reviews),
    [topic.id, reviews],
  )
  const categorie =
    categories.find((candidate) => candidate.id === topic.categoryId) ?? null

  const faite = estFaite(review)
  const enRetard = !faite && review.dueDate < aujourdhui
  const coche = faite || partante

  const basculer = () => {
    if (faite) {
      onDevalider(entry)
      return
    }
    if (partante) return
    // Mise à jour optimiste : la coche et la ligne barrée sont immédiates,
    // le retrait de la liste suit 200 ms plus tard.
    setPartante(true)
    enAttente.current = () => onValider(entry)
    minuteur.current = window.setTimeout(() => {
      const differee = enAttente.current
      enAttente.current = null
      differee?.()
    }, DUREE_SORTIE)
  }

  // Le retard ne se signale que par sa mention, en toutes lettres : aucune
  // bande de couleur en bord de ligne.
  const classes = [
    'ligne-revision',
    coche ? 'ligne-revision--faite' : null,
    detail === 'progression' ? 'ligne-revision--compact' : null,
  ]
    .filter(Boolean)
    .join(' ')

  const progression =
    detail === 'progression' ? progressionEntree(review, revisions) : null

  return (
    <li className={classes}>
      <button
        type="button"
        className="ligne-revision__case"
        role="checkbox"
        aria-checked={coche}
        aria-label={
          faite
            ? t.ligne.decocher(topic.title, t.programmes.decalage(review.intervalInDays))
            : t.ligne.valider(topic.title, t.programmes.decalage(review.intervalInDays))
        }
        onClick={basculer}
      >
        <span className="ligne-revision__cercle">
          {coche && <IconeCoche className="ligne-revision__coche" />}
        </span>
      </button>

      <Link to={`/sujet/${topic.id}`} className="ligne-revision__corps">
        <span className="ligne-revision__titre">{topic.title}</span>

        <span className="ligne-revision__meta">
          <ChipCategorie categorie={categorie} />
          {!masquerDate && (
            <time className="ligne-revision__date" dateTime={review.dueDate}>
              {formatShort(review.dueDate)}
            </time>
          )}
          {enRetard && (
            <span className="ligne-revision__retard">
              {formatRelative(review.dueDate, aujourdhui)}
            </span>
          )}
          {/*
            Où en est le programme, écrit plutôt que tracé. La prochaine
            échéance ne s'affiche que s'il en reste une : pas de place
            réservée pour une information absente.
          */}
          {progression && (
            <span className="ligne-revision__progression">
              {t.ligne.progression(progression.rang, progression.total)}
              {progression.suivante !== null && (
                <>
                  {` · ${t.ligne.prochaine}`}
                  <time dateTime={progression.suivante}>
                    {formatEcheance(progression.suivante, review.dueDate)}
                  </time>
                </>
              )}
            </span>
          )}
        </span>

        {detail === 'frise' && (
          <Frise
            origine={topic.startDate}
            reviews={revisions}
            aujourdhui={aujourdhui}
            variante="mini"
            intitule={topic.title}
          />
        )}
      </Link>
    </li>
  )
}
