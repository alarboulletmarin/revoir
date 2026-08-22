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
import { useNavigate } from 'react-router-dom'
import { useDonnees } from '../state/useDonnees'
import { useTitrePage } from '../state/useTitrePage'
import type { Category } from '../types'
import { useAujourdhui } from '../state/useAujourdhui'
import {
  formatAnnee,
  formatLong,
  formatMoisSeul,
  fromKey,
  toKey,
  type DateKey,
} from '../lib/dates'
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
import { Bouton } from '../components/Bouton'
import { IconeChevron } from '../components/Icons'
import { proprietesTeinte } from '../components/teinte'

export function CalendarPage() {
  const t = useTextes()
  const navigate = useNavigate()
  useTitrePage(t.calendrier.titre)
  const { topics, reviews, categories } = useDonnees()
  const aujourdhui = useAujourdhui()

  const [mois, setMois] = useState(() => startOfMonth(fromKey(aujourdhui)))
  /*
   * Un seul jour est atteignable à la tabulation, les flèches font le reste
   * (« roving tabindex »). Sans cela, traverser le calendrier au clavier
   * demande quarante-deux tabulations avant d'atteindre quoi que ce soit.
   */
  const [ancre, setAncre] = useState<DateKey>(aujourdhui)

  const cases = useRef(new Map<DateKey, HTMLButtonElement>())
  const aFocaliser = useRef<DateKey | null>(null)

  const jours = useMemo(
    () => grilleDuMois(topics, reviews, categories, mois),
    [topics, reviews, categories, mois],
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

  /**
   * Ouvrir un jour, c'est aller à sa page (section 8.11).
   *
   * C'était une feuille glissante, ouverte et refermée sans quitter le mois.
   * La page a une adresse, un retour, et le retour arrière du navigateur
   * ramène ici — au mois d'où l'on vient, à la position d'où l'on vient.
   */
  const ouvrirJour = (cle: DateKey) => {
    setAncre(cle)
    navigate(`/jour/${cle}`)
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
      <h1 className="invisible">{t.calendrier.titre}</h1>

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
          {/*
            Le mois porte la voix de l'écran, l'année l'accompagne en chiffres :
            on cherche « août », on vérifie « 2026 ».
          */}
          <h2 className="calendrier__mois">
            {formatMoisSeul(mois)}
            <span className="calendrier__annee chiffres">{formatAnnee(mois)}</span>
          </h2>
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
            const toutesFaites = jour.total > 0 && jour.restantes === 0
            /*
             * Une journée passée qui garde des révisions est en retard. Ses
             * traits sont plus hauts et en `--retard` : c'est le seul état du
             * calendrier qui demande quelque chose, et il doit se voir en
             * balayant le mois sans lire les nombres.
             */
            const enRetard = jour.restantes > 0 && jour.cle < aujourdhui

            const classes = [
              'calendrier__case',
              jour.dansLeMois ? null : 'calendrier__case--hors',
              estAujourdhui ? 'calendrier__case--aujourdhui' : null,
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
                aria-label={etiquetteJour(jour, estAujourdhui, toutesFaites)}
                onClick={() => ouvrirJour(jour.cle)}
                onFocus={() => setAncre(jour.cle)}
                onKeyDown={(event) => surTouche(event, jour.cle)}
              >
                <span className="calendrier__numero" aria-hidden="true">
                  {jour.numero}
                </span>
                <span className="calendrier__indicateurs" aria-hidden="true">
                  {/*
                    Un trait vertical par révision, à la hauteur de son état :
                    plein pour ce qui reste, court pour une journée soldée,
                    long pour un retard. Un trait plutôt qu'un point parce que
                    c'est le même objet que la règle et que la frise — une
                    graduation —, et parce qu'une hauteur se compare d'un
                    regard là où trois diamètres identiques ne disent rien.
                  */}
                  <span className="calendrier__traits">
                    {jour.categories.slice(0, densite(jour.total)).map((categorie, index) => (
                      <span
                        key={index}
                        className={
                          enRetard
                            ? 'calendrier__trait calendrier__trait--retard'
                            : toutesFaites
                              ? 'calendrier__trait calendrier__trait--fait'
                              : 'calendrier__trait'
                        }
                        // Un sujet sans catégorie garde le trait --accent :
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

        {/*
          Ce que disent les traits, écrit une fois sous la grille. Une hauteur
          et une couleur ne se devinent pas : elles s'apprennent en une phrase,
          et cette phrase doit être là où on regarde, pas dans l'aide.
        */}
        <p className="calendrier__legende">{t.calendrier.legendeTraits}</p>

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
