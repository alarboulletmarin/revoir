import { describe, expect, it } from 'vitest'
import {
  SCHEDULES,
  buildReviews,
  getSchedule,
  isScheduleId,
  previewDates,
  rebuildReviews,
} from './schedules'

describe('SCHEDULES', () => {
  it('expose les trois programmes de la specification', () => {
    expect(SCHEDULES.map((schedule) => schedule.id)).toEqual([
      'simple',
      'pousse',
      'ultime',
    ])
    expect(getSchedule('simple').offsets).toEqual([1, 3, 7, 14, 30])
    expect(getSchedule('pousse').offsets).toEqual([1, 2, 4, 7, 14, 30, 60])
    expect(getSchedule('ultime').offsets).toEqual([
      1, 2, 4, 7, 14, 30, 60, 90, 180, 365,
    ])
  })

  it('retombe sur le programme par défaut pour un identifiant inconnu', () => {
    // @ts-expect-error on simule une donnée importée corrompue
    expect(getSchedule('inexistant').id).toBe('simple')
  })

  it('reconnait les identifiants valides', () => {
    expect(isScheduleId('ultime')).toBe(true)
    expect(isScheduleId('facile')).toBe(false)
    expect(isScheduleId(null)).toBe(false)
  })
})

describe('buildReviews', () => {
  it('crée une révision par décalage, aucune effectuée', () => {
    const reviews = buildReviews('2026-03-01', 'pousse')
    expect(reviews).toHaveLength(7)
    expect(reviews.every((review) => !review.done && review.doneAt === null)).toBe(true)
    expect(reviews.map((review) => review.offset)).toEqual([1, 2, 4, 7, 14, 30, 60])
  })

  it('calcule les dates à partir de la date de départ', () => {
    expect(buildReviews('2026-03-01', 'simple').map((review) => review.date)).toEqual([
      '2026-03-02',
      '2026-03-04',
      '2026-03-08',
      '2026-03-15',
      '2026-03-31',
    ])
  })

  it('passe correctement les fins de mois et d’année', () => {
    const reviews = buildReviews('2025-12-30', 'simple')
    expect(reviews[0].date).toBe('2025-12-31')
    expect(reviews[1].date).toBe('2026-01-02')
    expect(reviews[4].date).toBe('2026-01-29')
  })

  it('traverse une année bissextile sur J+365', () => {
    // 2028 est bissextile : J+365 depuis le 1er janvier 2028 tombe le
    // 31 décembre 2028, pas le 1er janvier 2029.
    const reviews = buildReviews('2028-01-01', 'ultime')
    expect(reviews.at(-1)?.date).toBe('2028-12-31')
    expect(buildReviews('2026-01-01', 'ultime').at(-1)?.date).toBe('2027-01-01')
  })

  it('previewDates produit les mêmes dates que buildReviews', () => {
    expect(previewDates('2026-05-10', 'ultime')).toEqual(
      buildReviews('2026-05-10', 'ultime').map((review) => review.date),
    )
  })
})

describe('rebuildReviews', () => {
  it('conserve les révisions effectuées dont le décalage existe encore', () => {
    const previous = buildReviews('2026-03-01', 'simple').map((review) =>
      review.offset === 3
        ? { ...review, done: true, doneAt: '2026-03-04T10:00:00.000Z' }
        : review,
    )
    const next = rebuildReviews('2026-03-01', 'pousse', previous)

    // J+3 n'existe pas dans « poussé » : la coché est perdue, sans effet de bord.
    expect(next.find((review) => review.offset === 3)).toBeUndefined()
    expect(next.every((review) => !review.done)).toBe(true)
  })

  it('reporte l’état effectué sur les décalages communs', () => {
    const previous = buildReviews('2026-03-01', 'simple').map((review) =>
      review.offset === 7
        ? { ...review, done: true, doneAt: '2026-03-08T10:00:00.000Z' }
        : review,
    )
    const next = rebuildReviews('2026-03-01', 'ultime', previous)
    const kept = next.find((review) => review.offset === 7)

    expect(kept?.done).toBe(true)
    expect(kept?.doneAt).toBe('2026-03-08T10:00:00.000Z')
    expect(next.filter((review) => review.done)).toHaveLength(1)
  })

  it('recalcule les dates quand la date de départ change', () => {
    const previous = buildReviews('2026-03-01', 'simple')
    const next = rebuildReviews('2026-03-05', 'simple', previous)
    expect(next[0].date).toBe('2026-03-06')
  })
})
