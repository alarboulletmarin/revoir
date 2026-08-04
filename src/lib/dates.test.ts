import { describe, expect, it } from 'vitest'
import {
  addDaysToKey,
  daysBetween,
  formatCompact,
  formatIsoDate,
  formatLong,
  formatRelative,
  fromKey,
  isFuture,
  isPast,
  isToday,
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
})
