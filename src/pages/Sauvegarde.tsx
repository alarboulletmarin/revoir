// SPDX-License-Identifier: AGPL-3.0-only

import { useRef, useState, type ChangeEvent } from 'react'
import { useDonnees } from '../state/useDonnees'
import { useTitrePage } from '../state/useTitrePage'
import { useTextes } from '../state/usePreferences'
import {
  BackupError,
  backupFileName,
  parseBackup,
  serializeBackup,
  type ContenuSauvegarde,
} from '../lib/backup'
import { echeancesIcs, nomFichierIcs, serialiserIcs } from '../lib/ics'
import { TYPE_ICS, TYPE_JSON, telecharger } from '../lib/telechargement'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Bouton } from '../components/Bouton'

type Retour = { ton: 'ok' | 'erreur'; message: string } | null

/**
 * Sauvegarde et export — section 8.27 du design system.
 *
 * Trois gestes, une seule question : « comment je sors mes données d'ici ? ».
 * Ils vivaient dans deux cartes des réglages, entre l'apparence et les
 * catégories ; ils ont maintenant leur écran, parce qu'on ne vient pas ici par
 * hasard et qu'un import a besoin de place pour dire ce qu'il fait.
 *
 * L'export JSON est le geste principal : c'est le seul qui revienne. L'`.ics`
 * est une copie qui part et ne rentre pas, et il le dit.
 */
export function Sauvegarde() {
  const t = useTextes()
  useTitrePage(t.reglages.sauvegarde.titre)
  const { categories, topics, reviews, programmes, importer } = useDonnees()
  const champFichier = useRef<HTMLInputElement>(null)
  const [retour, setRetour] = useState<Retour>(null)
  const [retourIcs, setRetourIcs] = useState<Retour>(null)
  const [enAttente, setEnAttente] = useState<ContenuSauvegarde | null>(null)

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
    telecharger(serialiserIcs(echeances, t.ics.nomCalendrier), nomFichierIcs(), TYPE_ICS)
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
          erreur instanceof BackupError ? erreur.message : t.reglages.sauvegarde.illisible,
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
      <div className="page__entete">
        <h1 className="titre-page">{t.reglages.sauvegarde.titre}</h1>
        <p className="page__intro">{t.reglages.sauvegarde.intro}</p>
      </div>

      <section className="reglages__bloc">
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

        {/*
          Un import refusé se dit dans un encadré, pas dans un bandeau : il
          porte le message exact du validateur — « Sujet 3 : catégorie
          inconnue. » — et surtout le fait que rien n'a été écrit. C'est cette
          seconde phrase qu'on vient chercher.
        */}
        {retour !== null &&
          (retour.ton === 'erreur' ? (
            <div className="erreur" role="alert">
              <p className="erreur__texte">{retour.message}</p>
              <p className="discret discret--petit">{t.reglages.sauvegarde.rienEcrit}</p>
              <Bouton variante="discret" onClick={() => champFichier.current?.click()}>
                {t.reglages.sauvegarde.autreFichier}
              </Bouton>
            </div>
          ) : (
            <p className="banniere banniere--fait" role="status">
              {retour.message}
            </p>
          ))}
      </section>

      {/*
        L'export calendrier de **tous** les sujets vit ici, et pas sur la vue
        Calendrier : celle-ci répond à « quand ? », elle n'est pas un écran
        d'outils. L'export d'un sujet seul, lui, est sur sa fiche, parmi ses
        autres actions — c'est là qu'on l'a en tête.
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
        L'import remplace, il ne fusionne pas : c'est l'une des trois actions
        qu'aucun geste inverse ne rebâtirait, et la seule de cet écran à
        demander une confirmation (section 8.12).
      */}
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
