// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest'
import {
  addDaysToKey,
  daysBetween,
  formatCompact,
  formatEcheance,
  formatIsoDate,
  formatLong,
  formatRelative,
  fromKey,
  isFuture,
  isPast,
  isToday,
  msAvantMinuit,
  toKey,
} from './dates'

describe('cles de date', () => {
  it('fait un aller-retour sans décalage de fuseau', () => {
    // Le piege classique : new Date('2026-03-01') est minuit UTC, ce qui
    // recule d'un jour à l'ouest de Greenwich. fromKey travaille en local.
    const key = '2026-03-01'
    const date = fromKey(key)
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(2)
    expect(date.getDate()).toBe(1)
    expect(toKey(date)).toBe(key)
  })

  it('décale d’un nombre de jours donné', () => {
    expect(addDaysToKey('2026-02-27', 1)).toBe('2026-02-28')
    expect(addDaysToKey('2026-02-28', 1)).toBe('2026-03-01')
    expect(addDaysToKey('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDaysToKey('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('compte les jours entre deux clés', () => {
    expect(daysBetween('2026-03-01', '2026-03-08')).toBe(7)
    expect(daysBetween('2026-03-08', '2026-03-01')).toBe(-7)
    expect(daysBetween('2026-03-01', '2026-03-01')).toBe(0)
  })
})

describe('comparaisons', () => {
  const today = '2026-03-10'

  it('situe une date par rapport à aujourd’hui', () => {
    expect(isToday(today, today)).toBe(true)
    expect(isPast('2026-03-09', today)).toBe(true)
    expect(isPast(today, today)).toBe(false)
    expect(isFuture('2026-03-11', today)).toBe(true)
    expect(isFuture(today, today)).toBe(false)
  })

  it('compare correctement au passage d’année', () => {
    expect(isPast('2025-12-31', '2026-01-01')).toBe(true)
    expect(isFuture('2026-01-01', '2025-12-31')).toBe(true)
  })
})

describe('msAvantMinuit', () => {
  const MINUTE = 60_000
  const HEURE = 60 * MINUTE

  it('compte le temps restant jusqu’au prochain minuit local', () => {
    const veille = new Date(2026, 2, 10, 22, 0, 0)
    expect(msAvantMinuit(veille)).toBe(2 * HEURE + 1000)
  })

  it('donne une journée pleine juste après minuit', () => {
    const debut = new Date(2026, 2, 10, 0, 0, 0)
    expect(msAvantMinuit(debut)).toBe(24 * HEURE + 1000)
  })

  /*
   * Le délai doit rester franchement positif : un minuteur réveillé une
   * milliseconde avant minuit relirait la veille, puis se reprogrammerait pour
   * une milliseconde — une boucle serrée jusqu'au changement de jour.
   */
  it('garde une marge à la seconde qui précède minuit', () => {
    const juste = new Date(2026, 2, 10, 23, 59, 59, 999)
    expect(msAvantMinuit(juste)).toBeGreaterThanOrEqual(1000)
  })

  it('franchit un changement de mois comme un autre jour', () => {
    const fin = new Date(2026, 1, 28, 23, 0, 0)
    expect(msAvantMinuit(fin)).toBe(HEURE + 1000)
  })
})

describe('formatage francais', () => {
  it('formate les dates en francais', () => {
    expect(formatLong('2026-03-14')).toBe('14 mars 2026')
    expect(formatCompact('2026-03-14')).toBe('14/03')
  })

  it('exprime les ecarts en langage courant', () => {
    const today = '2026-03-10'
    expect(formatRelative(today, today)).toBe("aujourd'hui")
    expect(formatRelative('2026-03-11', today)).toBe('demain')
    expect(formatRelative('2026-03-09', today)).toBe('hier')
    expect(formatRelative('2026-03-07', today)).toBe('il y a 3 jours')
    expect(formatRelative('2026-03-22', today)).toBe('dans 12 jours')
  })

  it('rejette un horodatage invalide plutôt que de planter', () => {
    expect(formatIsoDate('2026-03-14T08:30:00.000Z')).toBe('14 mars 2026')
    expect(formatIsoDate('pas une date')).toBeNull()
  })

  it('écrit une échéance sans son année, sauf si elle en change', () => {
    expect(formatEcheance('2026-08-08', '2026-03-10')).toBe('8 août')
    // J+365 depuis mars 2026 : sans l'année, « 8 mars » désignerait deux jours.
    expect(formatEcheance('2027-03-08', '2026-03-10')).toBe('8 mars 2027')
    expect(formatEcheance('2025-12-31', '2026-01-01')).toBe('31 décembre 2025')
  })
})
