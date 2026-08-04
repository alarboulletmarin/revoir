import { Link } from 'react-router-dom'
import type { ReviewEntry } from '../types'
import { formatRelative, formatShort, type DateKey } from '../lib/dates'
import { IconCheck } from './Icons'

interface ReviewRowProps {
  entry: ReviewEntry
  today: DateKey
  onToggle: (entry: ReviewEntry, done: boolean) => void
  /** Masque la date lorsque la liste est déjà groupée par jour. */
  hideDate?: boolean
}

export function ReviewRow({ entry, today, onToggle, hideDate = false }: ReviewRowProps) {
  const { item, review } = entry
  const overdue = !review.done && review.date < today
  const label = `${review.done ? 'Annuler' : 'Marquer comme effectuée'} : ${item.title}, révision J+${review.offset}`

  return (
    <li className={`review-row${review.done ? ' review-row--done' : ''}`}>
      <button
        type="button"
        className="review-row__check"
        role="checkbox"
        aria-checked={review.done}
        aria-label={label}
        onClick={() => onToggle(entry, !review.done)}
      >
        {review.done && <IconCheck width="16" height="16" strokeWidth="2.2" />}
      </button>

      <Link to={`/element/${item.id}`} className="review-row__body">
        <span className="review-row__title">{item.title}</span>
        <span className="review-row__meta">
          {item.category && <span className="tag">{item.category}</span>}
          <span>J+{review.offset}</span>
          {!hideDate && <span>{formatShort(review.date)}</span>}
          {overdue && (
            <span className="review-row__late">{formatRelative(review.date, today)}</span>
          )}
        </span>
      </Link>
    </li>
  )
}
