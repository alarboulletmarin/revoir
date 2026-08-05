import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useItems } from '../state/useItems'
import { useValidation } from '../state/useValidation'
import { useMediaQuery } from '../state/useMediaQuery'
import { useTitrePage } from '../state/useTitrePage'
import { formatLong, formatRelative, formatShort, todayKey } from '../lib/dates'
import {
  computeStats,
  loadForDays,
  nextReviewDay,
  overdueEntries,
  todayEntries,
  upcomingEntries,
} from '../lib/stats'
import { Cellule } from '../components/Cellule'
import { ItemRevision } from '../components/ItemRevision'
import { BarresCharge } from '../components/BarresCharge'
import { AnneauProgression } from '../components/AnneauProgression'
import { MiniMois } from '../components/MiniMois'
import { GroupesMatiere } from '../components/GroupesMatiere'
import { LienBouton } from '../components/Bouton'
import { grouperParMatiere } from '../lib/matieres'

/** Section 7.2 : 3 items sous 480px, la cellule ne tient pas davantage. */
const ITEMS_HERO_ETROIT = 3
const ITEMS_HERO_LARGE = 6
const LIGNES_PROCHAINES = 3

export function Dashboard() {
  useTitrePage("Aujourd'hui")
  const { items, teintes, loading } = useItems()
  const { validerEntree, devaliderEntree } = useValidation()
  const large = useMediaQuery('(min-width: 480px)')
  const tablette = useMediaQuery('(min-width: 768px)')
  const aujourdhui = todayKey()

  const vue = useMemo(
    () => ({
      dujour: todayEntries(items, aujourdhui).filter((entree) => !entree.review.done),
      retard: overdueEntries(items, aujourdhui),
      prochaines: upcomingEntries(items, LIGNES_PROCHAINES, aujourdhui),
      stats: computeStats(items, aujourdhui),
      charge: loadForDays(items, 14, aujourdhui),
      prochainJour: nextReviewDay(items, aujourdhui),
      matieres: grouperParMatiere(items),
    }),
    [items, aujourdhui],
  )

  if (loading) {
    return <p className="discret">Chargement…</p>
  }

  if (items.length === 0) {
    return <PremierUsage />
  }

  const plafond = large ? ITEMS_HERO_LARGE : ITEMS_HERO_ETROIT
  const visibles = vue.dujour.slice(0, plafond)
  const reste = vue.dujour.length - visibles.length
  const sansRetard = vue.retard.length === 0

  return (
    <>
      <div className="page__entete">
        <h1 className="page__titre">Aujourd'hui</h1>
        <p className="page__intro">{formatLong(aujourdhui)}</p>
      </div>

      <div className={sansRetard ? 'bento bento--sans-retard' : 'bento'}>
        {/* L'unique cellule --accent pleine de l'écran (section 3). */}
        <Cellule zone="aujourdhui" accent>
          <output className="hero__chiffre">{vue.dujour.length}</output>
          <p className="cellule__label">
            {vue.dujour.length > 1 ? 'révisions aujourd’hui' : 'révision aujourd’hui'}
          </p>

          {vue.dujour.length === 0 ? (
            <p className="hero__vide">
              Rien à revoir aujourd'hui.
              {vue.prochainJour && (
                <>
                  {' '}
                  Prochaine révision&nbsp;: {formatShort(vue.prochainJour.date)},{' '}
                  {vue.prochainJour.count} élément
                  {vue.prochainJour.count > 1 ? 's' : ''}.
                </>
              )}
            </p>
          ) : (
            <>
              <ul className="hero__liste">
                {visibles.map((entree) => (
                  <ItemRevision
                    key={`${entree.item.id}-${entree.review.offset}`}
                    entry={entree}
                    aujourdhui={aujourdhui}
                    onValider={validerEntree}
                    onDevalider={devaliderEntree}
                    masquerDate
                    frise={false}
                  />
                ))}
              </ul>
              {reste > 0 && (
                <p className="hero__pied">
                  <LienBouton vers="/revisions/aujourdhui" variante="texte">
                    Tout voir ({vue.dujour.length})
                  </LienBouton>
                </p>
              )}
            </>
          )}
        </Cellule>

        {/* Disparaît du DOM à zéro : la grille se recompose (section 7.2). */}
        {!sansRetard && (
          <Cellule zone="retard" vers="/revisions/retard" label="en retard">
            <span className="retard__valeur">
              <span className="retard__point" aria-hidden="true" />
              <output className="cellule__chiffre">{vue.retard.length}</output>
            </span>
          </Cellule>
        )}

        <Cellule zone="restantes" label="révisions restantes">
          <div className="restantes">
            <AnneauProgression
              part={vue.stats.progress / 100}
              label={`Progression : ${vue.stats.progress} %`}
            />
            <output className="cellule__chiffre">{vue.stats.remainingReviews}</output>
          </div>
        </Cellule>

        <Cellule zone="charge" label="charge sur 14 jours">
          <BarresCharge charge={vue.charge} aujourdhui={aujourdhui} />
        </Cellule>

        <Cellule zone="prochaines" label="prochaines révisions">
          {vue.prochaines.length === 0 ? (
            <p className="discret discret--petit">Aucune révision planifiée</p>
          ) : (
            <div className="prochaines">
              {vue.prochaines.map((entree) => (
                <Link
                  key={`${entree.item.id}-${entree.review.offset}`}
                  to={`/element/${entree.item.id}`}
                  className="prochaines__ligne"
                >
                  <span className="prochaines__titre">{entree.item.title}</span>
                  <time className="prochaines__date" dateTime={entree.review.date}>
                    {formatRelative(entree.review.date, aujourdhui)}
                  </time>
                </Link>
              ))}
              <p className="hero__pied">
                <LienBouton vers="/revisions/prochaines" variante="texte">
                  Tout voir
                </LienBouton>
              </p>
            </div>
          )}
        </Cellule>

        {/*
          ≥ 768px uniquement (section 7.2). La cellule n'est pas seulement
          masquée : « calendrier » n'existe pas dans les zones de la grille
          sous 768px, et une cellule qui vise une zone inconnue fait créer à
          la grille des colonnes implicites qui écrasent tout le bento.
        */}
        {tablette && (
          <Cellule zone="calendrier" vers="/calendrier" label="ce mois-ci">
            <MiniMois items={items} aujourdhui={aujourdhui} />
          </Cellule>
        )}
      </div>

      {/*
        Sous le bento, jamais dedans : le tableau de bord reste une réponse,
        et cette liste-ci est une consultation. Chaque matière se replie.
      */}
      {vue.matieres.length > 0 && (
        <section className="pile pile--serree">
          <h2 className="section__titre">Par matière</h2>
          <GroupesMatiere
            matieres={vue.matieres}
            teintes={teintes}
            aujourdhui={aujourdhui}
          />
        </section>
      )}
    </>
  )
}

function PremierUsage() {
  return (
    <div className="etat-vide">
      <h1 className="page__titre">Rien à revoir pour l'instant.</h1>
      <p className="discret">
        Créez un élément : un titre, une catégorie, une date de départ et un
        programme. Revoir calcule les dates de révision et ne stocke jamais ce que
        vous apprenez.
      </p>
      <LienBouton vers="/nouveau" variante="primaire">
        Créer un élément
      </LienBouton>
    </div>
  )
}
