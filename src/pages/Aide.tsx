// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Comment ça marche.
 *
 * Tout ce qui explique l'application vivait dans son README, c'est-à-dire en
 * ligne, sur une forge, alors que l'application fonctionne hors ligne et
 * s'installe sur un écran d'accueil. Quelqu'un qui l'a posée sur son téléphone
 * n'avait aucun moyen d'apprendre ce qu'est la pratique, pourquoi les dates
 * bougent, ni ce que dit un anneau dans une case du tableau.
 *
 * Six sections, dans l'ordre où les questions se posent. Aucune capture, aucun
 * lien sortant : ce sont les composants de l'application qui illustrent
 * l'application.
 */
import { Link } from 'react-router-dom'
import { useTitrePage } from '../state/useTitrePage'
import { useAujourdhui } from '../state/useAujourdhui'
import { useTextes } from '../state/usePreferences'
import { SCHEDULES, listerDecalages, reviewsDepuisOffsets } from '../lib/schedules'
import { Frise } from '../components/Frise'
import { LegendeSuivi } from '../components/LegendeSuivi'
import { LienBouton } from '../components/Bouton'

export function Aide() {
  const t = useTextes()
  useTitrePage(t.coque.aide)
  const aujourdhui = useAujourdhui()

  return (
    <>
      <div className="page__entete">
        <h1 className="titre-page">{t.aide.titre}</h1>
        <p className="page__intro">{t.aide.intro}</p>
      </div>

      {/*
        La règle en tête de l'aide, avec la seule phrase qui apprend à la lire.
        C'est la signature de l'application : qui vient chercher de l'aide vient
        souvent chercher ça, et le faire descendre sous six sections reviendrait
        à répondre en dernier à la première question.
      */}
      <section className="aide__regle">
        <h2 className="surtitre">{t.aide.regleTitre}</h2>
        <Frise
          origine={aujourdhui}
          reviews={reviewsDepuisOffsets('apercu', aujourdhui, SCHEDULES[0].offsets)}
          aujourdhui={aujourdhui}
          libelles="decalage"
          intitule={t.reglages.programmes.intitule(SCHEDULES[0].label)}
        />
        <p className="discret discret--petit">{t.aide.regleDetail}</p>
      </section>

      <section className="aide__bloc">
        <h2 className="section__titre">{t.aide.vocabulaire.titre}</h2>
        <p className="discret">{t.aide.vocabulaire.intro}</p>
        <dl className="aide__termes">
          <dt className="aide__terme">{t.aide.vocabulaire.categorie}</dt>
          <dd className="aide__definition">{t.aide.vocabulaire.categorieDetail}</dd>

          <dt className="aide__terme">{t.aide.vocabulaire.sujet}</dt>
          <dd className="aide__definition">{t.aide.vocabulaire.sujetDetail}</dd>

          <dt className="aide__terme">{t.aide.vocabulaire.revisions}</dt>
          <dd className="aide__definition">{t.aide.vocabulaire.revisionsDetail}</dd>

          <dt className="aide__terme">{t.aide.vocabulaire.pratique}</dt>
          <dd className="aide__definition">{t.aide.vocabulaire.pratiqueDetail}</dd>
        </dl>
      </section>

      <section className="aide__bloc">
        <h2 className="section__titre">{t.aide.programmes.titre}</h2>
        <p className="discret">{t.aide.programmes.intro}</p>
        <ul className="aide__programmes">
          {SCHEDULES.map((programme) => (
            <li key={programme.id} className="aide__programme">
              <span className="aide__programme-nom">{programme.label}</span>
              <Frise
                origine={aujourdhui}
                reviews={reviewsDepuisOffsets('apercu', aujourdhui, programme.offsets)}
                aujourdhui={aujourdhui}
                variante="mini"
                intitule={t.reglages.programmes.intitule(programme.label)}
              />
              <span className="aide__programme-jours">
                {listerDecalages(programme.offsets)}
              </span>
            </li>
          ))}
        </ul>
        <p className="discret">{t.aide.programmes.note}</p>
      </section>

      <section className="aide__bloc">
        <h2 className="section__titre">{t.aide.retard.titre}</h2>
        <p className="discret">{t.aide.retard.intro}</p>
        <p className="discret">
          <strong>{t.aide.retard.recalageFort}</strong>
          {t.aide.retard.recalage}
        </p>
        <p className="discret">
          <strong>{t.aide.retard.reportFort}</strong>
          {t.aide.retard.report}
        </p>
        <p className="discret">{t.aide.retard.confirmation}</p>
      </section>

      <section className="aide__bloc">
        <h2 className="section__titre">{t.aide.tableau.titre}</h2>
        <p className="discret">{t.aide.tableau.intro}</p>
        <LegendeSuivi />
        <p className="discret">
          {t.aide.tableau.modesAvant}
          <strong>{t.aide.tableau.modesIntervalles}</strong>
          {t.aide.tableau.modesMilieu}
          <strong>{t.aide.tableau.modesCompact}</strong>
          {t.aide.tableau.modesApres}
        </p>
      </section>

      {/*
        La navigation s'explique désormais, parce qu'elle a deux endroits : la
        barre du bas porte les vues, l'en-tête porte tout le reste — dont le
        retour, qui est la seule sortie d'un formulaire quand l'application est
        installée et n'a plus de bouton système.
      */}
      <section className="aide__bloc">
        <h2 className="section__titre">{t.aide.navigation.titre}</h2>
        <p className="discret">{t.aide.navigation.intro}</p>
      </section>

      <section className="aide__bloc">
        <h2 className="section__titre">{t.aide.donnees.titre}</h2>
        <p className="discret">{t.aide.donnees.intro}</p>
        <p className="discret">{t.aide.donnees.export}</p>
        <p className="discret">{t.aide.donnees.calendrier}</p>
        <div className="reglages__actions">
          <LienBouton vers="/reglages">{t.aide.donnees.reglages}</LienBouton>
        </div>
      </section>

      {/*
        La présentation se relit. C'est ce que son pied de page promet, et
        c'est ici qu'on vient la chercher — une explication qu'on n'a pas lue
        au bon moment n'est pas perdue pour autant.
      */}
      <p className="aide__lien">
        <Link to="/bienvenue" className="lien">
          {t.bienvenue.revoirPresentation}
        </Link>
      </p>
    </>
  )
}
