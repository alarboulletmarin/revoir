import { useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useDonnees } from '../state/useDonnees'
import { useTitrePage } from '../state/useTitrePage'
import {
  BackupError,
  backupFileName,
  parseBackup,
  serializeBackup,
  type ContenuSauvegarde,
} from '../lib/backup'
import { archivedTopics, categoriesTriees } from '../lib/sujets'
import { decrirePortee, listerDecalages, reviewsDepuisOffsets } from '../lib/schedules'
import { todayKey } from '../lib/dates'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Bouton, LienBouton } from '../components/Bouton'
import { Frise } from '../components/Frise'
import { ChipCategorie } from '../components/ChipCategorie'

type Retour = { ton: 'ok' | 'erreur'; message: string } | null

export function Settings() {
  useTitrePage('Réglages')
  const {
    categories,
    topics,
    reviews,
    importer,
    setArchived,
    programmes,
    supprimerProgramme,
    compterUsages,
  } = useDonnees()
  const champFichier = useRef<HTMLInputElement>(null)
  const [retour, setRetour] = useState<Retour>(null)
  const [enAttente, setEnAttente] = useState<ContenuSauvegarde | null>(null)

  const archives = archivedTopics(topics)
  const rangees = categoriesTriees(categories)

  const supprimer = (id: string, label: string) => {
    void supprimerProgramme(id).then((fait) => {
      if (fait) setRetour({ ton: 'ok', message: `Programme « ${label} » supprimé.` })
    })
  }

  const exporter = () => {
    // Les sujets archivés font partie de l'export (règle métier n°5).
    const blob = new Blob(
      [serializeBackup({ categories, topics, reviews, programmes })],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const lien = document.createElement('a')
    lien.href = url
    lien.download = backupFileName()
    document.body.append(lien)
    lien.click()
    lien.remove()
    // Libérer l'URL dans le même tour de boucle annulerait parfois le
    // téléchargement avant qu'il ne démarre.
    setTimeout(() => URL.revokeObjectURL(url), 0)
    setRetour({
      ton: 'ok',
      message: `${topics.length} sujet${topics.length > 1 ? 's' : ''} exporté${topics.length > 1 ? 's' : ''}.`,
    })
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
            : "Ce fichier n'a pas pu être lu.",
      })
    }
  }

  const confirmerImport = () => {
    if (!enAttente) return
    const nombre = enAttente.topics.length
    void importer(enAttente).then(() => {
      setRetour({
        ton: 'ok',
        message: `${nombre} sujet${nombre > 1 ? 's' : ''} importé${nombre > 1 ? 's' : ''}.`,
      })
    })
    setEnAttente(null)
  }

  return (
    <>
      <h1 className="page__titre">Réglages</h1>

      <section className="reglages__bloc">
        <h2 className="section__titre">Sauvegarde</h2>
        <p className="discret">
          Vos données restent sur cet appareil. L'export produit un fichier JSON que
          vous pouvez conserver puis réimporter, ici ou sur un autre appareil. Les
          sujets archivés y figurent.
        </p>
        <div className="reglages__actions">
          <Bouton variante="primaire" onClick={exporter}>
            Exporter les données
          </Bouton>
          <Bouton variante="discret" onClick={() => champFichier.current?.click()}>
            Importer un fichier
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
        Un aperçu et un lien, pas la gestion elle-même : renommer, recolorer et
        supprimer tiennent sur leur propre écran, et les Réglages sont déjà
        longs. Les chips disent d'un coup d'œil ce qu'il y a, ce qu'une liste
        d'éditeurs empilés dirait moins bien.
      */}
      <section className="reglages__bloc">
        <h2 className="section__titre">Catégories</h2>
        {rangees.length === 0 ? (
          <p className="discret">Aucune catégorie pour le moment.</p>
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
          <LienBouton vers="/categories">Gérer les catégories</LienBouton>
        </div>
      </section>

      <section className="reglages__bloc">
        <h2 className="section__titre">Programmes</h2>
        <p className="discret">
          Les trois programmes intégrés — Simple, Poussé, Ultime — couvrent la
          plupart des besoins. Vous pouvez composer les vôtres.
        </p>

        {programmes.length > 0 && (
          <ul className="rythmes">
            {programmes.map((programme) => {
              const usages = compterUsages(programme.id)
              return (
                <li key={programme.id} className="rythme">
                  <div className="rythme__entete">
                    <span className="rythme__nom">{programme.label}</span>
                    <span className="rythme__compte">
                      {programme.offsets.length} révision
                      {programme.offsets.length > 1 ? 's' : ''} ·{' '}
                      {decrirePortee(programme.offsets)}
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
                    intitule={`Programme ${programme.label}`}
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
                      {usages > 0 ? 'Renommer' : 'Modifier'}
                    </LienBouton>
                    {usages === 0 && (
                      <Bouton
                        variante="danger"
                        onClick={() => supprimer(programme.id, programme.label)}
                      >
                        Supprimer
                      </Bouton>
                    )}
                  </div>
                  {usages > 0 && (
                    <p className="discret discret--petit">
                      {usages > 1
                        ? `Suivi par ${usages} sujets : leurs révisions sont déjà planifiées, le rythme ne peut plus changer.`
                        : 'Suivi par un sujet : ses révisions sont déjà planifiées, le rythme ne peut plus changer.'}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <div className="reglages__actions">
          <LienBouton vers="/programmes/nouveau" variante="discret">
            Créer un programme
          </LienBouton>
        </div>
      </section>

      <section className="reglages__bloc">
        <h2 className="section__titre">Sujets archivés</h2>
        {archives.length === 0 ? (
          <p className="discret">Aucun sujet archivé.</p>
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
                  Désarchiver
                </Bouton>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="reglages__bloc">
        <h2 className="section__titre">À propos</h2>
        <p className="discret">
          Revoir planifie des révisions espacées sans jamais stocker ce que vous
          apprenez. Aucun compte, aucun serveur, aucune mesure d'audience : tout est
          enregistré dans le stockage local de votre navigateur.
        </p>
        <p className="discret">
          Effacer les données du site depuis votre navigateur supprime donc toutes vos
          révisions. Pensez à exporter régulièrement.
        </p>
      </section>

      <ConfirmDialog
        open={enAttente !== null}
        title="Remplacer les données actuelles ?"
        message={
          enAttente
            ? `L'import de ${enAttente.topics.length} sujet${enAttente.topics.length > 1 ? 's' : ''} remplacera vos ${topics.length} sujet${topics.length > 1 ? 's' : ''} actuel${topics.length > 1 ? 's' : ''}.`
            : ''
        }
        confirmLabel="Importer"
        danger
        onCancel={() => setEnAttente(null)}
        onConfirm={confirmerImport}
      />
    </>
  )
}
