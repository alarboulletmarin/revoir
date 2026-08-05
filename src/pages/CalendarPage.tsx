import { useEffect, useMemo, useState } from 'react'
import { addMonths, startOfMonth, subMonths } from 'date-fns'
import { useItems } from '../state/useItems'
import { useValidation } from '../state/useValidation'
import { usePanneauOuvert, useTitrePage } from '../state/useTitrePage'
import { formatLong, formatMonth, fromKey, toKey, todayKey } from '../lib/dates'
import { entriesForDate } from '../lib/stats'
import { JOURS_SEMAINE, densite, grilleDuMois } from '../lib/calendrier'
import { ItemRevision } from '../components/ItemRevision'
import { Bouton } from '../components/Bouton'
import { IconeChevron } from '../components/Icons'

export function CalendarPage() {
  useTitrePage('Calendrier')
  const { items } = useItems()
  const { validerEntree, devaliderEntree } = useValidation()
  const aujourdhui = todayKey()

  const [mois, setMois] = useState(() => startOfMonth(fromKey(aujourdhui)))
  const [choisi, setChoisi] = useState<string | null>(null)

  usePanneauOuvert(choisi !== null)

  // Échap ferme le panneau, comme une feuille modale.
  useEffect(() => {
    if (choisi === null) return
    const surTouche = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setChoisi(null)
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [choisi])

  const jours = useMemo(() => grilleDuMois(items, mois), [items, mois])
  const entrees = useMemo(
    () => (choisi ? entriesForDate(items, choisi) : []),
    [items, choisi],
  )

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
            onClick={() => setMois(subMonths(mois, 1))}
          >
            <IconeChevron direction="gauche" />
          </button>
          <h2 className="calendrier__mois">{formatMonth(mois)}</h2>
          <button
            type="button"
            className="calendrier__fleche"
            aria-label="Mois suivant"
            onClick={() => setMois(addMonths(mois, 1))}
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
            const classes = [
              'calendrier__case',
              jour.dansLeMois ? null : 'calendrier__case--hors',
              jour.cle === aujourdhui ? 'calendrier__case--aujourdhui' : null,
              jour.cle === choisi ? 'calendrier__case--choisi' : null,
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button
                key={jour.cle}
                type="button"
                className={classes}
                aria-pressed={jour.cle === choisi}
                aria-label={`${formatLong(jour.cle)}, ${etiquette(jour.total)}`}
                onClick={() => setChoisi(jour.cle)}
              >
                <span aria-hidden="true">{jour.numero}</span>
                <span className="calendrier__points" aria-hidden="true">
                  {Array.from({ length: densite(jour.total) }, (_, index) => (
                    <span
                      key={index}
                      className={
                        jour.restantes === 0
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
              onClick={() => setMois(startOfMonth(fromKey(aujourdhui)))}
            >
              Revenir à aujourd'hui
            </Bouton>
          </div>
        )}
      </section>

      {/* Panneau du jour, glissant depuis le bas (section 8.11). */}
      {choisi && (
        <aside
          className="panneau"
          role="dialog"
          aria-modal="true"
          aria-label={formatLong(choisi)}
        >
          <div className="panneau__entete">
            <h2 className="panneau__titre">{formatLong(choisi)}</h2>
            <Bouton variante="texte" onClick={() => setChoisi(null)}>
              Fermer
            </Bouton>
          </div>

          {entrees.length === 0 ? (
            <p className="discret">Aucune révision ce jour-là.</p>
          ) : (
            <ul className="liste-revisions">
              {entrees.map((entree) => (
                <ItemRevision
                  key={`${entree.item.id}-${entree.review.offset}`}
                  entry={entree}
                  aujourdhui={aujourdhui}
                  onValider={validerEntree}
                  onDevalider={devaliderEntree}
                  masquerDate
                />
              ))}
            </ul>
          )}
        </aside>
      )}
    </>
  )
}

const etiquette = (total: number) =>
  total === 0 ? 'aucune révision' : `${total} révision${total > 1 ? 's' : ''}`
