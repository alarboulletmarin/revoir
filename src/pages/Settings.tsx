// SPDX-License-Identifier: AGPL-3.0-only

import { useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Programme } from '../types'
import { useDonnees } from '../state/useDonnees'
import { useToast } from '../state/useToast'
import { useTitrePage } from '../state/useTitrePage'
import { usePreferences, useTextes } from '../state/usePreferences'
import { THEMES, type Theme } from '../state/theme'
import { LANGUES, type Langue } from '../i18n'
import { fr } from '../i18n/fr'
import { en } from '../i18n/en'
import {
  BackupError,
  backupFileName,
  parseBackup,
  serializeBackup,
  type ContenuSauvegarde,
} from '../lib/backup'
import { echeancesIcs, nomFichierIcs, serialiserIcs } from '../lib/ics'
import { TYPE_ICS, TYPE_JSON, telecharger } from '../lib/telechargement'
import { REFERENCE, SOURCE } from '../lib/build'
import { archivedTopics, categoriesTriees } from '../lib/sujets'
import { decrirePortee, listerDecalages, reviewsDepuisOffsets } from '../lib/schedules'
import { todayKey } from '../lib/dates'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Bascule } from '../components/Bascule'
import { Bouton, LienBouton } from '../components/Bouton'
import { Frise } from '../components/Frise'
import { ChipCategorie } from '../components/ChipCategorie'

type Retour = { ton: 'ok' | 'erreur'; message: string } | null

/**
 * Chaque langue se nomme dans sa propre langue.
 *
 * « Français » ne se traduit pas par « French » dans un sélecteur : quelqu'un
 * qui ouvre l'application dans une langue qu'il ne lit pas doit pouvoir y
 * reconnaître la sienne. C'est le seul endroit du projet qui lise deux
 * dictionnaires à la fois.
 */
const NOM_LANGUE: Record<Langue, string> = { fr: fr.nom, en: en.nom }

