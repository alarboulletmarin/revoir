/**
 * Item de révision — le composant le plus important de l'app (section 8.2).
 *
 * Deux cibles distinctes : la case valide sans ouvrir quoi que ce soit, le
 * corps ouvre la fiche. Le geste central est la validation, il doit tomber
 * sous le pouce sans détour.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ReviewEntry } from '../types'
import { formatEcheance, formatRelative, formatShort, type DateKey } from '../lib/dates'
import { progressionEntree } from '../lib/stats'
import { IconeCoche } from './Icons'
import { Frise } from './Frise'
import { ChipCategorie } from './ChipCategorie'
import { useItems } from '../state/useItems'

/**
 * Durée de la ligne barrée avant retrait de la liste (section 8.2).
 * Correspond à --duree-moyen ; le CSS et cette constante doivent bouger
 * ensemble.
 */
const DUREE_SORTIE = 200

interface ItemRevisionProps {
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

export function ItemRevision({
  entry,
  aujourdhui,
  onValider,
  onDevalider,
  masquerDate = false,
  detail = 'frise',
}: ItemRevisionProps) {
  const { item, review } = entry
  // Les teintes viennent du contexte plutôt que d'une prop : le composant est
  // appelé depuis trois écrans, et c'est une donnée d'affichage, pas d'entrée.
  const { teintes } = useItems()
  const [partante, setPartante] = useState(false)
  const minuteur = useRef<number | undefined>(undefined)

  // Le composant disparaît normalement avant la fin du minuteur ; le nettoyage
  // couvre le cas où l'utilisateur quitte l'écran entre-temps.
  useEffect(() => () => window.clearTimeout(minuteur.current), [])

  const enRetard = !review.done && review.date < aujourdhui
  const coche = review.done || partante

  const basculer = () => {
    if (review.done) {
      onDevalider(entry)
      return
    }
    if (partante) return
    // Mise à jour optimiste : la coche et la ligne barrée sont immédiates,
    // le retrait de la liste suit 200 ms plus tard.
    setPartante(true)
    minuteur.current = window.setTimeout(() => onValider(entry), DUREE_SORTIE)
  }

  // Le retard ne se signale que par sa mention, en toutes lettres : aucune
  // bande de couleur en bord de ligne.
  const classes = [
    'item-revision',
    coche ? 'item-revision--faite' : null,
    detail === 'progression' ? 'item-revision--compact' : null,
  ]
    .filter(Boolean)
    .join(' ')

  const progression = detail === 'progression' ? progressionEntree(entry) : null

  return (
    <li className={classes}>
      <button
        type="button"
        className="item-revision__case"
        role="checkbox"
        aria-checked={coche}
        aria-label={`${review.done ? 'Décocher' : 'Marquer comme revu'} : ${item.title}, révision J+${review.offset}`}
        onClick={basculer}
      >
        <span className="item-revision__cercle">
          {coche && <IconeCoche className="item-revision__coche" />}
        </span>
      </button>

      <Link to={`/element/${item.id}`} className="item-revision__corps">
        <span className="item-revision__titre">{item.title}</span>

        <span className="item-revision__meta">
          <ChipCategorie categorie={item.category} teintes={teintes} />
          {!masquerDate && (
            <time className="item-revision__date" dateTime={review.date}>
              {formatShort(review.date)}
            </time>
          )}
          {enRetard && (
            <span className="item-revision__retard">
              {formatRelative(review.date, aujourdhui)}
            </span>
          )}
          {/*
            Où en est le programme, écrit plutôt que tracé. La prochaine
            échéance ne s'affiche que s'il en reste une : pas de place
            réservée pour une information absente.
          */}
          {progression && (
            <span className="item-revision__progression">
              Révision {progression.rang} sur {progression.total}
              {progression.suivante !== null && (
                <>
                  {' · Prochaine : '}
                  <time dateTime={progression.suivante}>
                    {formatEcheance(progression.suivante, review.date)}
                  </time>
                </>
              )}
            </span>
          )}
        </span>

        {detail === 'frise' && (
          <Frise
            origine={item.startDate}
            reviews={item.reviews}
            aujourdhui={aujourdhui}
            variante="mini"
            intitule={item.title}
          />
        )}
      </Link>
    </li>
  )
}
