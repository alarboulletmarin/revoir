// SPDX-License-Identifier: AGPL-3.0-only

import { useDonnees } from '../state/useDonnees'
import { useTitrePage } from '../state/useTitrePage'
import { usePreferences, useTextes } from '../state/usePreferences'
import { useJeuExemple } from '../state/useJeuExemple'
import { THEMES, type Theme } from '../state/theme'
import { LANGUES, type Langue } from '../i18n'
import { fr } from '../i18n/fr'
import { en } from '../i18n/en'
import { REFERENCE, SOURCE } from '../lib/build'
import { archivedTopics } from '../lib/sujets'
import { Bascule } from '../components/Bascule'
import { Bouton, LienBouton } from '../components/Bouton'
import { RangeeNavigation } from '../components/RangeeNavigation'

/**
 * Chaque langue se nomme dans sa propre langue.
 *
 * « Français » ne se traduit pas par « French » dans un sélecteur : quelqu'un
 * qui ouvre l'application dans une langue qu'il ne lit pas doit pouvoir y
 * reconnaître la sienne. C'est le seul endroit du projet qui lise deux
 * dictionnaires à la fois.
 */
const NOM_LANGUE: Record<Langue, string> = { fr: fr.nom, en: en.nom }

/**
 * Les réglages — section 8.26 du design system.
 *
 * Sept cartes empilées sont devenues deux bascules et une liste. On ne vient
 * pas ici faire le tour du propriétaire : on vient chercher un réglage précis,
 * et une carte par sujet obligeait à tout parcourir pour en trouver un.
 *
 * Ce qui reste sur cet écran est ce qui s'y règle en un geste — l'apparence, la
 * langue. Ce qui demande une page en a une, et la rangée qui y mène dit ce
 * qu'on y trouvera : « Sujets archivés · aucun » évite une visite pour rien.
 */
export function Settings() {
  const t = useTextes()
  useTitrePage(t.reglages.titre)
  const { categories, topics, programmes } = useDonnees()
  const { theme, definirTheme, langue, definirLangue } = usePreferences()
  const exemple = useJeuExemple()

  const archives = archivedTopics(topics)

  return (
    <>
      <div className="page__entete">
        <h1 className="titre-page">{t.reglages.titre}</h1>
      </div>

      {/*
        L'apparence et la langue en tête, et en bascules : ce sont les deux
        réglages qui changent l'écran sous les doigts, et les seuls qu'on
        vienne chercher sans savoir où ils sont. Une rangée qui mène à une page
        pour trois options serait un détour.
      */}
      <section className="reglages__bloc">
        <h2 className="surtitre">{t.reglages.apparence.titre}</h2>
        <Bascule<Theme>
          legende={t.reglages.apparence.legende}
          legendeMasquee
          valeur={theme}
          options={THEMES.map((valeur) => ({
            valeur,
            libelle: t.reglages.apparence[valeur],
          }))}
          onChange={definirTheme}
        />
      </section>

      <section className="reglages__bloc">
        <h2 className="surtitre">{t.reglages.langue.titre}</h2>
        <Bascule<Langue>
          legende={t.reglages.langue.legende}
          legendeMasquee
          valeur={langue}
          options={LANGUES.map((valeur) => ({ valeur, libelle: NOM_LANGUE[valeur] }))}
          onChange={definirLangue}
        />
      </section>

      <ul className="rangees">
        <RangeeNavigation
          vers="/categories"
          libelle={t.reglages.categories.titre}
          valeur={String(categories.length)}
        />
        <RangeeNavigation
          vers="/programmes"
          libelle={t.reglages.programmes.titre}
          valeur={t.reglages.programmes.compteRangee(programmes.length)}
        />
        <RangeeNavigation
          vers="/reglages/archives"
          libelle={t.reglages.archives.titre}
          valeur={
            archives.length === 0
              ? t.reglages.archives.aucunCourt
              : String(archives.length)
          }
        />
        <RangeeNavigation
          vers="/reglages/sauvegarde"
          libelle={t.reglages.sauvegarde.titre}
          valeur={t.reglages.sauvegarde.formats}
        />
      </ul>

      {/*
        Le jeu d'exemple ne se signale que s'il est chargé : une ligne « aucun
        jeu d'exemple » sur un écran qui n'en a jamais eu serait une réponse à
        une question que personne n'a posée (section 8.24).
      */}
      {exemple.charge && (
        <section className="reglages__bloc">
          <h2 className="surtitre">{t.exemple.chargeTitre}</h2>
          <p className="discret">{t.exemple.chargeDetail}</p>
          <div className="reglages__actions">
            <Bouton variante="discret" onClick={() => void exemple.effacer()}>
              {t.exemple.effacer}
            </Bouton>
          </div>
        </section>
      )}

      {/*
        « À propos » se réduit à trois paragraphes et une ligne de licence. Il
        occupait une carte entière pour dire deux choses, dont l'une —
        l'effacement des données du site — mérite d'être lue, et se perdait au
        milieu de l'autre.

        Ce que deviennent les données se dit ici, et nommément. Une application
        qui promet que rien ne sort sans dire où les choses restent demande
        qu'on la croie sur parole ; les trois emplacements cités sont ceux que
        le code utilise vraiment, et ce sont eux qui donnent son « donc » au
        paragraphe suivant : effacer les données du site les emporte tous les
        trois d'un coup.

        La licence dans l'application, pas seulement dans le dépôt : sous AGPL,
        l'article 13 demande que qui accède au logiciel par le réseau puisse en
        obtenir la source. Le lien est épinglé au commit du build — ce qui est
        servi est minifié, et une branche qui a bougé depuis ne désigne plus le
        code qu'on a réellement reçu.
      */}
      <section className="reglages__bloc">
        <h2 className="surtitre">{t.reglages.apropos.titre}</h2>
        <p className="discret">{t.reglages.apropos.intro}</p>
        <p className="discret">{t.reglages.apropos.stockage}</p>
        <p className="discret">{t.reglages.apropos.effacement}</p>
        <p className="discret discret--petit">
          {t.reglages.apropos.licence}{' '}
          <a className="lien" href={SOURCE} target="_blank" rel="noreferrer noopener">
            {t.reglages.apropos.source}
          </a>{' '}
          <span className="discret">({REFERENCE})</span> ·{' '}
          <a className="lien" href="/THIRD-PARTY.txt">
            {t.reglages.apropos.tiers}
          </a>
        </p>
        <div className="reglages__actions">
          <LienBouton vers="/aide">{t.reglages.apropos.commentCaMarche}</LienBouton>
        </div>
      </section>
    </>
  )
}
