import { describe, expect, it } from 'vitest'
import type { Item, ScheduleId } from '../types'
import { buildReviews } from './schedules'
import { dateEffective, devaliderRevision, validerRevision } from './recalage'

const DEPART = '2026-03-01'

function makeItem(schedule: ScheduleId = 'simple', startDate = DEPART): Item {
  return {
    id: 'element',
    title: 'Hooks React',
    category: 'Développement',
    startDate,
    schedule,
    reviews: buildReviews(startDate, schedule),
    archived: false,
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-03-01T09:00:00.000Z',
  }
}

/** Raccourci de lecture : { 1: '2026-03-02', 3: '2026-03-04', … } */
function dates(item: Item): Record<number, string> {
  return Object.fromEntries(item.reviews.map((review) => [review.offset, review.date]))
}

describe('validerRevision — à l’heure', () => {
  it('coche la révision et horodate la validation', () => {
    // « Simple » depuis le 1er mars : J+1 tombe le 2 mars.
    const { item, retard, deplacees } = validerRevision(
      makeItem(),
      1,
      '2026-03-02',
      '2026-03-02T08:00:00.000Z',
    )

    const cible = item.reviews.find((review) => review.offset === 1)
    expect(cible?.done).toBe(true)
    expect(cible?.doneAt).toBe('2026-03-02T08:00:00.000Z')
    expect(retard).toBe(0)
    expect(deplacees).toBe(0)
  })

  it('ne déplace aucune échéance suivante', () => {
    const avant = dates(makeItem())
    const { item } = validerRevision(makeItem(), 1, '2026-03-02')
    expect(dates(item)).toEqual(avant)
  })

  it('ne recale pas non plus une validation en avance', () => {
    // J+7 coché le 4 mars, trois jours avant l'échéance du 8.
    const { item, retard, deplacees } = validerRevision(makeItem(), 7, '2026-03-04')
    expect(retard).toBe(0)
    expect(deplacees).toBe(0)
    expect(dates(item)[14]).toBe('2026-03-15')
  })
})

describe('validerRevision — en retard (règle métier n°1)', () => {
  // J+3 était attendue le 4 mars, elle est validée le 9 : cinq jours de retard.
  const RETARD = validerRevision(makeItem(), 3, '2026-03-09', '2026-03-09T20:00:00.000Z')

  it('mesure le retard en jours', () => {
    expect(RETARD.retard).toBe(5)
  })

  it('recalcule les suivantes depuis la date réelle, pas la date théorique', () => {
    // Les écarts du programme sont conservés : J+7 arrive 4 jours après J+3,
    // donc 4 jours après le 9 mars — et non 4 jours après le 4 mars.
    expect(dates(RETARD.item)[7]).toBe('2026-03-13')
    expect(dates(RETARD.item)[14]).toBe('2026-03-20')
    expect(dates(RETARD.item)[30]).toBe('2026-04-05')
    expect(RETARD.deplacees).toBe(3)
  })

  it('laisse intactes la révision validée et celles qui la précèdent', () => {
    // La date planifiée reste la trace de ce qui était prévu ; c'est `doneAt`
    // qui porte la date réelle.
    expect(dates(RETARD.item)[1]).toBe('2026-03-02')
    expect(dates(RETARD.item)[3]).toBe('2026-03-04')
  })

  it('préserve exactement les écarts du programme', () => {
    const { item } = validerRevision(makeItem('ultime'), 4, '2026-03-20')
    const suivantes = item.reviews.filter((review) => review.offset > 4)
    // J+7 → 3 jours après la validation, J+14 → 10 jours, etc.
    expect(suivantes.map((review) => review.date)).toEqual([
      '2026-03-23',
      '2026-03-30',
      '2026-04-15',
      '2026-05-15',
      '2026-06-14',
      '2026-09-12',
      // J+365 arrive 361 jours après la validation, pas 365.
      '2027-03-16',
    ])
  })

  it('ne touche pas aux échéances suivantes déjà validées', () => {
    // J+7 a été cochée avant J+3 : elle appartient au passé, elle ne bouge pas.
    const depart = makeItem()
    const avecJ7Fait = {
      ...depart,
      reviews: depart.reviews.map((review) =>
        review.offset === 7
          ? { ...review, done: true, doneAt: '2026-03-08T09:00:00.000Z' }
          : review,
      ),
    }
    const { item, deplacees } = validerRevision(avecJ7Fait, 3, '2026-03-09')

    expect(dates(item)[7]).toBe('2026-03-08')
    expect(dates(item)[14]).toBe('2026-03-20')
    expect(deplacees).toBe(2)
  })

  it('reste cohérent sur deux retards successifs', () => {
    const premier = validerRevision(makeItem(), 1, '2026-03-05').item
    expect(dates(premier)[3]).toBe('2026-03-07')

    // J+3 est maintenant attendue le 7 mars ; validée le 10, elle décale
    // encore les suivantes de trois jours.
    const second = validerRevision(premier, 3, '2026-03-10').item
    expect(dates(second)[7]).toBe('2026-03-14')
    expect(dates(second)[14]).toBe('2026-03-21')
  })

  it('ignore un décalage qui n’existe pas', () => {
    const depart = makeItem()
    const { item, retard, deplacees } = validerRevision(depart, 999, '2026-03-09')
    expect(item).toBe(depart)
    expect(retard).toBe(0)
    expect(deplacees).toBe(0)
  })
})

describe('devaliderRevision', () => {
  it('décoche sans défaire le recalage', () => {
    const { item } = validerRevision(makeItem(), 3, '2026-03-09')
    const decoche = devaliderRevision(item, 3)

    const cible = decoche.reviews.find((review) => review.offset === 3)
    expect(cible?.done).toBe(false)
    expect(cible?.doneAt).toBeNull()
    // Les échéances recalées restent où elles sont : les défaire supposerait
    // que rien n'a été validé entre-temps sur leurs nouvelles dates.
    expect(dates(decoche)[7]).toBe('2026-03-13')
  })

  it('ignore un décalage inconnu', () => {
    const depart = makeItem()
    expect(devaliderRevision(depart, 999)).toBe(depart)
  })
})

describe('dateEffective', () => {
  it('rend l’échéance planifiée tant que la révision n’est pas faite', () => {
    const [premiere] = buildReviews(DEPART, 'simple')
    expect(dateEffective(premiere)).toBe('2026-03-02')
  })

  it('rend la date de validation dès qu’elle est faite', () => {
    const { item } = validerRevision(makeItem(), 3, '2026-03-09', '2026-03-09T20:00:00')
    const cible = item.reviews.find((review) => review.offset === 3)!
    // La graduation de la frise se place au 9, pas au 4 : c'est le rythme
    // réel qui est représenté.
    expect(dateEffective(cible)).toBe('2026-03-09')
  })

  it('retombe sur l’échéance si l’horodatage est illisible', () => {
    const [premiere] = buildReviews(DEPART, 'simple')
    expect(dateEffective({ ...premiere, done: true, doneAt: 'jamais' })).toBe(
      '2026-03-02',
    )
  })
})

describe('l’annulation restaure l’état exact', () => {
  it('rend l’élément d’avant, recalage compris', () => {
    // Le toast « Annuler » ne rejoue rien : il remet l'objet précédent, ce qui
    // est la seule façon de défaire un recalage multiple sans ambiguïté.
    const avant = makeItem('ultime')
    const { item } = validerRevision(avant, 4, '2026-03-20')
    expect(item).not.toEqual(avant)
    expect(avant.reviews.map((review) => review.date)).toEqual(
      buildReviews(DEPART, 'ultime').map((review) => review.date),
    )
  })
})
