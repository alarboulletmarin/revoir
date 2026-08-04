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
import { prochaineEcheance, type Matiere } from '../lib/matieres'
import { itemProgress } from '../lib/stats'
import type { Teintes } from '../lib/categories'
import { PastilleCategorie } from './ChipCategorie'
import { Frise } from './Frise'
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
          <summary className="matiere__entete">
            <IconeChevron className="matiere__chevron" width="16" height="16" />
            <PastilleCategorie categorie={matiere.nom} teintes={teintes} />
            <span className="matiere__nom">{matiere.nom}</span>
            {/*
              Le nombre d'éléments s'efface sous 480px : à 320px, le compteur
              complet ne laisse plus assez de place au nom de la matière.
            */}
            <span className="matiere__compte">
              <span className="matiere__elements">
                {matiere.items.length} élément{matiere.items.length > 1 ? 's' : ''} ·{' '}
              </span>
              {matiere.restantes} restante{matiere.restantes > 1 ? 's' : ''}
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

function LigneMatiere({ item, aujourdhui }: { item: Item; aujourdhui: DateKey }) {
  const prochaine = prochaineEcheance(item)

  return (
    <li className="matiere__element">
      <Link to={`/element/${item.id}`} className="matiere__lien">
        <span className="matiere__titre">{item.title}</span>
        <span className="matiere__etat">
          {prochaine === null
            ? 'terminé'
            : formatRelative(prochaine, aujourdhui)}{' '}
          · {itemProgress(item)} %
        </span>
        <Frise
          origine={item.startDate}
          reviews={item.reviews}
          aujourdhui={aujourdhui}
          variante="mini"
          intitule={item.title}
        />
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
