import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useItems } from '../state/useItems'
import { getSchedule } from '../lib/schedules'
import {
  formatIsoDate,
  formatLong,
  formatRelative,
  todayKey,
} from '../lib/dates'
import { itemProgress } from '../lib/stats'
import { ProgressBar } from '../components/ProgressBar'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { IconCheck } from '../components/Icons'

export function ItemDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { items, loading, valider, devalider, setArchived, removeItem } = useItems()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const today = todayKey()

  const item = items.find((candidate) => candidate.id === id)

  if (!item) {
    return loading ? (
      <p className="loading">Chargement…</p>
    ) : (
      <div className="stack">
        <p className="muted">Cet élément n’existe pas ou plus.</p>
        <Link to="/" className="button button--ghost">
          Retour au tableau de bord
        </Link>
      </div>
    )
  }

  const schedule = getSchedule(item.schedule)
  const done = item.reviews.filter((review) => review.done)
  const remaining = item.reviews.length - done.length
  const createdAt = formatIsoDate(item.createdAt)

  return (
    <div className="stack">
      <div className="detail__head">
        <h1 className="page-title">{item.title}</h1>
        <div className="detail__badges">
          {item.category && <span className="tag">{item.category}</span>}
          <span className="tag tag--soft">{schedule.label}</span>
          {item.archived && <span className="tag tag--warn">Archivé</span>}
        </div>
        {createdAt && <p className="page-subtitle">Créé le {createdAt}</p>}
      </div>

      <section className="card section">
        <h2 className="section__title">Progression</h2>
        <ProgressBar value={itemProgress(item)} label={`Progression de ${item.title}`} />
        <p className="muted detail__counts">
          {done.length} révision{done.length > 1 ? 's' : ''} effectuée
          {done.length > 1 ? 's' : ''} · {remaining} restante{remaining > 1 ? 's' : ''}
        </p>
      </section>

      <section className="card section">
        <h2 className="section__title">Révisions</h2>
        <p className="muted detail__start">Date de départ : {formatLong(item.startDate)}</p>
        <ul className="review-list">
          {item.reviews.map((review) => {
            const late = !review.done && review.date < today
            const isToday = review.date === today
            return (
              <li
                key={review.offset}
                className={`review-row${review.done ? ' review-row--done' : ''}`}
              >
                <button
                  type="button"
                  className="review-row__check"
                  role="checkbox"
                  aria-checked={review.done}
                  aria-label={`${review.done ? 'Annuler' : 'Marquer comme effectuée'} la révision J+${review.offset}`}
                  onClick={() =>
                    review.done
                      ? devalider(item.id, review.offset)
                      : valider(item.id, review.offset)
                  }
                >
                  {review.done && <IconCheck width="16" height="16" strokeWidth="2.2" />}
                </button>
                <div className="review-row__body">
                  <span className="review-row__title">
                    J+{review.offset} · {formatLong(review.date)}
                  </span>
                  <span className="review-row__meta">
                    {review.done ? (
                      <span>Effectuée</span>
                    ) : (
                      <span className={late ? 'review-row__late' : undefined}>
                        {isToday ? 'aujourd’hui' : formatRelative(review.date, today)}
                      </span>
                    )}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="card section">
        <h2 className="section__title">Actions</h2>
        <div className="detail__actions">
          <Link to={`/element/${item.id}/modifier`} className="button button--ghost">
            Modifier
          </Link>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => setArchived(item.id, !item.archived)}
          >
            {item.archived ? 'Désarchiver' : 'Archiver'}
          </button>
          <button
            type="button"
            className="button button--danger"
            onClick={() => setConfirmDelete(true)}
          >
            Supprimer
          </button>
        </div>
        <p className="muted detail__hint">
          Un élément archivé disparaît du tableau de bord et du calendrier, sans être
          supprimé.
        </p>
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer cet élément ?"
        message={`« ${item.title} » et ses ${item.reviews.length} révisions seront définitivement supprimés.`}
        confirmLabel="Supprimer"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false)
          void removeItem(item.id).then(() => navigate('/', { replace: true }))
        }}
      />
    </div>
  )
}
