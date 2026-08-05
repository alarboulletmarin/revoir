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
import { SCHEDULES, reviewsDepuisOffsets } from '../lib/schedules'
import { Frise } from '../components/Frise'
import { LienBouton } from '../components/Bouton'

/** Le programme « Simple » : celui que le formulaire propose d'abord. */
const DEMONSTRATION = SCHEDULES[0]

const TEMPS = [
  {
    titre: 'Vous notez ce que vous voulez revoir',
    detail:
      'Un titre, une catégorie, une date de départ, un programme. Ni cours, ni fiches, ni documents : Revoir ne stocke jamais ce que vous apprenez.',
  },
  {
    titre: 'Revoir calcule les dates',
    detail:
      'Les écarts grandissent — un jour, trois jours, une semaine, deux, un mois. C’est la répétition espacée : on revoit juste avant d’oublier.',
  },
  {
    titre: 'Vous cochez, l’application suit',
    detail:
      'En un tap, depuis n’importe quelle liste. Une révision validée en retard recale les suivantes en gardant leurs écarts, plutôt que de les faire tomber le même jour.',
  },
]

export function Accueil() {
  useTitrePage("Aujourd'hui")
  const aujourdhui = useAujourdhui()

  return (
    <div className="accueil">
      <div className="accueil__entete">
        <h1 className="accueil__titre">Qu'est-ce que je dois revoir aujourd'hui ?</h1>
        <p className="accueil__intro">
          Revoir planifie vos révisions par répétition espacée et répond à cette
          seule question. Aucun compte, aucun serveur : tout reste sur cet
          appareil.
        </p>
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
          intitule={`Programme ${DEMONSTRATION.label}`}
        />
        <p className="accueil__legende">
          Le programme « {DEMONSTRATION.label} », de la date de départ au dernier
          rappel : {DEMONSTRATION.description}.
        </p>
      </section>

      <ol className="accueil__temps">
        {TEMPS.map((temps, index) => (
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
        <h2 className="section__titre">Ce que Revoir ne fait pas</h2>
        <p className="discret">
          Pas de compte, pas de serveur, pas de synchronisation, pas de
          publicité, pas de mesure d'audience. Pas de notification, pas de série
          à tenir, pas de score : le retard est une information, pas un jugement.
        </p>
        <p className="discret">
          Vos données vivent dans le stockage de ce navigateur, et vous pouvez
          les exporter dans un fichier à tout moment.
        </p>
      </section>

      <div className="accueil__actions">
        <LienBouton vers="/nouveau" variante="primaire">
          Créer un sujet
        </LienBouton>
        <LienBouton vers="/aide" variante="texte">
          Comment ça marche
        </LienBouton>
      </div>

      <p className="discret discret--petit">
        Six catégories sont déjà là — Études, Travail, Langues, Développement,
        Lecture, Personnel. Renommez-les, recolorez-les ou supprimez-les depuis
        les réglages.
      </p>
    </div>
  )
}
