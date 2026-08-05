// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from 'react'
import { useDonnees } from '../state/useDonnees'
import { useValidation } from '../state/useValidation'
import { useAujourdhui } from '../state/useAujourdhui'
import { useMediaQuery } from '../state/useMediaQuery'
import { useTitrePage } from '../state/useTitrePage'
import { useTextes } from '../state/usePreferences'
import { textes } from '../i18n'
import { formatLong, formatShort } from '../lib/dates'
import {
  computeStats,
  loadForDays,
  nextReviewDay,
  overdueEntries,
  todayEntries,
  upcomingEntries,
} from '../lib/stats'
import { estFaite } from '../lib/sujets'
import { Cellule } from '../components/Cellule'
import { LigneRevision } from '../components/LigneRevision'
import { BarresCharge } from '../components/BarresCharge'
import { MiniMois } from '../components/MiniMois'
import { LienBouton } from '../components/Bouton'
import { Accueil } from './Accueil'

/** Section 7.2 : 3 items sous 480px, la cellule ne tient pas davantage. */
const ITEMS_HERO_ETROIT = 3
const ITEMS_HERO_LARGE = 6

/** Ce qui vient ensuite, sous le bento. Au-delà, c'est le calendrier. */
const PROCHAINES_VISIBLES = 5

export function Dashboard() {
  const t = useTextes()
  useTitrePage(t.dashboard.titre)
  const { topics, reviews, categories, loading } = useDonnees()
  const { validerEntree, devaliderEntree } = useValidation()
  const large = useMediaQuery('(min-width: 480px)')
  const tablette = useMediaQuery('(min-width: 768px)')
  const aujourdhui = useAujourdhui()

  const vue = useMemo(() => {
    const dujour = todayEntries(topics, reviews, aujourdhui)
    return {
      /** Ce qu'il reste à faire aujourd'hui. */
      dujour: dujour.filter((entree) => !estFaite(entree.review)),
      /**
       * Ce qui était prévu aujourd'hui, coché ou non. Sans ce compte, une
       * journée bouclée et une journée sans rien de prévu se ressemblent —
       * or ce ne sont pas du tout les mêmes nouvelles.
       */
      prevuesDuJour: dujour.length,
      retard: overdueEntries(topics, reviews, aujourdhui),
      stats: computeStats(topics, reviews, aujourdhui),
      charge: loadForDays(topics, reviews, 14, aujourdhui),
      prochainJour: nextReviewDay(topics, reviews, aujourdhui),
      prochaines: upcomingEntries(topics, reviews, PROCHAINES_VISIBLES, aujourdhui),
    }
  }, [topics, reviews, aujourdhui])

  if (loading) {
    return <p className="discret">{t.commun.chargement}</p>
  }

  // Aucun sujet : l'écran qui explique le projet, et non une grille de zéros.
  if (topics.length === 0) {
    return <Accueil />
  }

  const plafond = large ? ITEMS_HERO_LARGE : ITEMS_HERO_ETROIT
  const visibles = vue.dujour.slice(0, plafond)
  const reste = vue.dujour.length - visibles.length
  const sansRetard = vue.retard.length === 0

  return (
    <>
      <div className="page__entete">
        <h1 className="page__titre">{t.dashboard.titre}</h1>
        <p className="page__intro">{formatLong(aujourdhui)}</p>
      </div>

      <div className={sansRetard ? 'bento bento--sans-retard' : 'bento'}>
        {/* L'unique cellule --accent pleine de l'écran (section 3). */}
        <Cellule zone="aujourdhui" accent>
          <h2 className="hero__titre">{titreDuJour(vue.dujour.length, vue.prevuesDuJour)}</h2>

          {vue.dujour.length === 0 ? (
            <p className="hero__vide">{secondeLigne(vue.prevuesDuJour, vue.prochainJour)}</p>
          ) : (
            <>
              <ul className="hero__liste">
                {visibles.map((entree) => (
                  <LigneRevision
                    key={entree.review.id}
                    entry={entree}
                    aujourdhui={aujourdhui}
                    onValider={validerEntree}
                    onDevalider={devaliderEntree}
                    masquerDate
                    detail="aucun"
                  />
                ))}
              </ul>
              {reste > 0 && (
                <p className="hero__pied">
                  <LienBouton vers="/revisions/aujourdhui" variante="texte">
                    {t.dashboard.toutVoirCompte(vue.dujour.length)}
                  </LienBouton>
                </p>
              )}
            </>
          )}
        </Cellule>

        {/* Disparaît du DOM à zéro : la grille se recompose (section 7.2). */}
        {!sansRetard && (
          <Cellule zone="retard" vers="/revisions/retard" label={t.dashboard.enRetard}>
            <span className="retard__valeur">
              <span className="retard__point" aria-hidden="true" />
              <output className="cellule__chiffre">{vue.retard.length}</output>
            </span>
          </Cellule>
        )}

        {/*
          Une seule cellule pour le total et sa répartition : deux cartes
          disaient la même chose — combien il reste — à deux échelles. Le
          chiffre d'abord, la forme des quinze jours qui viennent en dessous.
        */}
        <Cellule zone="synthese">
          <output className="cellule__chiffre">{vue.stats.remainingReviews}</output>
          <p className="cellule__label">
            {t.dashboard.restantes(vue.stats.remainingReviews)}
          </p>
          <p className="synthese__intitule">{t.dashboard.charge(vue.charge.length)}</p>
          <BarresCharge charge={vue.charge} aujourdhui={aujourdhui} />
        </Cellule>

        {/*
          ≥ 768px uniquement (section 7.2). La cellule n'est pas seulement
          masquée : « calendrier » n'existe pas dans les zones de la grille
          sous 768px, et une cellule qui vise une zone inconnue fait créer à
          la grille des colonnes implicites qui écrasent tout le bento.
        */}
        {tablette && (
          <Cellule zone="calendrier" vers="/calendrier" label={t.dashboard.ceMois}>
            <MiniMois
              topics={topics}
              reviews={reviews}
              categories={categories}
              aujourdhui={aujourdhui}
            />
          </Cellule>
        )}
      </div>

      {/*
        Sous le bento, jamais dedans : le tableau de bord reste une réponse.
        Ce qui vient ensuite, et rien de plus — la consultation par catégorie
        a maintenant sa propre vue, « Suivi ».
      */}
      {vue.prochaines.length > 0 && (
        <section className="pile pile--serree">
          <h2 className="section__titre">{t.dashboard.prochainesEcheances}</h2>
          <ul className="liste-revisions">
            {vue.prochaines.map((entree) => (
              <LigneRevision
                key={entree.review.id}
                entry={entree}
                aujourdhui={aujourdhui}
                onValider={validerEntree}
                onDevalider={devaliderEntree}
                detail="progression"
              />
            ))}
          </ul>
          <p className="hero__pied">
            <LienBouton vers="/revisions/prochaines" variante="texte">
              {t.dashboard.toutVoir}
            </LienBouton>
          </p>
        </section>
      )}
    </>
  )
}

/**
 * Une journée bouclée n'est pas une journée vide. `restantes` à zéro se lit
 * « Tout est terminé » quand quelque chose était prévu, et « Aucune révision
 * prévue » quand rien ne l'était.
 */
function titreDuJour(restantes: number, prevues: number): string {
  const t = textes().dashboard
  if (restantes > 0) return t.aFaire(restantes)
  return prevues > 0 ? t.tempsTermine : t.rienDePrevu
}

/**
 * La seconde ligne est une information, pas un encouragement (section 8.9) :
 * la prochaine échéance quand il y en a une, sinon la promesse minimale.
 */
function secondeLigne(prevues: number, prochain: { date: string; count: number } | null): string {
  const t = textes().dashboard
  if (prochain === null) return prevues > 0 ? t.plusRien : t.aVenirIci
  return t.prochaine(formatShort(prochain.date), prochain.count)
}

