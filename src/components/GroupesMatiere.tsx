/**
 * Les éléments regroupés par matière, chaque groupe repliable.
 *
 * `<details>` natif plutôt qu'un pli maison : le clavier, la touche Entrée et
 * l'annonce « développé / réduit » viennent avec, sans un octet de JS.
 *
 * L'état plié est mémorisé dans localStorage — replier un groupe qui se
 * rouvre à chaque navigation n'aurait aucun intérêt.
 */
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Item } from '../types'
import { formatRelative, type DateKey } from '../lib/dates'
import { prochaineRevision, type Matiere } from '../lib/matieres'
import { progressionEntree } from '../lib/stats'
import type { Teintes } from '../lib/categories'
import { PastilleCategorie } from './ChipCategorie'
import { IconeChevron } from './Icons'

const CLE_STOCKAGE = 'revoir.matieres.repliees'

interface GroupesMatiereProps {
  matieres: Matiere[]
  teintes: Teintes
  aujourdhui: DateKey
}

export function GroupesMatiere({ matieres, teintes, aujourdhui }: GroupesMatiereProps) {
  const [repliees, setRepliees] = useState<Set<string>>(lireRepliees)

  const basculer = useCallback((cle: string, ouvert: boolean) => {
    setRepliees((actuelles) => {
      const suivantes = new Set(actuelles)
      if (ouvert) suivantes.delete(cle)
      else suivantes.add(cle)
      ecrireRepliees(suivantes)
      return suivantes
    })
  }, [])

  return (
    <div className="matieres">
      {matieres.map((matiere) => (
        <details
          key={matiere.cle}
          className="matiere"
          open={!repliees.has(matiere.cle)}
          onToggle={(event) => basculer(matiere.cle, event.currentTarget.open)}
        >
          {/*
            `aria-expanded` double l'état natif de <details>, que Safari
            n'expose pas toujours. Il vient de la même source que l'attribut
            `open` : les deux ne peuvent pas se désaccorder.
          */}
          <summary
            className="matiere__entete"
            aria-expanded={!repliees.has(matiere.cle)}
          >
            <IconeChevron className="matiere__chevron" width="16" height="16" />
            <PastilleCategorie categorie={matiere.nom} teintes={teintes} />
            <span className="matiere__nom">{matiere.nom}</span>
            {/*
              Un seul compteur, et un compteur nommé : « 5 restantes » tout
              seul ne disait pas restantes de quoi.
            */}
            <span className="matiere__compte">
              {matiere.items.length} élément{matiere.items.length > 1 ? 's' : ''}
            </span>
          </summary>

          <ul className="matiere__liste">
            {matiere.items.map((item) => (
              <LigneMatiere key={item.id} item={item} aujourdhui={aujourdhui} />
            ))}
          </ul>
        </details>
      ))}
    </div>
  )
}

/**
 * Deux lignes : le titre, puis quand et où on en est.
 *
 * Une seule façon de dire la progression. La frise, le pourcentage et la date
 * relative disaient tous les trois la même chose, en trois langues — il reste
 * « Demain · Révision 2 sur 5 », qui se lit sans mode d'emploi.
 */
function LigneMatiere({ item, aujourdhui }: { item: Item; aujourdhui: DateKey }) {
  const prochaine = prochaineRevision(item)

  return (
    <li className="matiere__element">
      <Link to={`/element/${item.id}`} className="matiere__lien">
        <span className="matiere__titre">{item.title}</span>
        <span className="matiere__etat">
          {prochaine === null ? (
            'terminé'
          ) : (
            <>
              {formatRelative(prochaine.date, aujourdhui)}
              {' · Révision '}
              {progressionEntree({ item, review: prochaine }).rang} sur{' '}
              {item.reviews.length}
            </>
          )}
        </span>
      </Link>
    </li>
  )
}

function lireRepliees(): Set<string> {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE)
    if (!brut) return new Set()
    const parse: unknown = JSON.parse(brut)
    return Array.isArray(parse) ? new Set(parse.filter(estChaine)) : new Set()
  } catch {
    // Stockage indisponible (navigation privée) : tout reste déplié.
    return new Set()
  }
}

function ecrireRepliees(repliees: Set<string>) {
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify([...repliees]))
  } catch {
    // Sans persistance, le pli ne survit pas à la navigation : ce n'est pas
    // une raison de casser l'affichage.
  }
}

const estChaine = (valeur: unknown): valeur is string => typeof valeur === 'string'
