/**
 * Un tableau de suivi, pour une catégorie (section 8.13).
 *
 * C'est un vrai `<table>`, y compris sur un téléphone. Le transformer en
 * cartes ferait perdre exactement ce qu'on vient y chercher : comparer les
 * sujets verticalement, les étapes horizontalement, et voir les trous. La
 * réponse au petit écran n'est pas de supprimer le défilement horizontal mais
 * de le rendre lisible — colonne du sujet figée, en-tête figé, mode compact.
 *
 * TanStack Table fournit le modèle (colonnes, lignes, cellules) et rien
 * d'autre : le balisage, le CSS et l'accessibilité restent ici.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import type { Review, Topic } from '../types'
import { formatLong, type DateKey } from '../lib/dates'
import {
  colonnesCategorie,
  lignesCategorie,
  type CelluleSuivi,
  type ColonneSuivi,
  type EtatCellule,
  type LigneSuivi,
  type ModeColonnes,
} from '../lib/suivi'
import { LIBELLES_PRATIQUE } from './SelecteurPratique'
import { MarqueCellule } from './MarqueCellule'

/** Aucune fonctionnalité au-delà du cœur : ni tri, ni filtre, ni pagination. */
const features = tableFeatures({})
const helper = createColumnHelper<typeof features, LigneSuivi>()

/** Ce qu'une cellule touchée fait remonter à la page. */
export type CelluleVisee =
  | { type: 'revision'; topicId: string; reviewId: string }
  | { type: 'pratique'; topicId: string }

interface TableauSuiviProps {
  nom: string
  topics: Topic[]
  reviews: Review[]
  mode: ModeColonnes
  aujourdhui: DateKey
  onCellule: (visee: CelluleVisee) => void
  /** N'affiche l'astuce de défilement que sur le premier tableau de la page. */
  astuce?: boolean
}

