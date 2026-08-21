// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from 'react'
import { useDonnees } from '../state/useDonnees'
import { useValidation } from '../state/useValidation'
import { useAujourdhui } from '../state/useAujourdhui'
import { useTitrePage } from '../state/useTitrePage'
import { useTextes } from '../state/usePreferences'
import { textes } from '../i18n'
import { formatJourLong, formatShort } from '../lib/dates'
import { JOURS_REGLE } from '../lib/regle'
import {
  computeStats,
  loadForDays,
  nextReviewDay,
  overdueEntries,
  todayEntries,
  upcomingEntries,
} from '../lib/stats'
import { estFaite } from '../lib/sujets'
import { LigneRevision } from '../components/LigneRevision'
import { LigneEcheance } from '../components/LigneEcheance'
import { Regle } from '../components/Regle'
import { Gabarit } from '../components/Etats'
import { LienBouton } from '../components/Bouton'
import { Accueil } from './Accueil'

/** Ce qui vient ensuite, sous la règle. Au-delà, c'est le calendrier. */
const PROCHAINES_VISIBLES = 3

export function Dashboard() {
  const t = useTextes()
  useTitrePage(t.dashboard.titre)
  const { topics, reviews, loading } = useDonnees()
  const { validerEntree, devaliderEntree } = useValidation()
  const aujourdhui = useAujourdhui()

  const vue = useMemo(() => {
    const dujour = todayEntries(topics, reviews, aujourdhui)
    return {
      /** Ce qu'il reste à faire aujourd'hui. */
      dujour: dujour.filter((entree) => !estFaite(entree.review)),
      /**
       * Ce qui a été coché dans la journée. La journée bouclée ne se solde pas
       * sur un écran vide : ce qui vient d'être fait reste lisible, et chaque
       * ligne garde son « Annuler » (section 1).
       */
      faites: dujour.filter((entree) => estFaite(entree.review)),
      /**
       * Ce qui était prévu aujourd'hui, coché ou non. Sans ce compte, une
       * journée bouclée et une journée sans rien de prévu se ressemblent —
       * or ce ne sont pas du tout les mêmes nouvelles.
       */
      prevuesDuJour: dujour.length,
      retard: overdueEntries(topics, reviews, aujourdhui),
      stats: computeStats(topics, reviews, aujourdhui),
      charge: loadForDays(topics, reviews, JOURS_REGLE, aujourdhui),
      prochainJour: nextReviewDay(topics, reviews, aujourdhui),
      prochaines: upcomingEntries(topics, reviews, PROCHAINES_VISIBLES, aujourdhui),
    }
  }, [topics, reviews, aujourdhui])

  // La forme de l'écran est posée avant les données : la page ne saute pas
  // quand elles arrivent (section 8.23).
  if (loading) return <Gabarit />

  // Aucun sujet : l'écran qui explique le projet, et non une règle de zéros.
  if (topics.length === 0) {
    return <Accueil />
  }

  const bouclee = vue.dujour.length === 0

  return (
    <div className="aujourdhui">
      {/*
        Le sur-titre date l'écran, le compte y répond.

        Le nombre est un chiffre, et il est grand : c'est ce qu'on vient
        chercher, et une phrase qui l'écrit en toutes lettres le fait lire au
        lieu de le faire voir. C'est le principe que portait le grand chiffre
        du bento, et qu'il fallait retrouver sans lui.

        `<output>` et non `<span>` : il porte un rôle de région vive, donc le
        compte qui change est annoncé sans que rien ne prenne le focus
        (section 10). Il hérite au passage de la chasse fixe des chiffres, ce
        qui l'empêche de changer de largeur entre « 2 » et « 3 ».
      */}
      <div className="aujourdhui__entete">
        <p className="surtitre">{formatJourLong(aujourdhui)}</p>
        <h1 className="aujourdhui__reponse">
          <output className="aujourdhui__compte">{vue.dujour.length}</output>
          <span className="aujourdhui__libelle">
            {libelleDuJour(vue.dujour.length, vue.prevuesDuJour)}
          </span>
        </h1>
        {bouclee && (
          <p className="aujourdhui__suite">
            {secondeLigne(vue.prevuesDuJour, vue.prochainJour)}
          </p>
        )}
      </div>

      <Regle
        charge={vue.charge}
        aujourdhui={aujourdhui}
        restantes={vue.stats.remainingReviews}
        retard={vue.retard.length}
      />

      {/*
        Ce qu'on fait, par opposition à ce qui répond : la liste du jour, ce
        qui a été revu, ce qui vient ensuite. Regroupé parce qu'au bureau
        c'est une colonne à part (section 7.5) — sur un téléphone, le
        conteneur ne fait que reprendre l'espacement de son parent.
      */}
      <div className="aujourdhui__travail">
      {vue.dujour.length > 0 && (
        <ul className="liste-reglee">
          {vue.dujour.map((entree) => (
            <LigneRevision
              key={entree.review.id}
              entry={entree}
              aujourdhui={aujourdhui}
              onValider={validerEntree}
              onDevalider={devaliderEntree}
              masquerDate
              detail="passage"
            />
          ))}
        </ul>
      )}

      {/*
        Ce qui a été coché reste sous la main tant que la journée dure. La
        validation s'annule, elle ne se confirme pas : le « Annuler » du toast
        expire au bout de cinq secondes, celui-ci non.
      */}
      {vue.faites.length > 0 && (
        <section className="aujourdhui__section">
          <h2 className="surtitre">{t.dashboard.revuAujourdhui}</h2>
          <ul className="liste-reglee">
            {vue.faites.map((entree) => (
              <LigneRevision
                key={entree.review.id}
                entry={entree}
                aujourdhui={aujourdhui}
                onValider={validerEntree}
                onDevalider={devaliderEntree}
                masquerDate
                detail="passage"
              />
            ))}
          </ul>
        </section>
      )}

      {/*
        Trois échéances, pas cinq : ce qui vient ensuite se lit déjà sur la
        règle, et cette liste ne fait que nommer les trois premières.
      */}
      {vue.prochaines.length > 0 && (
        <section className="aujourdhui__section">
          <h2 className="surtitre">{t.dashboard.ensuite}</h2>
          <ul className="liste-reglee">
            {vue.prochaines.map((entree) => (
              <LigneEcheance key={entree.review.id} entry={entree} />
            ))}
          </ul>
          <p className="aujourdhui__pied">
            <LienBouton vers="/revisions/prochaines" variante="texte">
              {t.dashboard.toutVoir}
            </LienBouton>
          </p>
        </section>
      )}
      </div>

    </div>
  )
}

/**
 * Ce qui accompagne le compte.
 *
 * Une journée bouclée n'est pas une journée vide. Zéro se lit « Tout est
 * terminé » quand quelque chose était prévu, et « Aucune révision prévue »
 * quand rien ne l'était — le chiffre est le même, c'est le libellé qui les
 * distingue.
 */
function libelleDuJour(restantes: number, prevues: number): string {
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