export function Settings() {
  const t = useTextes()
  useTitrePage(t.reglages.titre)
  const {
    categories,
    topics,
    reviews,
    importer,
    setArchived,
    programmes,
    supprimerProgramme,
    restaurerProgramme,
    compterUsages,
  } = useDonnees()
  const { theme, definirTheme, langue, definirLangue } = usePreferences()
  const { afficherToast } = useToast()
  const champFichier = useRef<HTMLInputElement>(null)
  const [retour, setRetour] = useState<Retour>(null)
  const [retourIcs, setRetourIcs] = useState<Retour>(null)
  const [enAttente, setEnAttente] = useState<ContenuSauvegarde | null>(null)

  const archives = archivedTopics(topics)
  const rangees = categoriesTriees(categories)

  /*
   * On annule, on ne confirme pas (règle métier n°3). Un programme supprimable
   * n'est suivi par aucun sujet — il n'emporte donc rien —, mais il a pu
   * demander quelques gestes à composer, et un message de constat ne les rendait
   * pas. Le toast, lui, les rend.
   */
  const supprimer = (programme: Programme) => {
    void supprimerProgramme(programme.id).then((fait) => {
      if (!fait) return
      afficherToast({
        texte: t.reglages.programmes.supprime,
        detail: programme.label,
        action: {
          libelle: t.commun.annuler,
          onAction: () => restaurerProgramme(programme),
        },
      })
    })
  }

  const exporter = () => {
    // Les sujets archivés font partie de l'export (règle métier n°5).
    telecharger(
      serializeBackup({ categories, topics, reviews, programmes }),
      backupFileName(),
      TYPE_JSON,
    )
    setRetour({ ton: 'ok', message: t.reglages.sauvegarde.exportes(topics.length) })
  }

  /*
   * L'export calendrier, à côté de la sauvegarde parce que c'est la même
   * question — « comment je sors mes données d'ici ? » —, et distinct d'elle
   * parce que la réponse n'est pas la même : le JSON revient, l'`.ics` non.
   *
   * Un compte à zéro n'est pas une erreur, c'est un fait : tout est fait, il
   * n'y a rien à mettre dans un agenda. Livrer un fichier vide laisserait
   * croire à un import silencieusement raté.
   */
  const exporterCalendrier = () => {
    const echeances = echeancesIcs(topics, reviews, categories, programmes)
    if (echeances.length === 0) {
      setRetourIcs({ ton: 'erreur', message: t.ics.aucune })
      return
    }
    telecharger(
      serialiserIcs(echeances, t.ics.nomCalendrier),
      nomFichierIcs(),
      TYPE_ICS,
    )
    setRetourIcs({ ton: 'ok', message: t.ics.exportees(echeances.length) })
  }

  const lireFichier = async (event: ChangeEvent<HTMLInputElement>) => {
    const fichier = event.target.files?.[0]
    // Le champ est réinitialisé pour que le même fichier puisse être
    // resélectionné après une erreur.
    event.target.value = ''
    if (!fichier) return
    try {
      setEnAttente(parseBackup(await fichier.text()))
      setRetour(null)
    } catch (erreur) {
      setRetour({
        ton: 'erreur',
        message:
          erreur instanceof BackupError
            ? erreur.message
            : t.reglages.sauvegarde.illisible,
      })
    }
  }

  const confirmerImport = () => {
    if (!enAttente) return
    const nombre = enAttente.topics.length
    void importer(enAttente).then(() => {
      setRetour({ ton: 'ok', message: t.reglages.sauvegarde.importes(nombre) })
    })
    setEnAttente(null)
  }

  return (
    <>
      <h1 className="page__titre">{t.reglages.titre}</h1>

      {/*
        L'apparence et la langue en tête : ce sont les deux réglages qui
        changent l'écran sous les doigts, et les seuls qu'on vienne chercher
        sans savoir où ils sont. Ni l'une ni l'autre n'appartient aux données —
        d'où leur absence de l'export, dite juste en dessous.
      */}
      <section className="reglages__bloc">
        <h2 className="section__titre">{t.reglages.apparence.titre}</h2>
        <p className="discret">{t.reglages.apparence.intro}</p>
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
        <h2 className="section__titre">{t.reglages.langue.titre}</h2>
        <p className="discret">{t.reglages.langue.intro}</p>
        <Bascule<Langue>
          legende={t.reglages.langue.legende}
          legendeMasquee
          valeur={langue}
          options={LANGUES.map((valeur) => ({ valeur, libelle: NOM_LANGUE[valeur] }))}
          onChange={definirLangue}
        />
      </section>

      <section className="reglages__bloc">
        <h2 className="section__titre">{t.reglages.sauvegarde.titre}</h2>
        <p className="discret">{t.reglages.sauvegarde.intro}</p>
        <div className="reglages__actions">
          <Bouton variante="primaire" onClick={exporter}>
            {t.reglages.sauvegarde.exporter}
          </Bouton>
          <Bouton variante="discret" onClick={() => champFichier.current?.click()}>
            {t.reglages.sauvegarde.importer}
          </Bouton>
          <input
            ref={champFichier}
            type="file"
            accept="application/json,.json"
            className="invisible"
            onChange={(event) => void lireFichier(event)}
          />
        </div>
        {retour && (
          <p
            className={
              retour.ton === 'erreur'
                ? 'banniere banniere--retard'
                : 'banniere banniere--fait'
            }
            role="status"
          >
            {retour.message}
          </p>
        )}
      </section>

      {/*
        L'export calendrier de **tous** les sujets vit ici, et pas sur la vue
        Calendrier : celle-ci répond à « quand ? », elle n'est pas un écran
        d'outils, et le tableau de bord n'est pas davantage l'endroit
        d'un bouton de fichier. L'export d'un sujet seul, lui, est sur sa fiche,
        parmi ses autres actions — c'est là qu'on l'a en tête.
      */}
      <section className="reglages__bloc">
        <h2 className="section__titre">{t.reglages.calendrier.titre}</h2>
        <p className="discret">{t.reglages.calendrier.intro}</p>
        <p className="discret discret--petit">{t.reglages.calendrier.note}</p>
        <div className="reglages__actions">
          <Bouton variante="discret" onClick={exporterCalendrier}>
            {t.reglages.calendrier.exporter}
          </Bouton>
        </div>
        {retourIcs && (
          <p
            className={
              retourIcs.ton === 'erreur'
                ? 'banniere banniere--retard'
                : 'banniere banniere--fait'
            }
            role="status"
          >
            {retourIcs.message}
          </p>
        )}
      </section>

      {/*
        Un aperçu et un lien, pas la gestion elle-même : renommer, recolorer et
        supprimer tiennent sur leur propre écran, et les Réglages sont déjà
        longs. Les chips disent d'un coup d'œil ce qu'il y a, ce qu'une liste
        d'éditeurs empilés dirait moins bien.
      */}
      <section className="reglages__bloc">
        <h2 className="section__titre">{t.reglages.categories.titre}</h2>
        {rangees.length === 0 ? (
          <p className="discret">{t.reglages.categories.aucune}</p>
        ) : (
          <ul className="reglages__apercu">
            {rangees.map((categorie) => (
              <li key={categorie.id}>
                <ChipCategorie categorie={categorie} />
              </li>
            ))}
          </ul>
        )}
        <div className="reglages__actions">
          <LienBouton vers="/categories">{t.reglages.categories.gerer}</LienBouton>
        </div>
      </section>

      <section className="reglages__bloc">
        <h2 className="section__titre">{t.reglages.programmes.titre}</h2>
        <p className="discret">{t.reglages.programmes.intro}</p>

        {programmes.length > 0 && (
          <ul className="rythmes">
            {programmes.map((programme) => {
              const usages = compterUsages(programme.id)
              return (
                <li key={programme.id} className="rythme">
                  <div className="rythme__entete">
                    <span className="rythme__nom">{programme.label}</span>
                    <span className="rythme__compte">
                      {t.reglages.programmes.compte(
                        programme.offsets.length,
                        decrirePortee(programme.offsets),
                      )}
                    </span>
                  </div>
                  <Frise
                    origine={todayKey()}
                    reviews={reviewsDepuisOffsets(
                      'apercu',
                      todayKey(),
                      programme.offsets,
                    )}
                    aujourdhui={todayKey()}
                    variante="mini"
                    intitule={t.reglages.programmes.intitule(programme.label)}
                  />
                  <span className="rythme__jours">
                    {listerDecalages(programme.offsets)}
                  </span>
                  {/*
                    Le nom se renomme toujours ; le rythme et la suppression
                    tombent dès qu'un sujet suit le programme.
                  */}
                  <div className="rythme__actions">
                    <LienBouton
                      vers={`/programmes/${programme.id}/modifier`}
                      variante="discret"
                    >
                      {usages > 0
                        ? t.reglages.programmes.renommer
                        : t.reglages.programmes.modifier}
                    </LienBouton>
                    {usages === 0 && (
                      <Bouton variante="danger" onClick={() => supprimer(programme)}>
                        {t.commun.supprimer}
                      </Bouton>
                    )}
                  </div>
                  {usages > 0 && (
                    <p className="discret discret--petit">
                      {t.reglages.programmes.usages(usages)}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <div className="reglages__actions">
          <LienBouton vers="/programmes/nouveau" variante="discret">
            {t.reglages.programmes.creer}
          </LienBouton>
        </div>
      </section>

      <section className="reglages__bloc">
        <h2 className="section__titre">{t.reglages.archives.titre}</h2>
        {archives.length === 0 ? (
          <p className="discret">{t.reglages.archives.aucun}</p>
        ) : (
          <ul className="liste-revisions">
            {archives.map((topic) => (
              <li key={topic.id} className="archive">
                <Link to={`/sujet/${topic.id}`} className="archive__corps">
                  <span className="archive__titre">{topic.title}</span>
                  <ChipCategorie
                    categorie={
                      categories.find((candidat) => candidat.id === topic.categoryId) ??
                      null
                    }
                  />
                </Link>
                <Bouton variante="discret" onClick={() => setArchived(topic.id, false)}>
                  {t.reglages.archives.desarchiver}
                </Bouton>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="reglages__bloc">
        <h2 className="section__titre">{t.reglages.apropos.titre}</h2>
        <p className="discret">{t.reglages.apropos.intro}</p>
        <p className="discret">{t.reglages.apropos.effacement}</p>
        {/*
          La licence dans l'application, pas seulement dans le dépôt : c'est ce
          qui rend le projet trouvable depuis le produit. Les notices des
          composants tiers sont servies en fichier statique et précachées — la
          MIT demande que leurs mentions accompagnent le code distribué, et ce
          code est dans le bundle.

          Sous AGPL, ce bloc n'est plus seulement une courtoisie : l'article 13
          demande que qui accède au logiciel par le réseau puisse en obtenir la
          source. Le lien est donc épinglé au commit du build (voir
          `src/lib/build.ts`) — ce qui est servi est minifié, et une branche qui
          a bougé depuis ne désigne plus le code qu'on a réellement reçu.
        */}
        <p className="discret">
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

      <ConfirmDialog
        open={enAttente !== null}
        title={t.reglages.sauvegarde.confirmerTitre}
        message={
          enAttente
            ? t.reglages.sauvegarde.confirmerMessage(
                enAttente.topics.length,
                topics.length,
              )
            : ''
        }
        confirmLabel={t.reglages.sauvegarde.confirmerAction}
        danger
        onCancel={() => setEnAttente(null)}
        onConfirm={confirmerImport}
      />
    </>
  )
}
