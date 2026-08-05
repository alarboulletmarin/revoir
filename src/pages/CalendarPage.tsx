import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { addMonths, startOfMonth, subMonths } from 'date-fns'
import { useItems } from '../state/useItems'
import { useValidation } from '../state/useValidation'
import { usePanneauOuvert, useTitrePage } from '../state/useTitrePage'
import { formatLong, formatMonth, fromKey, toKey, todayKey, type DateKey } from '../lib/dates'
import { entriesForDate } from '../lib/stats'
import {
  JOURS_SEMAINE,
  densite,
  deplacementClavier,
  grilleDuMois,
} from '../lib/calendrier'
import { ItemRevision } from '../components/ItemRevision'
import { FeuilleBas } from '../components/FeuilleBas'
import { Bouton } from '../components/Bouton'
import { IconeChevron } from '../components/Icons'

export function CalendarPage() {
  useTitrePage('Calendrier')
  const { items } = useItems()
  const { validerEntree, devaliderEntree } = useValidation()
  const aujourdhui = todayKey()

  const [mois, setMois] = useState(() => startOfMonth(fromKey(aujourdhui)))
  const [choisi, setChoisi] = useState<DateKey | null>(null)
  /*
   * Un seul jour est atteignable à la tabulation, les flèches font le reste
   * (« roving tabindex »). Sans cela, traverser le calendrier au clavier
   * demande quarante-deux tabulations avant d'atteindre quoi que ce soit.
   */
  const [ancre, setAncre] = useState<DateKey>(aujourdhui)

  const cases = useRef(new Map<DateKey, HTMLButtonElement>())
  const aFocaliser = useRef<DateKey | null>(null)

  usePanneauOuvert(choisi !== null)

  const jours = useMemo(() => grilleDuMois(items, mois), [items, mois])
  const entrees = useMemo(
    () => (choisi ? entriesForDate(items, choisi) : []),
    [items, choisi],
  )

  // Le focus suit le jour visé, y compris quand l'atteindre a changé de mois
  // et remonté toute une grille.
  useEffect(() => {
    const cible = aFocaliser.current
    if (cible === null) return
    aFocaliser.current = null
    cases.current.get(cible)?.focus()
  })

  /** Amène `cle` à l'écran et sous le focus, en changeant de mois s'il le faut. */
  const viser = useCallback(
    (cle: DateKey, focaliser: boolean) => {
      setAncre(cle)
      if (focaliser) aFocaliser.current = cle
      // Les jours des mois voisins sont visibles en tête et en fin de grille :
      // tant que la date y figure, rien ne bouge.
      if (!jours.some((jour) => jour.cle === cle)) {
        setMois(startOfMonth(fromKey(cle)))
      }
    },
    [jours],
  )

  /** Ouvre la feuille du jour, et cale le mois sur lui s'il vient d'à côté. */
  const choisir = (cle: DateKey) => {
    setChoisi(cle)
    setAncre(cle)
    if (!jours.some((jour) => jour.cle === cle && jour.dansLeMois)) {
      setMois(startOfMonth(fromKey(cle)))
    }
  }

  const fermer = () => {
    // Le jour rendu au focus est celui qu'on vient de consulter : après un
    // changement de mois, le bouton d'origine n'existe plus.
    if (choisi !== null) aFocaliser.current = choisi
    setChoisi(null)
  }

  const surTouche = (event: KeyboardEvent<HTMLButtonElement>, cle: DateKey) => {
    const cible = deplacementClavier(cle, event.key)
    if (cible === null) return
    event.preventDefault()
    viser(cible, true)
  }

  const allerAuMois = (suivant: Date) => {
    setMois(suivant)
    // L'ancre doit rester dans la grille affichée, sinon la tabulation ne
    // trouve plus aucun jour à atteindre.
    setAncre(toKey(startOfMonth(suivant)))
  }

  const moisCourant = toKey(mois) === toKey(startOfMonth(fromKey(aujourdhui)))

  return (
    <>
      <h1 className="page__titre">Calendrier</h1>

      <section className="calendrier">
        <div className="calendrier__entete">
          <button
            type="button"
            className="calendrier__fleche"
            aria-label="Mois précédent"
            onClick={() => allerAuMois(subMonths(mois, 1))}
          >
            <IconeChevron direction="gauche" />
          </button>
          <h2 className="calendrier__mois">{formatMonth(mois)}</h2>
          <button
            type="button"
            className="calendrier__fleche"
            aria-label="Mois suivant"
            onClick={() => allerAuMois(addMonths(mois, 1))}
          >
            <IconeChevron direction="droite" />
          </button>
        </div>

        <div className="calendrier__jours" aria-hidden="true">
          {JOURS_SEMAINE.map((jour, index) => (
            <span key={`${jour}-${index}`}>{jour}</span>
          ))}
        </div>

        <div className="calendrier__grille">
          {jours.map((jour) => {
            const estAujourdhui = jour.cle === aujourdhui
            const estChoisi = jour.cle === choisi
            const toutesFaites = jour.total > 0 && jour.restantes === 0

            const classes = [
              'calendrier__case',
              jour.dansLeMois ? null : 'calendrier__case--hors',
              estAujourdhui ? 'calendrier__case--aujourdhui' : null,
              estChoisi ? 'calendrier__case--choisi' : null,
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button
                key={jour.cle}
                type="button"
                ref={(element) => {
                  if (element) cases.current.set(jour.cle, element)
                  else cases.current.delete(jour.cle)
                }}
                className={classes}
                // Le seul jour tabulable de la grille ; les flèches déplacent
                // le focus d'une case à l'autre.
                tabIndex={jour.cle === ancre ? 0 : -1}
                aria-pressed={estChoisi}
                aria-label={etiquetteJour(jour.cle, estAujourdhui, jour.total, toutesFaites)}
                onClick={() => choisir(jour.cle)}
                onFocus={() => setAncre(jour.cle)}
                onKeyDown={(event) => surTouche(event, jour.cle)}
              >
                <span className="calendrier__numero" aria-hidden="true">
                  {jour.numero}
                </span>
                <span className="calendrier__points" aria-hidden="true">
                  {Array.from({ length: densite(jour.total) }, (_, index) => (
                    <span
                      key={index}
                      className={
                        toutesFaites
                          ? 'calendrier__point calendrier__point--fait'
                          : 'calendrier__point'
                      }
                    />
                  ))}
                </span>
              </button>
            )
          })}
        </div>

        {!moisCourant && (
          <div className="calendrier__entete">
            <Bouton
              variante="texte"
              onClick={() => allerAuMois(startOfMonth(fromKey(aujourdhui)))}
            >
              Revenir à aujourd'hui
            </Bouton>
          </div>
        )}
      </section>

      <FeuilleBas
        ouverte={choisi !== null}
        titre={choisi === null ? '' : formatLong(choisi)}
        onFermer={fermer}
      >
        {entrees.length === 0 ? (
          <p className="discret discret--petit">Aucune révision prévue ce jour-là.</p>
        ) : (
          <ul className="liste-revisions liste-revisions--separee">
            {entrees.map((entree) => (
              <ItemRevision
                key={`${entree.item.id}-${entree.review.offset}`}
                entry={entree}
                aujourdhui={aujourdhui}
                onValider={validerEntree}
                onDevalider={devaliderEntree}
                masquerDate
                detail="progression"
              />
            ))}
          </ul>
        )}
      </FeuilleBas>
    </>
  )
}


/**
 * « 6 août 2026, aujourd'hui, 3 révisions, toutes faites ». Le nombre réel
 * est annoncé même au-delà de trois points, et l'état « fait » n'est pas
 * porté par la seule couleur des points.
 */
function etiquetteJour(
  cle: DateKey,
  estAujourdhui: boolean,
  total: number,
  toutesFaites: boolean,
): string {
  const parties = [formatLong(cle)]
  if (estAujourdhui) parties.push("aujourd'hui")
  parties.push(total === 0 ? 'aucune révision' : `${total} révision${total > 1 ? 's' : ''}`)
  if (toutesFaites) parties.push('toutes faites')
  return parties.join(', ')
}
