/**
 * Mini-mois de la cellule « calendrier » du bento. Visible à partir de 768px
 * seulement (section 7.2) : sous cette largeur, la place manque et le
 * calendrier plein écran est à un tap.
 */
import { useMemo } from 'react'
import { startOfMonth } from 'date-fns'
import type { Category, Review, Topic } from '../types'
import { fromKey, type DateKey } from '../lib/dates'
import { densite, grilleDuMois } from '../lib/calendrier'

interface MiniMoisProps {
  topics: Topic[]
  reviews: Review[]
  categories: Category[]
  aujourdhui: DateKey
}

export function MiniMois({ topics, reviews, categories, aujourdhui }: MiniMoisProps) {
  const jours = useMemo(
    () => grilleDuMois(topics, reviews, categories, startOfMonth(fromKey(aujourdhui))),
    [topics, reviews, categories, aujourdhui],
  )

  return (
    <div className="mini-mois" aria-hidden="true">
      {jours.map((jour) => {
        const classes = [
          'mini-mois__jour',
          jour.dansLeMois ? null : 'mini-mois__jour--hors',
          jour.cle === aujourdhui ? 'mini-mois__jour--aujourdhui' : null,
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <span key={jour.cle} className={classes}>
            {jour.numero}
            <span className="mini-mois__points">
              {Array.from({ length: densite(jour.restantes) }, (_, index) => (
                <span key={index} className="mini-mois__point" />
              ))}
            </span>
          </span>
        )
      })}
    </div>
  )
}
