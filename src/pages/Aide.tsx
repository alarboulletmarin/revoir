/**
 * Comment ça marche.
 *
 * Tout ce qui explique l'application vivait dans son README, c'est-à-dire en
 * ligne, sur une forge, alors que l'application fonctionne hors ligne et
 * s'installe sur un écran d'accueil. Quelqu'un qui l'a posée sur son téléphone
 * n'avait aucun moyen d'apprendre ce qu'est la pratique, pourquoi les dates
 * bougent, ni ce que dit un anneau dans une case du tableau.
 *
 * Cinq sections, dans l'ordre où les questions se posent. Aucune capture, aucun
 * lien sortant : ce sont les composants de l'application qui illustrent
 * l'application.
 */
import { useTitrePage } from '../state/useTitrePage'
import { useAujourdhui } from '../state/useAujourdhui'
import { SCHEDULES, listerDecalages, reviewsDepuisOffsets } from '../lib/schedules'
import { Frise } from '../components/Frise'
import { LegendeSuivi } from '../components/LegendeSuivi'
import { LienBouton } from '../components/Bouton'

export function Aide() {
  useTitrePage('Aide')
  const aujourdhui = useAujourdhui()

  return (
    <>
      <div className="page__entete">
        <h1 className="page__titre">Comment ça marche</h1>
        <p className="page__intro">
          Revoir répond à une seule question : qu'est-ce que je dois revoir
          aujourd'hui ?
        </p>
      </div>

      <section className="aide__bloc">
        <h2 className="section__titre">Le vocabulaire</h2>
        <p className="discret">
          Trois mots, choisis pour ne pas enfermer l'application dans le contexte
          scolaire.
        </p>
        <dl className="aide__termes">
          <dt className="aide__terme">Catégorie</dt>
          <dd className="aide__definition">
            Ce qui regroupe des sujets : Mathématiques, Anglais, React, Code de la
            route, Piano. Elle existe avant ses sujets, se renomme, se recolore, et
            vit très bien sans aucun sujet.
          </dd>

          <dt className="aide__terme">Sujet</dt>
          <dd className="aide__definition">
            Ce que vous voulez revoir : les dérivées, les hooks React, le
            vocabulaire du voyage, les accords majeurs. Revoir en retient le titre,
            jamais le contenu.
          </dd>

          <dt className="aide__terme">Révisions</dt>
          <dd className="aide__definition">
            Les échéances que le programme calcule à partir de la date de départ.
            Vous les cochez, l'application s'occupe des suivantes.
          </dd>

          <dt className="aide__terme">Pratique</dt>
          <dd className="aide__definition">
            Le pendant des révisions : pour un cours ce sont des exercices, pour le
            piano la répétition, pour une langue une conversation, pour le code de
            la route une série de questions. C'est un état — à faire, en cours,
            terminée — et non une date : sans échéance, elle serait toujours en
            retard dans les listes du jour. Elle vit sur la fiche d'un sujet et
            dans la dernière colonne du tableau de suivi.
          </dd>
        </dl>
      </section>

      <section className="aide__bloc">
        <h2 className="section__titre">Les programmes</h2>
        <p className="discret">
          Un programme est un rythme : la liste des écarts, en jours, à partir de
          la date de départ. Les écarts grandissent — c'est tout le principe de la
          répétition espacée, où l'on revoit juste avant d'oublier.
        </p>
        <ul className="aide__programmes">
          {SCHEDULES.map((programme) => (
            <li key={programme.id} className="aide__programme">
              <span className="aide__programme-nom">{programme.label}</span>
              <Frise
                origine={aujourdhui}
                reviews={reviewsDepuisOffsets('apercu', aujourdhui, programme.offsets)}
                aujourdhui={aujourdhui}
                variante="mini"
                intitule={`Programme ${programme.label}`}
              />
              <span className="aide__programme-jours">
                {listerDecalages(programme.offsets)}
              </span>
            </li>
          ))}
        </ul>
        <p className="discret">
          Vous pouvez composer les vôtres depuis les réglages : un rythme se
          construit en touchant des graduations, personne n'a à taper « 1 3 7 14
          30 ». Un programme déjà suivi par un sujet garde son rythme — les
          révisions de ce sujet sont écrites — mais se renomme toujours.
        </p>
      </section>

      <section className="aide__bloc">
        <h2 className="section__titre">Le retard, le recalage et le report</h2>
        <p className="discret">
          Le retard n'accuse pas : c'est une information, pas un jugement. Aucune
          série à tenir, aucun score.
        </p>
        <p className="discret">
          <strong>Valider une révision en retard recale les suivantes</strong> sur
          la date réelle de validation, en conservant les écarts du programme : une
          J+7 validée avec trois jours de retard place la J+14 sept jours après la
          validation, pas quatre. Sans ce recalage, rattraper une semaine de retard
          ferait tomber toutes les échéances suivantes le même jour.
        </p>
        <p className="discret">
          <strong>Reporter, à l'inverse, ne déplace que l'échéance visée.</strong>{' '}
          Un report ne dit rien du rythme réel — il dit « pas aujourd'hui ». Le
          programme n'a pas changé, les échéances suivantes non plus.
        </p>
        <p className="discret">
          Cocher une révision ne demande aucune confirmation : l'affichage change
          tout de suite et un message propose « Annuler » pendant cinq secondes. La
          suppression est la seule action qui demande une confirmation.
        </p>
      </section>

      <section className="aide__bloc">
        <h2 className="section__titre">Lire le tableau de suivi</h2>
        <p className="discret">
          Un tableau par catégorie : les sujets en lignes, les étapes de révision
          en colonnes, la pratique en dernière colonne. Cinq états, cinq formes —
          elles se distinguent aussi en niveaux de gris, la couleur ne porte jamais
          l'information seule.
        </p>
        <LegendeSuivi />
        <p className="discret">
          Deux façons de nommer les colonnes. <strong>Intervalles</strong> les
          nomme par leur écart — J+1, J+3, J+7 — à partir de l'union des écarts de
          la catégorie ; une étape absente d'un programme s'y lit « hors
          programme ». <strong>Compact</strong> les numérote — R1, R2, R3 — et
          tient sur un téléphone. Toucher une cellule ouvre un panneau qui permet
          de valider, de reporter ou d'ouvrir le sujet.
        </p>
      </section>

      <section className="aide__bloc">
        <h2 className="section__titre">Vos données</h2>
        <p className="discret">
          Il n'y a pas de serveur : rien ne quitte votre appareil. Aucun compte,
          aucune synchronisation, aucune mesure d'audience. Tout est enregistré
          dans le stockage local de votre navigateur.
        </p>
        <p className="discret">
          C'est aussi la contrepartie : effacer les données du site depuis votre
          navigateur supprime toutes vos révisions, et personne ne peut vous les
          rendre. L'export produit un fichier que vous conservez où vous voulez et
          réimportez ici ou sur un autre appareil — pensez-y de temps en temps.
        </p>
        <div className="reglages__actions">
          <LienBouton vers="/reglages">Ouvrir les réglages</LienBouton>
        </div>
      </section>
    </>
  )
}
