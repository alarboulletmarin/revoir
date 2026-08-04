import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { useItems } from '../state/useItems'
import { formatLong, formatMonth, fromKey, toKey, todayKey } from '../lib/dates'
import { entriesForDate } from '../lib/stats'
import type { ReviewEntry } from '../types'
import { ReviewRow } from '../components/ReviewRow'
import { IconChevronLeft, IconChevronRight } from '../components/Icons'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function CalendarPage() {
  const { items, valider, devalider } = useItems()
  const today = todayKey()
  const [selected, setSelected] = useState(today)
  const [month, setMonth] = useState(() => startOfMonth(fromKey(today)))

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end }).map((date) => {
      const key = toKey(date)
      const entries = entriesForDate(items, key)
      return {
        key,
        day: date.getDate(),
        inMonth: isSameMonth(date, month),
        total: entries.length,
        pending: entries.filter((entry) => !entry.review.done).length,
      }
    })
  }, [items, month])

  const selectedEntries = useMemo(
    () => entriesForDate(items, selected),
    [items, selected],
  )

  const toggle = (entry: ReviewEntry, done: boolean) => {
    if (done) valider(entry.item.id, entry.review.offset)
    else devalider(entry.item.id, entry.review.offset)
  }

  const goToMonth = (next: Date) => {
    setMonth(next)
  }

  return (
    <div className="stack">
      <h1 className="page-title">Calendrier</h1>

      <section className="card section">
        <div className="calendar__header">
          <button
            type="button"
            className="icon-button"
            aria-label="Mois précédent"
            onClick={() => goToMonth(subMonths(month, 1))}
          >
            <IconChevronLeft />
          </button>
          <h2 className="calendar__month">{formatMonth(month)}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Mois suivant"
            onClick={() => goToMonth(addMonths(month, 1))}
          >
            <IconChevronRight />
          </button>
        </div>

        <div className="calendar__weekdays" aria-hidden="true">
          {WEEKDAYS.map((day, index) => (
            <span key={`${day}-${index}`}>{day}</span>
          ))}
        </div>

        <div className="calendar__grid">
          {days.map((day) => {
            const classes = ['calendar__day']
            if (!day.inMonth) classes.push('calendar__day--outside')
            if (day.key === today) classes.push('calendar__day--today')
            if (day.key === selected) classes.push('calendar__day--selected')
            const suffix =
              day.total === 0
                ? 'aucune révision'
                : `${day.total} révision${day.total > 1 ? 's' : ''}`
            return (
              <button
                key={day.key}
                type="button"
                className={classes.join(' ')}
                aria-pressed={day.key === selected}
                aria-label={`${formatLong(day.key)}, ${suffix}`}
                onClick={() => setSelected(day.key)}
              >
                <span className="calendar__number">{day.day}</span>
                {day.total > 0 && (
                  <span
                    className={`calendar__dot${day.pending === 0 ? ' calendar__dot--done' : ''}`}
                  >
                    {day.total}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {toKey(month) !== toKey(startOfMonth(fromKey(today))) && (
          <button
            type="button"
            className="button button--ghost button--small calendar__reset"
            onClick={() => {
              setMonth(startOfMonth(fromKey(today)))
              setSelected(today)
            }}
          >
            Revenir à aujourd’hui
          </button>
        )}
      </section>

      <section className="card section">
        <h2 className="section__title">{formatLong(selected)}</h2>
        {selectedEntries.length === 0 ? (
          <p className="muted">Aucune révision ce jour-là.</p>
        ) : (
          <ul className="review-list">
            {selectedEntries.map((entry) => (
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
    </div>
  )
}
