// SPDX-License-Identifier: AGPL-3.0-only

/**
 * L'écran de premier usage — et la page de présentation de l'application.
 *
 * Ce sont volontairement le même écran. L'application vit à la racine du
 * domaine : `start_url` et `scope` valent « / », et des raccourcis posés sur
 * des écrans d'accueil y pointent déjà. Déplacer l'application sous `/app`
 * pour loger une vitrine à sa place casserait ces installations — c'est
 * exactement ce que les redirections de `/element/:id` évitent par ailleurs.
 *
 * Or il n'y avait rien à casser : quelqu'un qui arrive sans données ne veut pas
 * une grille vide, il veut savoir ce que fait ce site ; et quelqu'un qui a
 * installé l'application et n'a pas encore créé de sujet veut savoir par où
 * commencer. Une seule page répond aux deux, à condition de rester dans la voix
 * du projet : ce qu'il fait, ce qu'il ne fait pas, et un bouton.
 *
 * Rendu par `Dashboard` tant qu'aucun sujet n'existe. Ce n'est donc pas une
 * route : il n'y a pas deux adresses pour la même chose.
 */
import { useTitrePage } from '../state/useTitrePage'
import { useAujourdhui } from '../state/useAujourdhui'
import { useTextes } from '../state/usePreferences'
import { propositionsCategories } from '../lib/categories'
import { SCHEDULES, reviewsDepuisOffsets } from '../lib/schedules'
import { Frise } from '../components/Frise'
import { LienBouton } from '../components/Bouton'

/** Le programme « Simple » : celui que le formulaire propose d'abord. */
const DEMONSTRATION = SCHEDULES[0]


export function Accueil() {
  const t = useTextes()
  useTitrePage(t.dashboard.titre)
  const aujourdhui = useAujourdhui()

  return (
    <div className="accueil">
      <div className="accueil__entete">
        <h1 className="accueil__titre">{t.accueil.titre}</h1>
        <p className="accueil__intro">{t.accueil.intro}</p>
      </div>

      {/*
        La frise, en grand et d'emblée : c'est l'argument, pas une illustration.
        Elle montre en une ligne ce que trois paragraphes expliqueraient mal —
        l'écart entre deux graduations vaut l'écart réel entre deux dates.
      */}
      <section className="accueil__frise">
        <Frise
          origine={aujourdhui}
          reviews={reviewsDepuisOffsets('apercu', aujourdhui, DEMONSTRATION.offsets)}
          aujourdhui={aujourdhui}
          libelles="decalage"
          intitule={t.reglages.programmes.intitule(DEMONSTRATION.label)}
        />
        <p className="accueil__legende">
          {t.accueil.legendeFrise(DEMONSTRATION.label, DEMONSTRATION.description)}
        </p>
      </section>

      <ol className="accueil__temps">
        {t.accueil.temps.map((temps, index) => (
          <li key={temps.titre} className="accueil__temp">
            <span className="accueil__rang" aria-hidden="true">
              {index + 1}
            </span>
            <span className="accueil__temp-titre">{temps.titre}</span>
            <span className="accueil__temp-detail">{temps.detail}</span>
          </li>
        ))}
      </ol>

      {/*
        Dire ce que l'application ne fait pas est ici une fonctionnalité : c'est
        la moitié du projet, et personne ne la devine.
      */}
      <section className="accueil__bloc">
        <h2 className="section__titre">{t.accueil.neFaitPas}</h2>
        <p className="discret">{t.accueil.neFaitPasDetail}</p>
        <p className="discret">{t.accueil.donneesLocales}</p>
      </section>

      <div className="accueil__actions">
        <LienBouton vers="/nouveau" variante="primaire">
          {t.accueil.creerSujet}
        </LienBouton>
        <LienBouton vers="/aide" variante="texte">
          {t.accueil.commentCaMarche}
        </LienBouton>
      </div>

      {/*
        Les six noms viennent de la même liste que les catégories réellement
        semées : les réécrire ici les aurait laissés en français dans une
        interface anglaise, et périmés le jour où la liste change.
      */}
      <p className="discret discret--petit">
        {t.accueil.categoriesLivrees(
          propositionsCategories()
            .map(({ name }) => name)
            .join(', '),
        )}
      </p>
    </div>
  )
}
