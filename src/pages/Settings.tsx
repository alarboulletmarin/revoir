import { useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useItems } from '../state/useItems'
import { useTitrePage } from '../state/useTitrePage'
import { BackupError, backupFileName, parseBackup, serializeBackup } from '../lib/backup'
import { archivedItems } from '../lib/stats'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Bouton } from '../components/Bouton'
import type { Item } from '../types'

type Retour = { ton: 'ok' | 'erreur'; message: string } | null

export function Settings() {
  useTitrePage('Réglages')
  const { items, importItems, setArchived } = useItems()
  const champFichier = useRef<HTMLInputElement>(null)
  const [retour, setRetour] = useState<Retour>(null)
  const [enAttente, setEnAttente] = useState<Item[] | null>(null)

  const archives = archivedItems(items)

  const exporter = () => {
    // Les éléments archivés font partie de l'export (règle métier n°5).
    const blob = new Blob([serializeBackup(items)], { type: 'application/json' })
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
    const nombre = enAttente.length
    void importItems(enAttente).then(() => {
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
        <h2 className="section__titre">Éléments archivés</h2>
        {archives.length === 0 ? (
          <p className="discret">Aucun élément archivé.</p>
        ) : (
          <ul className="liste-revisions">
            {archives.map((item) => (
              <li key={item.id} className="archive">
                <Link to={`/element/${item.id}`} className="archive__corps">
                  <span className="archive__titre">{item.title}</span>
                  {item.category && <span className="chip">{item.category}</span>}
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
            ? `L'import de ${enAttente.length} élément${enAttente.length > 1 ? 's' : ''} remplacera vos ${items.length} élément${items.length > 1 ? 's' : ''} actuel${items.length > 1 ? 's' : ''}.`
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
