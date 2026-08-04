import { useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useItems } from '../state/useItems'
import {
  BackupError,
  backupFileName,
  parseBackup,
  serializeBackup,
} from '../lib/backup'
import { archivedItems } from '../lib/stats'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Item } from '../types'

type Feedback = { tone: 'ok' | 'error'; message: string } | null

export function Settings() {
  const { items, importItems, setArchived } = useItems()
  const fileInput = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [pending, setPending] = useState<Item[] | null>(null)

  const archived = archivedItems(items)

  const exportData = () => {
    const blob = new Blob([serializeBackup(items)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = backupFileName()
    document.body.append(link)
    link.click()
    link.remove()
    // Libérer l'URL dans le même tour de boucle annulerait parfois le
    // téléchargement avant qu'il ne démarre.
    setTimeout(() => URL.revokeObjectURL(url), 0)
    setFeedback({
      tone: 'ok',
      message: `${items.length} élément${items.length > 1 ? 's' : ''} exporté${items.length > 1 ? 's' : ''}.`,
    })
  }

  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Le champ est réinitialisé pour que le même fichier puisse être
    // resélectionné après une erreur.
    event.target.value = ''
    if (!file) return
    try {
      const imported = parseBackup(await file.text())
      setPending(imported)
      setFeedback(null)
    } catch (error) {
      setFeedback({
        tone: 'error',
        message:
          error instanceof BackupError
            ? error.message
            : 'Ce fichier n’a pas pu être lu.',
      })
    }
  }

  const confirmImport = () => {
    if (!pending) return
    const count = pending.length
    void importItems(pending).then(() => {
      setFeedback({
        tone: 'ok',
        message: `${count} élément${count > 1 ? 's' : ''} importé${count > 1 ? 's' : ''}.`,
      })
    })
    setPending(null)
  }

  return (
    <div className="stack">
      <h1 className="page-title">Réglages</h1>

      <section className="card section">
        <h2 className="section__title">Sauvegarde</h2>
        <p className="muted">
          Vos données restent sur cet appareil. L’export produit un fichier JSON que
          vous pouvez conserver puis réimporter, ici ou sur un autre appareil.
        </p>
        <div className="detail__actions">
          <button type="button" className="button" onClick={exportData}>
            Exporter les données
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => fileInput.current?.click()}
          >
            Importer un fichier
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            onChange={(event) => void readFile(event)}
          />
        </div>
        {feedback && (
          <p
            className={`banner${feedback.tone === 'error' ? ' banner--error' : ' banner--ok'}`}
            role="status"
          >
            {feedback.message}
          </p>
        )}
      </section>

      <section className="card section">
        <h2 className="section__title">
          Éléments archivés <span className="count">{archived.length}</span>
        </h2>
        {archived.length === 0 ? (
          <p className="muted">Aucun élément archivé.</p>
        ) : (
          <ul className="item-list">
            {archived.map((item) => (
              <li key={item.id} className="archived-row">
                <Link to={`/element/${item.id}`} className="item-link">
                  <span className="item-link__title">{item.title}</span>
                  <span className="item-link__meta">
                    {item.category && <span className="tag">{item.category}</span>}
                  </span>
                </Link>
                <button
                  type="button"
                  className="button button--ghost button--small"
                  onClick={() => void setArchived(item.id, false)}
                >
                  Désarchiver
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card section">
        <h2 className="section__title">À propos</h2>
        <p className="muted">
          Revoir planifie des révisions espacées sans jamais stocker ce que vous
          apprenez. Aucun compte, aucun serveur, aucune mesure d’audience : tout est
          enregistré dans le stockage local de votre navigateur.
        </p>
        <p className="muted">
          Effacer les données du site depuis votre navigateur supprime donc toutes vos
          révisions. Pensez à exporter régulièrement.
        </p>
      </section>

      <ConfirmDialog
        open={pending !== null}
        title="Remplacer les données actuelles ?"
        message={
          pending
            ? `L’import de ${pending.length} élément${pending.length > 1 ? 's' : ''} remplacera vos ${items.length} élément${items.length > 1 ? 's' : ''} actuel${items.length > 1 ? 's' : ''}.`
            : ''
        }
        confirmLabel="Importer"
        danger
        onCancel={() => setPending(null)}
        onConfirm={confirmImport}
      />
    </div>
  )
}
