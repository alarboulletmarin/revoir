/**
 * Barres de charge (section 8.8) : 14 barres, hauteur proportionnelle au
 * nombre de révisions, opacité de 0,25 à 1 selon la densité. Le jour courant
 * porte un point sous sa barre.
 */
import type { DayLoad } from '../lib/stats'
import { formatLong, type DateKey } from '../lib/dates'

const OPACITE_MINIMUM = 0.25

interface BarresChargeProps {
  charge: DayLoad[]
  aujourdhui: DateKey
}

export function BarresCharge({ charge, aujourdhui }: BarresChargeProps) {
  const maximum = Math.max(1, ...charge.map((jour) => jour.count))
  const total = charge.reduce((somme, jour) => somme + jour.count, 0)

  return (
    <div className="charge" role="img" aria-label={resume(charge, total)}>
      {charge.map((jour) => {
        const part = jour.count / maximum
        return (
          <span key={jour.date} className="charge__jour">
            <span
              className="charge__barre"
              style={{
                height: `${Math.round(part * 100)}%`,
                opacity: OPACITE_MINIMUM + (1 - OPACITE_MINIMUM) * part,
              }}
              title={`${formatLong(jour.date)} : ${jour.count} révision${jour.count > 1 ? 's' : ''}`}
            />
            <span
              className={jour.date === aujourdhui ? 'charge__point' : 'charge__place'}
            />
          </span>
        )
      })}
    </div>
  )
}

function resume(charge: DayLoad[], total: number): string {
  const jours = charge.length
  if (total === 0) return `Aucune révision sur les ${jours} prochains jours.`
  return `${total} révision${total > 1 ? 's' : ''} réparties sur les ${jours} prochains jours.`
}