export function TableauSuivi({
  nom,
  topics,
  reviews,
  mode,
  aujourdhui,
  onCellule,
  astuce = false,
}: TableauSuiviProps) {
  const colonnes = useMemo(
    () => colonnesCategorie(topics, reviews, mode),
    [topics, reviews, mode],
  )
  const data = useMemo(
    () => lignesCategorie(topics, reviews, colonnes, aujourdhui),
    [topics, reviews, colonnes, aujourdhui],
  )

  const columns = useMemo(
    () =>
      helper.columns([
        helper.display({
          id: 'sujet',
          header: 'Sujet',
          cell: ({ row }) => (
            <Link to={`/sujet/${row.original.topic.id}`} className="suivi__lien">
              {row.original.topic.title}
            </Link>
          ),
        }),
        ...colonnes.map((colonne, index) =>
          helper.display({
            id: colonne.cle,
            header: () => (
              <>
                <span aria-hidden="true">{colonne.libelle}</span>
                <span className="invisible">{colonne.description}</span>
              </>
            ),
            cell: ({ row }) => (
              <Cellule
                cellule={row.original.cellules[index]}
                colonne={colonne}
                titre={row.original.topic.title}
                onOuvrir={() =>
                  onCellule({
                    type: 'revision',
                    topicId: row.original.topic.id,
                    reviewId: row.original.cellules[index].review!.id,
                  })
                }
              />
            ),
          }),
        ),
        helper.display({
          id: 'pratique',
          header: 'Pratique',
          cell: ({ row }) => (
            <button
              type="button"
              className="suivi__pratique"
              onClick={() =>
                onCellule({ type: 'pratique', topicId: row.original.topic.id })
              }
            >
              <span aria-hidden="true">
                {LIBELLES_PRATIQUE[row.original.topic.practiceStatus]}
              </span>
              <span className="invisible">
                Pratique de {row.original.topic.title} :{' '}
                {LIBELLES_PRATIQUE[row.original.topic.practiceStatus]}. Changer.
              </span>
            </button>
          ),
        }),
      ]),
    [colonnes, onCellule],
  )

  const table = useTable({ features, columns, data })
  const cadre = useRef<HTMLDivElement>(null)
  const deborde = useDebordement(cadre, colonnes.length)

  return (
    <>
      {/*
        Un conteneur qui défile doit être atteignable au clavier, sans quoi il
        n'existe que pour la souris et le doigt.
      */}
      <div
        ref={cadre}
        className="suivi__cadre"
        role="region"
        tabIndex={0}
        aria-label={`Tableau de suivi — ${nom}`}
      >
        <table className="suivi__table">
          <caption className="invisible">
            Suivi de {nom} : un sujet par ligne, une étape de révision par
            colonne.
          </caption>

          <thead>
            {table.getHeaderGroups().map((groupe) => (
              <tr key={groupe.id}>
                {groupe.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className={classeEntete(header.column.id)}
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getAllCells().map((cell) =>
                  // La colonne du sujet est l'en-tête de sa ligne : c'est elle
                  // qui la nomme, et c'est elle qui reste figée au défilement.
                  cell.column.id === 'sujet' ? (
                    <th key={cell.id} scope="row" className="suivi__sujet">
                      <table.FlexRender cell={cell} />
                    </th>
                  ) : (
                    <td
                      key={cell.id}
                      className={classeCellule(cell.column.id, 'suivi__case')}
                    >
                      <table.FlexRender cell={cell} />
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/*
        Aucune ombre ni dégradé pour signaler la suite (section 11) : une
        phrase, une fois, et la barre de défilement pour le reste.
      */}
      {astuce && deborde && (
        <p className="suivi__astuce">Faites glisser pour voir la suite.</p>
      )}
    </>
  )
}

/**
 * Le tableau dépasse-t-il son cadre ?
 *
 * `body` porte `overflow-x: hidden`, qui se propage au viewport : un tableau
 * mal contraint ne provoque pas de barre de défilement, il **rogne**. On mesure
 * donc plutôt que de supposer — et on ne promet la suite que s'il y en a une.
 */
function useDebordement(
  cadre: React.RefObject<HTMLDivElement | null>,
  colonnes: number,
): boolean {
  const [deborde, setDeborde] = useState(false)

  useEffect(() => {
    const element = cadre.current
    if (!element) return

    const mesurer = () => setDeborde(element.scrollWidth > element.clientWidth + 1)
    mesurer()

    const observateur = new ResizeObserver(mesurer)
    observateur.observe(element)
    return () => observateur.disconnect()
  }, [cadre, colonnes])

  return deborde
}

/*
 * La cellule d'angle porte les deux classes : elle est collante en haut *et* à
 * gauche. L'oublier laisserait le mot « Sujet » filer vers la gauche pendant
 * que les titres de ligne, eux, resteraient en place.
 */
function classeEntete(id: string): string {
  if (id === 'sujet') return 'suivi__entete suivi__sujet'
  if (id === 'pratique') return 'suivi__entete suivi__entete--pratique'
  return 'suivi__entete'
}

const classeCellule = (id: string, base: string) =>
  id === 'pratique' ? `${base} ${base}--pratique` : base

interface CelluleProps {
  cellule: CelluleSuivi
  colonne: ColonneSuivi
  titre: string
  onOuvrir: () => void
}

/**
 * Une case du tableau.
 *
 * Hors programme, ce n'est pas un bouton : il n'y a rien à ouvrir, et une
 * cible tactile qui ne fait rien est pire que pas de cible du tout.
 */
function Cellule({ cellule, colonne, titre, onOuvrir }: CelluleProps) {
  if (cellule.review === null) {
    return (
      <span className="suivi__marque">
        <MarqueCellule etat="hors-programme" />
        <span className="invisible">
          {titre}, {colonne.description} : hors programme.
        </span>
      </span>
    )
  }

  return (
    <button type="button" className="suivi__marque suivi__marque--action" onClick={onOuvrir}>
      <MarqueCellule etat={cellule.etat} />
      <span className="invisible">
        {titre}, {colonne.description}, {decrireEtat(cellule.etat)}{' '}
        {formatLong(cellule.review.dueDate)}.
      </span>
    </button>
  )
}

/** Une forme ne se lit pas : chaque case dit son état en toutes lettres. */
function decrireEtat(etat: EtatCellule): string {
  switch (etat) {
    case 'faite':
      return 'effectuée, prévue le'
    case 'aujourdhui':
      return 'à effectuer aujourd’hui,'
    case 'retard':
      return 'en retard depuis le'
    default:
      return 'à venir le'
  }
}
