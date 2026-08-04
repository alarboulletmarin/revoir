import type { DayLoad } from '../lib/stats'
import { formatCompact, formatLong, fromKey } from '../lib/dates'

/** Charge des prochains jours, en barres proportionnelles au jour le plus charge. */
export function LoadBars({ load }: { load: DayLoad[] }) {
  const max = Math.max(1, ...load.map((day) => day.count))

  return (
    <ul className="load">
      {load.map((day) => {
        const initial = fromKey(day.date)
          .toLocaleDateString('fr-FR', { weekday: 'narrow' })
          .toUpperCase()
        return (
          <li key={day.date} className="load__day">
            <span className="load__count">{day.count > 0 ? day.count : ''}</span>
            <div
              className="load__bar"
              style={{ height: `${day.count === 0 ? 3 : Math.round((day.count / max) * 100)}%` }}
              title={`${formatLong(day.date)} : ${day.count} révision${day.count > 1 ? 's' : ''}`}
            />
            <span className="load__label" aria-hidden="true">
              {initial}
            </span>
            <span className="load__date">{formatCompact(day.date)}</span>
          </li>
        )
      })}
    </ul>
  )
}
