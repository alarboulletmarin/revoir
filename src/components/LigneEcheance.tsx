// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Une échéance à venir, en rangée réglée : la date, le sujet, sa catégorie.
 *
 * Ce n'est pas une `LigneRevision` amaigrie, c'est autre chose : on ne coche
 * pas ici. « Ensuite » se lit, il ne s'actionne pas — la validation appartient
 * à la liste du jour, où elle tombe sous le pouce sans risque de solder une
 * échéance de la semaine prochaine d'un geste de trop. La rangée ouvre la
 * fiche, et « Tout voir » mène à la liste complète, qui coche.
 *
 * La date passe en premier parce que c'est ce qui range la liste : à chasse
 * fixe, les trois dates s'alignent en colonne et se comparent d'un regard.
 */
import { Link } from 'react-router-dom'
import type { ReviewEntry } from '../types'
import { formatShort } from '../lib/dates'
import { PastilleCategorie } from './ChipCategorie'
import { useDonnees } from '../state/useDonnees'

interface LigneEcheanceProps {
  entry: ReviewEntry
}

export function LigneEcheance({ entry }: LigneEcheanceProps) {
  const { topic, review } = entry
  const { categories } = useDonnees()
  const categorie =
    categories.find((candidate) => candidate.id === topic.categoryId) ?? null

  return (
    <li className="ligne-echeance">
      <Link to={`/sujet/${topic.id}`} className="ligne-echeance__lien">
        <time className="ligne-echeance__date" dateTime={review.dueDate}>
          {formatShort(review.dueDate)}
        </time>
        <span className="ligne-echeance__titre">{topic.title}</span>
        {/*
          Le nom accompagne la pastille, ici comme partout (section 3 bis) :
          les huit teintes ont des luminances voisines et ne se distinguent pas
          en niveaux de gris. Une pastille seule serait un code à mémoriser.
        */}
        {categorie !== null && (
          <span className="ligne-echeance__categorie">
            {categorie.name}
            <PastilleCategorie categorie={categorie} />
          </span>
        )}
      </Link>
    </li>
  )
}
