import { describe, expect, it } from 'vitest'
import type { Programme, Review } from '../types'
import { compteur } from './ids'
import {
  ECHELLE_RYTHME,
  SCHEDULES,
  buildReviews,
  decrirePortee,
  getSchedule,
  isScheduleId,
  decrireEcart,
  listerDecalages,
  nommerEcart,
  previewDates,
  rebuildReviews,
  tousLesProgrammes,
} from './schedules'

/**
 * Les révisions d'un sujet quelconque, aux identifiants prévisibles : ce qui
 * s'éprouve ici, ce sont les dates et les rangs, pas des UUID.
 */
function revisions(
  startDate: string,
  schedule: string,
  personnels: Programme[] = [],
): Review[] {
  return buildReviews('sujet', startDate, schedule, personnels, compteur('r'))
}

/** Marque une révision comme faite, à son décalage. */
function faite(reviews: Review[], intervalInDays: number, completedAt: string): Review[] {
  return reviews.map((review) =>
    review.intervalInDays === intervalInDays ? { ...review, completedAt } : review,
  )
}

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
    const reviews = revisions('2026-03-01', 'pousse')
    expect(reviews).toHaveLength(7)
    expect(reviews.every((review) => review.completedAt === null)).toBe(true)
    expect(reviews.map((review) => review.position)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(reviews.map((review) => review.intervalInDays)).toEqual([1, 2, 4, 7, 14, 30, 60])
  })

  it('calcule les dates à partir de la date de départ', () => {
    expect(revisions('2026-03-01', 'simple').map((review) => review.dueDate)).toEqual([
      '2026-03-02',
      '2026-03-04',
      '2026-03-08',
      '2026-03-15',
      '2026-03-31',
    ])
  })

  it('passe correctement les fins de mois et d’année', () => {
    const reviews = revisions('2025-12-30', 'simple')
    expect(reviews[0].dueDate).toBe('2025-12-31')
    expect(reviews[1].dueDate).toBe('2026-01-02')
    expect(reviews[4].dueDate).toBe('2026-01-29')
  })

  it('traverse une année bissextile sur J+365', () => {
    // 2028 est bissextile : J+365 depuis le 1er janvier 2028 tombe le
    // 31 décembre 2028, pas le 1er janvier 2029.
    const reviews = revisions('2028-01-01', 'ultime')
    expect(reviews.at(-1)?.dueDate).toBe('2028-12-31')
    expect(revisions('2026-01-01', 'ultime').at(-1)?.dueDate).toBe('2027-01-01')
  })

  it('previewDates produit les mêmes dates que buildReviews', () => {
    expect(previewDates('2026-05-10', 'ultime')).toEqual(
      revisions('2026-05-10', 'ultime').map((review) => review.dueDate),
    )
  })
})

describe('rebuildReviews', () => {
  it('conserve les révisions effectuées dont le décalage existe encore', () => {
    const previous = faite(
      revisions('2026-03-01', 'simple'),
      3,
      '2026-03-04T10:00:00.000Z',
    )
    const next = rebuildReviews('sujet', '2026-03-01', 'pousse', previous, [], compteur('n'))

    // J+3 n'existe pas dans « poussé » : la coche est perdue, sans effet de bord.
    expect(next.find((review) => review.intervalInDays === 3)).toBeUndefined()
    expect(next.every((review) => review.completedAt === null)).toBe(true)
  })

  it('reporte l’état effectué sur les décalages communs', () => {
    const previous = faite(
      revisions('2026-03-01', 'simple'),
      7,
      '2026-03-08T10:00:00.000Z',
    )
    const next = rebuildReviews('sujet', '2026-03-01', 'ultime', previous, [], compteur('n'))
    const kept = next.find((review) => review.intervalInDays === 7)

    expect(kept?.completedAt).toBe('2026-03-08T10:00:00.000Z')
    expect(next.filter((review) => review.completedAt !== null)).toHaveLength(1)
  })

  it('garde l’identifiant d’une révision dont le décalage traverse la modification', () => {
    const previous = revisions('2026-03-01', 'simple')
    const next = rebuildReviews('sujet', '2026-03-05', 'simple', previous, [], compteur('n'))

    expect(next.map((review) => review.id)).toEqual(previous.map((review) => review.id))
  })

  it('renumérote les rangs selon le nouveau programme', () => {
    const previous = revisions('2026-03-01', 'simple')
    const next = rebuildReviews('sujet', '2026-03-01', 'pousse', previous, [], compteur('n'))

    expect(next.map((review) => review.position)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('recalcule les dates quand la date de départ change', () => {
    const previous = revisions('2026-03-01', 'simple')
    const next = rebuildReviews('sujet', '2026-03-05', 'simple', previous, [], compteur('n'))
    expect(next[0].dueDate).toBe('2026-03-06')
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
    expect(revisions('2026-03-01', 'p-1', [PERSO]).map((r) => r.dueDate)).toEqual([
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

describe('échelle des rythmes', () => {
  it('ne propose que des écarts croissants, sans doublon', () => {
    expect([...ECHELLE_RYTHME].sort((a, b) => a - b)).toEqual(ECHELLE_RYTHME)
    expect(new Set(ECHELLE_RYTHME).size).toBe(ECHELLE_RYTHME.length)
  })

  it('ne propose que des écarts qui se disent d’un mot', () => {
    /*
     * C'est la raison d'être de l'échelle. Au-delà de dix jours — qu'on situe
     * encore d'un coup d'œil —, chaque graduation doit tomber juste dans son
     * unité : une semaine, un mois, un an. Jamais un « 45 j » que personne ne
     * sait placer.
     */
    for (const jours of ECHELLE_RYTHME) {
      if (jours <= 10) continue
      expect(nommerEcart(jours)).not.toBe(`${jours} j`)
    }
  })

  it('couvre les trois programmes intégrés', () => {
    // Un rythme connu doit pouvoir être chargé puis ajusté graduation par
    // graduation : si l'un de ses écarts manquait, il serait irreproductible.
    for (const schedule of SCHEDULES) {
      for (const offset of schedule.offsets) {
        expect(ECHELLE_RYTHME).toContain(offset)
      }
    }
  })
})

describe('nommerEcart', () => {
  it('choisit l’unité naturelle de l’écart', () => {
    expect(nommerEcart(1)).toBe('1 j')
    expect(nommerEcart(6)).toBe('6 j')
    expect(nommerEcart(7)).toBe('1 sem.')
    expect(nommerEcart(14)).toBe('2 sem.')
    expect(nommerEcart(30)).toBe('1 mois')
    expect(nommerEcart(90)).toBe('3 mois')
    expect(nommerEcart(365)).toBe('1 an')
    expect(nommerEcart(730)).toBe('2 ans')
  })

  it('retombe sur les jours quand aucune unité ne tombe juste', () => {
    expect(nommerEcart(10)).toBe('10 j')
    expect(nommerEcart(45)).toBe('45 j')
  })

  it('s’écrit toujours en jours pour un lecteur d’écran', () => {
    expect(decrireEcart(1)).toBe('1 jour après le départ')
    expect(decrireEcart(30)).toBe('30 jours après le départ')
  })
})
