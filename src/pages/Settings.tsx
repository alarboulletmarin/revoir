import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useItems } from '../state/useItems'
import { useTitrePage } from '../state/useTitrePage'
import {
  BackupError,
  backupFileName,
  parseBackup,
  serializeBackup,
  type ContenuSauvegarde,
} from '../lib/backup'
import { archivedItems, usedCategories } from '../lib/stats'
import { teinteDe } from '../lib/categories'
import {
  RYTHME_MAX_REVISIONS,
  listerDecalages,
  normaliserRythme,
  reviewsDepuisOffsets,
  decrirePortee,
} from '../lib/schedules'
import { todayKey } from '../lib/dates'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Bouton } from '../components/Bouton'
import { Champ } from '../components/Champ'
import { Frise } from '../components/Frise'
import { SelecteurTeinte } from '../components/SelecteurTeinte'
import { ChipCategorie, PastilleCategorie } from '../components/ChipCategorie'

type Retour = { ton: 'ok' | 'erreur'; message: string } | null

export function Settings() {
  useTitrePage('Réglages')
  const {
    items,
    teintes,
    definirTeinte,
    importItems,
    setArchived,
    programmes,
    creerProgramme,
    supprimerProgramme,
    compterUsages,
  } = useItems()
  const champFichier = useRef<HTMLInputElement>(null)
  const [retour, setRetour] = useState<Retour>(null)
  const [enAttente, setEnAttente] = useState<ContenuSauvegarde | null>(null)
  const [nomRythme, setNomRythme] = useState('')
  const [saisieRythme, setSaisieRythme] = useState('')
  const [soumis, setSoumis] = useState(false)

  const archives = archivedItems(items)
  const matieres = usedCategories(items)

  const offsets = useMemo(() => normaliserRythme(saisieRythme), [saisieRythme])

  const erreurNom =
    nomRythme.trim() === ''
      ? 'Le nom est obligatoire.'
      : programmes.some(
            (programme) =>
              programme.label.toLocaleLowerCase('fr') ===
              nomRythme.trim().toLocaleLowerCase('fr'),
          )
        ? 'Un programme porte déjà ce nom.'
        : null

  const erreurRythme =
    offsets.length === 0 ? 'Indiquez au moins un jour, par exemple 1 3 7 14 30.' : null

  const creer = (event: FormEvent) => {
    event.preventDefault()
    setSoumis(true)
    if (erreurNom || erreurRythme) return
    const nom = nomRythme.trim()
    void creerProgramme(nom, offsets).then(() => {
      setNomRythme('')
      setSaisieRythme('')
      setSoumis(false)
      setRetour({ ton: 'ok', message: `Programme « ${nom} » créé.` })
    })
  }

  const supprimer = (id: string, label: string) => {
    void supprimerProgramme(id).then((fait) => {
      if (fait) setRetour({ ton: 'ok', message: `Programme « ${label} » supprimé.` })
    })
  }

  const exporter = () => {
    // Les éléments archivés font partie de l'export (règle métier n°5).
    const blob = new Blob([serializeBackup(items, teintes, programmes)], {
      type: 'application/json',
    })
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
      message: `${items.length} élément${items.length > 1 ? 's' : ''} exporté${items.length > 1 ? 's' : ''}.`,
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
    const nombre = enAttente.items.length
    void importItems(enAttente.items, enAttente.teintes, enAttente.programmes).then(() => {
      setRetour({
        ton: 'ok',
        message: `${nombre} élément${nombre > 1 ? 's' : ''} importé${nombre > 1 ? 's' : ''}.`,
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
          éléments archivés y figurent.
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

      <section className="reglages__bloc">
        <h2 className="section__titre">Catégories</h2>
        {matieres.length === 0 ? (
          <p className="discret">Aucune catégorie pour le moment.</p>
        ) : (
          <ul className="matieres-reglage">
            {matieres.map((matiere) => (
              <li key={matiere} className="matiere-reglage">
                <span className="matiere-reglage__nom">
                  <PastilleCategorie categorie={matiere} teintes={teintes} />
                  {matiere}
                </span>
                <SelecteurTeinte
                  groupe="matiere"
                  legende={`Couleur de ${matiere}`}
                  legendeMasquee
                  valeur={teinteDe(matiere, teintes)}
                  onChange={(teinte) => definirTeinte(matiere, teinte)}
                />
              </li>
            ))}
          </ul>
        )}
        <p className="discret discret--petit">
          Une catégorie sans couleur choisie en reçoit une, dérivée de son nom.
        </p>
      </section>

      <section className="reglages__bloc">
        <h2 className="section__titre">Programmes</h2>
        <p className="discret">
          Les trois programmes intégrés — Simple, Poussé, Ultime — couvrent la
          plupart des besoins. Vous pouvez créer les vôtres : un nom, et les jours
          où la révision revient.
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
                    reviews={reviewsDepuisOffsets(todayKey(), programme.offsets)}
                    aujourdhui={todayKey()}
                    variante="mini"
                    intitule={`Programme ${programme.label}`}
                  />
                  <span className="rythme__jours">
                    {listerDecalages(programme.offsets)}
                  </span>
                  {usages > 0 ? (
                    <p className="discret discret--petit">
                      Utilisé par {usages} élément{usages > 1 ? 's' : ''} : ses
                      révisions sont déjà planifiées, il ne peut pas être supprimé.
                    </p>
                  ) : (
                    <div className="rythme__actions">
                      <Bouton
                        variante="danger"
                        onClick={() => supprimer(programme.id, programme.label)}
                      >
                        Supprimer
                      </Bouton>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <form className="formulaire" onSubmit={creer} noValidate>
          <Champ
            label="Nom du programme"
            type="text"
            value={nomRythme}
            maxLength={40}
            autoComplete="off"
            onChange={(event) => setNomRythme(event.target.value)}
            erreur={soumis ? erreurNom : null}
          />
          <Champ
            label="Rythme"
            type="text"
            inputMode="numeric"
            value={saisieRythme}
            maxLength={120}
            autoComplete="off"
            onChange={(event) => setSaisieRythme(event.target.value)}
            aide={`Les jours après le départ, séparés par des espaces. ${RYTHME_MAX_REVISIONS} au plus.`}
            erreur={soumis ? erreurRythme : null}
          />

          {/*
            Ce que le champ a retenu, écrit noir sur blanc : les doublons et
            les valeurs hors bornes tombent, et il n'y a qu'ici qu'on peut
            s'en apercevoir. On choisit un rythme, pas un mot (section 8.7) —
            d'où la frise.
          */}
          {offsets.length > 0 && (
            <div className="rythme__apercu">
              <Frise
                origine={todayKey()}
                reviews={reviewsDepuisOffsets(todayKey(), offsets)}
                aujourdhui={todayKey()}
                variante="mini"
                intitule="Aperçu du rythme"
              />
              <span className="rythme__jours">
                {offsets.length} révision{offsets.length > 1 ? 's' : ''} ·{' '}
                {decrirePortee(offsets)} · {listerDecalages(offsets)}
              </span>
            </div>
          )}

          {/*
            Discret, pas primaire : « Exporter les données » tient déjà ce rôle
            plus haut, et il n'y a qu'une surface --accent pleine par écran
            (sections 3 et 8.4).
          */}
          <div className="formulaire__actions">
            <Bouton variante="discret" type="submit">
              Créer le programme
            </Bouton>
          </div>
        </form>
      </section>

      <section className="reglages__bloc">
        <h2 className="section__titre">Éléments archivés</h2>
        {archives.length === 0 ? (
          <p className="discret">Aucun élément archivé.</p>
        ) : (
          <ul className="liste-revisions">
            {archives.map((item) => (
              <li key={item.id} className="archive">
                <Link to={`/element/${item.id}`} className="archive__corps">
                  <span className="archive__titre">{item.title}</span>
                  <ChipCategorie categorie={item.category} teintes={teintes} />
                </Link>
                <Bouton variante="discret" onClick={() => setArchived(item.id, false)}>
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
            ? `L'import de ${enAttente.items.length} élément${enAttente.items.length > 1 ? 's' : ''} remplacera vos ${items.length} élément${items.length > 1 ? 's' : ''} actuel${items.length > 1 ? 's' : ''}.`
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
