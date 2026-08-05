import { describe, expect, it } from 'vitest'
import type { Programme } from '../types'
import {
  RYTHME_MAX_REVISIONS,
  SCHEDULES,
  buildReviews,
  decrirePortee,
  getSchedule,
  isScheduleId,
  listerDecalages,
  normaliserRythme,
  previewDates,
  rebuildReviews,
  tousLesProgrammes,
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

describe('listerDecalages', () => {
  it('écrit le rythme en toutes lettres', () => {
    expect(listerDecalages(getSchedule('simple').offsets)).toBe(
      'J+1 · J+3 · J+7 · J+14 · J+30',
    )
  })

  it('couvre le programme le plus long', () => {
    expect(listerDecalages(getSchedule('ultime').offsets)).toBe(
      'J+1 · J+2 · J+4 · J+7 · J+14 · J+30 · J+60 · J+90 · J+180 · J+365',
    )
  })

  it('rend une chaîne vide sans décalage', () => {
    expect(listerDecalages([])).toBe('')
  })
})

describe('portée des programmes', () => {
  it('décrit la durée, le nombre étant affiché à côté', () => {
    expect(SCHEDULES.map((s) => s.description)).toEqual([
      'sur un mois',
      'sur deux mois',
      'sur une année',
    ])
  })
})

describe('normaliserRythme', () => {
  it('lit une suite de jours quel que soit le séparateur', () => {
    expect(normaliserRythme('1 3 7 14 30')).toEqual([1, 3, 7, 14, 30])
    expect(normaliserRythme('1,3,7')).toEqual([1, 3, 7])
    expect(normaliserRythme('J+1 · J+3 · J+7')).toEqual([1, 3, 7])
    expect(normaliserRythme('7;3;1')).toEqual([1, 3, 7])
  })

  it('trie et déduplique', () => {
    expect(normaliserRythme('30 1 7 1 3 30')).toEqual([1, 3, 7, 30])
  })

  it('écarte zéro, le négatif et le trop lointain', () => {
    // Le signe n'est pas lu : « -5 » donne 5. Un décalage est un nombre de
    // jours après le départ, il n'y a rien avant.
    expect(normaliserRythme('0 1 4000')).toEqual([1])
    expect(normaliserRythme('-5 10')).toEqual([5, 10])
  })

  it('plafonne le nombre de révisions', () => {
    const saisie = Array.from({ length: 30 }, (_, index) => index + 1).join(' ')
    expect(normaliserRythme(saisie)).toHaveLength(RYTHME_MAX_REVISIONS)
  })

  it('rend une liste vide pour une saisie sans nombre', () => {
    expect(normaliserRythme('')).toEqual([])
    expect(normaliserRythme('bientôt')).toEqual([])
  })
})

describe('decrirePortee', () => {
  it('décrit les trois programmes intégrés dans les mots de la spécification', () => {
    expect(getSchedule('simple').description).toBe('sur un mois')
    expect(getSchedule('pousse').description).toBe('sur deux mois')
    expect(getSchedule('ultime').description).toBe('sur une année')
  })

  it('décrit un rythme court en jours plutôt que de l’arrondir au mois', () => {
    expect(decrirePortee([1, 3, 7])).toBe('sur 7 jours')
    expect(decrirePortee([1])).toBe('sur 1 jour')
    expect(decrirePortee([1, 20])).toBe('sur 20 jours')
  })

  it('décrit un rythme long en mois puis en années', () => {
    expect(decrirePortee([1, 90])).toBe('sur trois mois')
    expect(decrirePortee([1, 730])).toBe('sur 2 années')
  })
})

describe('programmes personnalisés', () => {
  const PERSO: Programme = {
    id: 'p-1',
    label: 'Examen blanc',
    offsets: [2, 5, 9, 20],
    createdAt: '2026-08-05T10:00:00.000Z',
  }

  it('vient après les trois intégrés', () => {
    expect(tousLesProgrammes([PERSO]).map((schedule) => schedule.id)).toEqual([
      'simple',
      'pousse',
      'ultime',
      'p-1',
    ])
  })

  it('se résout comme les intégrés, et se décrit tout seul', () => {
    const schedule = getSchedule('p-1', [PERSO])
    expect(schedule.label).toBe('Examen blanc')
    expect(schedule.description).toBe('sur 20 jours')
    expect(schedule.personnel).toBe(true)
  })

  it('produit les révisions de son rythme', () => {
    expect(buildReviews('2026-03-01', 'p-1', [PERSO]).map((r) => r.date)).toEqual([
      '2026-03-03',
      '2026-03-06',
      '2026-03-10',
      '2026-03-21',
    ])
  })

  it("n'est pas reconnu par isScheduleId, réservé aux trois intégrés", () => {
    expect(isScheduleId('p-1')).toBe(false)
  })
})
