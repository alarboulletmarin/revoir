import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useItems } from '../state/useItems'
import { formatLong, todayKey } from '../lib/dates'
import {
  computeStats,
  loadForDays,
  overdueEntries,
  todayEntries,
  upcomingEntries,
} from '../lib/stats'
import type { ReviewEntry } from '../types'
import { ReviewRow } from '../components/ReviewRow'
import { StatGrid } from '../components/StatGrid'
import { LoadBars } from '../components/LoadBars'
import { EmptyState } from '../components/EmptyState'

export function Dashboard() {
  const { items, loading, setReviewDone } = useItems()
  const today = todayKey()

  const view = useMemo(
    () => ({
      overdue: overdueEntries(items, today),
      today: todayEntries(items, today),
      upcoming: upcomingEntries(items, 8, today),
      stats: computeStats(items, today),
      load: loadForDays(items, 7, today),
    }),
    [items, today],
  )

  const toggle = (entry: ReviewEntry, done: boolean) => {
    void setReviewDone(entry.item.id, entry.review.offset, done)
  }

  if (loading) {
    return <p className="loading">Chargement…</p>
  }

  if (items.length === 0) {
    return (
      <EmptyState title="Aucun élément pour le moment">
        <p>
          Ajoutez ce que vous souhaitez revoir : un titre, une catégorie, une date de
          départ. Revoir se charge de planifier les révisions.
        </p>
        <Link to="/nouveau" className="button">
          Ajouter un élément
        </Link>
      </EmptyState>
    )
  }

  const remainingToday = view.today.filter((entry) => !entry.review.done)

  return (
    <div className="stack">
      <section className="section">
        <h1 className="page-title">Aujourd’hui</h1>
        <p className="page-subtitle">{formatLong(today)}</p>
      </section>

      {view.overdue.length > 0 && (
        <section className="card card--warn section">
          <h2 className="section__title">
            En retard <span className="count">{view.overdue.length}</span>
          </h2>
          <ul className="review-list">
            {view.overdue.map((entry) => (
              <ReviewRow
                key={`${entry.item.id}-${entry.review.offset}`}
                entry={entry}
                today={today}
                onToggle={toggle}
              />
            ))}
          </ul>
        </section>
      )}

      <section className="card section">
        <h2 className="section__title">
          À revoir aujourd’hui <span className="count">{remainingToday.length}</span>
        </h2>
        {view.today.length === 0 ? (
          <p className="muted">Rien de prévu aujourd’hui.</p>
        ) : (
          <ul className="review-list">
            {view.today.map((entry) => (
              <ReviewRow
                key={`${entry.item.id}-${entry.review.offset}`}
                entry={entry}
                today={today}
                onToggle={toggle}
                hideDate
              />
            ))}
          </ul>
        )}
      </section>

      <section className="card section">
        <h2 className="section__title">Prochaines révisions</h2>
        {view.upcoming.length === 0 ? (
          <p className="muted">Aucune révision à venir.</p>
        ) : (
          <ul className="review-list">
            {view.upcoming.map((entry) => (
              <ReviewRow
                key={`${entry.item.id}-${entry.review.offset}`}
                entry={entry}
                today={today}
                onToggle={toggle}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="card section">
        <h2 className="section__title">Charge des 7 prochains jours</h2>
        <LoadBars load={view.load} />
      </section>

      <section className="card section">
        <h2 className="section__title">Statistiques</h2>
        <StatGrid
          stats={[
            { label: 'Éléments actifs', value: view.stats.activeItems },
            { label: 'Révisions effectuées', value: view.stats.doneReviews },
            { label: 'Révisions restantes', value: view.stats.remainingReviews },
            { label: 'Aujourd’hui', value: view.stats.todayReviews },
            { label: 'En retard', value: view.stats.overdueReviews, tone: 'warn' },
            { label: 'Progression', value: view.stats.progress, suffix: ' %' },
          ]}
        />
      </section>

      <section className="section">
        <h2 className="section__title">Tous les éléments</h2>
        <ul className="item-list">
          {items
            .filter((item) => !item.archived)
            .map((item) => (
              <li key={item.id}>
                <Link to={`/element/${item.id}`} className="item-link">
                  <span className="item-link__title">{item.title}</span>
                  <span className="item-link__meta">
                    {item.category && <span className="tag">{item.category}</span>}
                    <span>
                      {item.reviews.filter((review) => review.done).length}/
                      {item.reviews.length}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </section>
    </div>
  )
}
