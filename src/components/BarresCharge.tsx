// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Barres de charge (section 8.8) : 14 barres, hauteur proportionnelle au
 * nombre de révisions, opacité de 0,25 à 1 selon la densité.
 *
 * La hauteur ne porte jamais l'information seule — chaque barre est une entrée
 * de liste dont le texte, masqué à l'œil, donne son jour et son effectif —, et
 * trois repères datent l'axe sous les barres.
 */
import type { DayLoad } from '../lib/stats'
import { formatCompact, formatShort, type DateKey } from '../lib/dates'
import { textes } from '../i18n'
import { useTextes } from '../state/usePreferences'

const OPACITE_MINIMUM = 0.25

interface BarresChargeProps {
  charge: DayLoad[]
  aujourdhui: DateKey
}

export function BarresCharge({ charge, aujourdhui }: BarresChargeProps) {
  const t = useTextes()
  const maximum = Math.max(1, ...charge.map((jour) => jour.count))
  const total = charge.reduce((somme, jour) => somme + jour.count, 0)

  if (total === 0) {
    return (
      <p className="discret discret--petit">{t.charge.aucune(charge.length)}</p>
    )
  }

  return (
    <div className="charge">
      <ul
        className="charge__barres"
        aria-label={t.charge.intitule(charge.length)}
      >
        {charge.map((jour) => (
          <li key={jour.date} className="charge__jour">
            <span className="invisible">{etiquetteJour(jour, aujourdhui)}</span>
            <span
              className={
                jour.date === aujourdhui ? 'charge__barre charge__barre--jour' : 'charge__barre'
              }
              aria-hidden="true"
              style={{
                height: `${Math.round((jour.count / maximum) * 100)}%`,
                opacity: OPACITE_MINIMUM + (1 - OPACITE_MINIMUM) * (jour.count / maximum),
              }}
            />
          </li>
        ))}
      </ul>

      {/*
        Trois repères, pas quatorze : à 320px, quatorze dates tiendraient sur
        seize pixels chacune. Le premier et le dernier s'alignent sur les bords
        de la première et de la dernière barre.
      */}
      <div className="charge__reperes" aria-hidden="true">
        <span className="charge__repere charge__repere--jour">
          {t.charge.aujourdhuiCourt}
        </span>
        <span className="charge__repere">{formatCompact(charge[Math.floor(charge.length / 2)].date)}</span>
        <span className="charge__repere">{formatCompact(charge[charge.length - 1].date)}</span>
      </div>
    </div>
  )
}

/** « aujourd'hui, 3 révisions » · « ven. 7 août, aucune révision ». */
function etiquetteJour(jour: DayLoad, aujourdhui: DateKey): string {
  const quand =
    jour.date === aujourdhui
      ? textes().dates.relatif.aujourdhui
      : formatShort(jour.date)
  return textes().charge.jour(quand, jour.count)
}
