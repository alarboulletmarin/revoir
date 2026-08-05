// SPDX-License-Identifier: AGPL-3.0-only

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { addMonths, startOfMonth, subMonths } from 'date-fns'
import { useDonnees } from '../state/useDonnees'
import { useValidation } from '../state/useValidation'
import { usePanneauOuvert, useTitrePage } from '../state/useTitrePage'
import type { Category } from '../types'
import { useAujourdhui } from '../state/useAujourdhui'
import { formatLong, formatMonth, fromKey, toKey, type DateKey } from '../lib/dates'
import { entriesForDate } from '../lib/stats'
import { teinteDe } from '../lib/categories'
import {
  densite,
  deplacementClavier,
  grilleDuMois,
  joursSemaine,
  type JourCalendrier,
} from '../lib/calendrier'
import { textes } from '../i18n'
import { useTextes } from '../state/usePreferences'
import { LigneRevision } from '../components/LigneRevision'
import { FeuilleBas } from '../components/FeuilleBas'
import { Bouton } from '../components/Bouton'
import { IconeChevron } from '../components/Icons'
import { proprietesTeinte } from '../components/teinte'

export function CalendarPage() {
  const t = useTextes()
  useTitrePage(t.calendrier.titre)
  const { topics, reviews, categories } = useDonnees()
  const { validerEntree, devaliderEntree } = useValidation()
  const aujourdhui = useAujourdhui()

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

  const jours = useMemo(
    () => grilleDuMois(topics, reviews, categories, mois),
    [topics, reviews, categories, mois],
  )
  const entrees = useMemo(
    () => (choisi ? entriesForDate(topics, reviews, choisi) : []),
    [topics, reviews, choisi],
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
      <h1 className="page__titre">{t.calendrier.titre}</h1>

      <section className="calendrier">
        <div className="calendrier__entete">
          <button
            type="button"
            className="calendrier__fleche"
            aria-label={t.calendrier.moisPrecedent}
            onClick={() => allerAuMois(subMonths(mois, 1))}
          >
            <IconeChevron direction="gauche" />
          </button>
          <h2 className="calendrier__mois">{formatMonth(mois)}</h2>
          <button
            type="button"
            className="calendrier__fleche"
            aria-label={t.calendrier.moisSuivant}
            onClick={() => allerAuMois(addMonths(mois, 1))}
          >
            <IconeChevron direction="droite" />
          </button>
        </div>

        <div className="calendrier__jours" aria-hidden="true">
          {joursSemaine().map((jour, index) => (
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
                aria-label={etiquetteJour(jour, estAujourdhui, toutesFaites)}
                onClick={() => choisir(jour.cle)}
                onFocus={() => setAncre(jour.cle)}
                onKeyDown={(event) => surTouche(event, jour.cle)}
              >
                <span className="calendrier__numero" aria-hidden="true">
                  {jour.numero}
                </span>
                <span className="calendrier__indicateurs" aria-hidden="true">
                  <span className="calendrier__points">
                    {jour.categories.slice(0, densite(jour.total)).map((categorie, index) => (
                      <span
                        key={index}
                        className={
                          toutesFaites
                            ? 'calendrier__point calendrier__point--fait'
                            : 'calendrier__point'
                        }
                        // Un sujet sans catégorie garde le point --accent :
                        // il n'y a pas de teinte à en tirer.
                        {...teinteDuPoint(categorie)}
                      />
                    ))}
                  </span>
                  {/*
                    Trois points au plus, mais on ne peut pas laisser croire
                    qu'un jour à sept révisions en porte trois : le reste du
                    compte s'écrit sous eux.
                  */}
                  {jour.total > densite(jour.total) && (
                    <span className="calendrier__plus">
                      +{jour.total - densite(jour.total)}
                    </span>
                  )}
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
              {t.calendrier.revenirAujourdhui}
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
          <p className="discret discret--petit">{t.calendrier.aucuneCeJour}</p>
        ) : (
          <ul className="liste-revisions liste-revisions--separee">
            {entrees.map((entree) => (
              <LigneRevision
                key={entree.review.id}
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


/** Les propriétés de teinte d'un point, ou rien pour un sujet sans catégorie. */
function teinteDuPoint(categorie: Category | null) {
  const teinte = teinteDe(categorie)
  return teinte === null ? {} : proprietesTeinte(teinte)
}

/** Catégories distinctes d'un jour, dans l'ordre d'apparition, trois au plus. */
function categoriesDuJour(categories: (Category | null)[]): string[] {
  const distinctes = new Set(
    categories.filter((categorie) => categorie !== null).map((categorie) => categorie.name),
  )
  return [...distinctes].slice(0, 3)
}

/**
 * « 6 août 2026, aujourd'hui, 7 révisions, Études, Langues ».
 *
 * Le nombre réel est annoncé même quand les points s'arrêtent à trois, et ni
 * l'état « fait » ni la catégorie ne reposent sur la seule couleur d'un point
 * de 4px — la section 3 bis l'interdit explicitement.
 */
function etiquetteJour(
  jour: JourCalendrier,
  estAujourdhui: boolean,
  toutesFaites: boolean,
): string {
  const t = textes()
  const parties = [formatLong(jour.cle)]
  if (estAujourdhui) parties.push(t.dates.relatif.aujourdhui)
  parties.push(
    jour.total === 0 ? t.commun.aucuneRevision : t.commun.revisions(jour.total),
  )
  if (toutesFaites) parties.push(t.calendrier.toutesFaites)
  parties.push(...categoriesDuJour(jour.categories))
  return parties.join(', ')
}
