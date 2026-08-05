import { describe, expect, it } from 'vitest'
import type { Review, ScheduleId } from '../types'
import { compteur } from './ids'
import { buildReviews } from './schedules'
import {
  dateDeReport,
  dateEffective,
  devaliderRevision,
  reporterRevision,
  validerRevision,
} from './recalage'

const DEPART = '2026-03-01'

function revisions(schedule: ScheduleId = 'simple', startDate = DEPART): Review[] {
  return buildReviews('sujet', startDate, schedule, [], compteur('r'))
}

/** L'identifiant de la révision d'un décalage donné. */
function idDe(reviews: Review[], intervalInDays: number): string {
  return reviews.find((review) => review.intervalInDays === intervalInDays)!.id
}

/** Raccourci de lecture : { 1: '2026-03-02', 3: '2026-03-04', … } */
function dates(reviews: Review[]): Record<number, string> {
  return Object.fromEntries(
    reviews.map((review) => [review.intervalInDays, review.dueDate]),
  )
}

/** Valide la révision d'un décalage, comme un écran le ferait. */
function valider(
  reviews: Review[],
  intervalInDays: number,
  aujourdhui: string,
  horodatage?: string,
) {
  return validerRevision(reviews, idDe(reviews, intervalInDays), aujourdhui, horodatage)
}

describe('validerRevision — à l’heure', () => {
  it('coche la révision et horodate la validation', () => {
    // « Simple » depuis le 1er mars : J+1 tombe le 2 mars.
    const depart = revisions()
    const { reviews, retard, deplacees } = valider(
      depart,
      1,
      '2026-03-02',
      '2026-03-02T08:00:00.000Z',
    )

    const cible = reviews.find((review) => review.intervalInDays === 1)
    expect(cible?.completedAt).toBe('2026-03-02T08:00:00.000Z')
    expect(retard).toBe(0)
    expect(deplacees).toBe(0)
  })

  it('ne déplace aucune échéance suivante', () => {
    const depart = revisions()
    const { reviews } = valider(depart, 1, '2026-03-02')
    expect(dates(reviews)).toEqual(dates(depart))
  })

  it('ne recale pas non plus une validation en avance', () => {
    // J+7 coché le 4 mars, trois jours avant l'échéance du 8.
    const { reviews, retard, deplacees } = valider(revisions(), 7, '2026-03-04')
    expect(retard).toBe(0)
    expect(deplacees).toBe(0)
    expect(dates(reviews)[14]).toBe('2026-03-15')
  })
})

describe('validerRevision — en retard (règle métier n°1)', () => {
  // J+3 était attendue le 4 mars, elle est validée le 9 : cinq jours de retard.
  const RETARD = valider(revisions(), 3, '2026-03-09', '2026-03-09T20:00:00.000Z')

  it('mesure le retard en jours', () => {
    expect(RETARD.retard).toBe(5)
  })

  it('recalcule les suivantes depuis la date réelle, pas la date théorique', () => {
    // Les écarts du programme sont conservés : J+7 arrive 4 jours après J+3,
    // donc 4 jours après le 9 mars — et non 4 jours après le 4 mars.
    expect(dates(RETARD.reviews)[7]).toBe('2026-03-13')
    expect(dates(RETARD.reviews)[14]).toBe('2026-03-20')
    expect(dates(RETARD.reviews)[30]).toBe('2026-04-05')
    expect(RETARD.deplacees).toBe(3)
  })

  it('laisse intactes la révision validée et celles qui la précèdent', () => {
    // La date planifiée reste la trace de ce qui était prévu ; c'est
    // `completedAt` qui porte la date réelle.
    expect(dates(RETARD.reviews)[1]).toBe('2026-03-02')
    expect(dates(RETARD.reviews)[3]).toBe('2026-03-04')
  })

  it('préserve exactement les écarts du programme', () => {
    const { reviews } = valider(revisions('ultime'), 4, '2026-03-20')
    const suivantes = reviews.filter((review) => review.intervalInDays > 4)
    // J+7 → 3 jours après la validation, J+14 → 10 jours, etc.
    expect(suivantes.map((review) => review.dueDate)).toEqual([
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
    const avecJ7Fait = revisions().map((review) =>
      review.intervalInDays === 7
        ? { ...review, completedAt: '2026-03-08T09:00:00.000Z' }
        : review,
    )
    const { reviews, deplacees } = valider(avecJ7Fait, 3, '2026-03-09')

    expect(dates(reviews)[7]).toBe('2026-03-08')
    expect(dates(reviews)[14]).toBe('2026-03-20')
    expect(deplacees).toBe(2)
  })

  it('reste cohérent sur deux retards successifs', () => {
    const premier = valider(revisions(), 1, '2026-03-05').reviews
    expect(dates(premier)[3]).toBe('2026-03-07')

    // J+3 est maintenant attendue le 7 mars ; validée le 10, elle décale
    // encore les suivantes de trois jours.
    const second = valider(premier, 3, '2026-03-10').reviews
    expect(dates(second)[7]).toBe('2026-03-14')
    expect(dates(second)[14]).toBe('2026-03-21')
  })

  it('se lit sur le rang, pas sur l’ordre du tableau', () => {
    // Les révisions viennent de leur propre table : rien ne garantit qu'elles
    // arrivent dans l'ordre du programme. Le recalage doit être identique.
    const ordonnees = revisions()
    const melangees = [...ordonnees].reverse()

    expect(dates(valider(melangees, 3, '2026-03-09').reviews)).toEqual(
      dates(valider(ordonnees, 3, '2026-03-09').reviews),
    )
  })

  it('ignore un identifiant qui n’existe pas', () => {
    const depart = revisions()
    const { reviews, retard, deplacees } = validerRevision(
      depart,
      'inconnue',
      '2026-03-09',
    )
    expect(reviews).toBe(depart)
    expect(retard).toBe(0)
    expect(deplacees).toBe(0)
  })
})

describe('devaliderRevision', () => {
  it('décoche sans défaire le recalage', () => {
    const depart = revisions()
    const { reviews } = valider(depart, 3, '2026-03-09')
    const decoche = devaliderRevision(reviews, idDe(depart, 3))

    const cible = decoche.find((review) => review.intervalInDays === 3)
    expect(cible?.completedAt).toBeNull()
    // Les échéances recalées restent où elles sont : les défaire supposerait
    // que rien n'a été validé entre-temps sur leurs nouvelles dates.
    expect(dates(decoche)[7]).toBe('2026-03-13')
  })

  it('ignore un identifiant inconnu', () => {
    const depart = revisions()
    expect(devaliderRevision(depart, 'inconnue')).toEqual(depart)
  })
})

describe('dateEffective', () => {
  it('rend l’échéance planifiée tant que la révision n’est pas faite', () => {
    const [premiere] = revisions()
    expect(dateEffective(premiere)).toBe('2026-03-02')
  })

  it('rend la date de validation dès qu’elle est faite', () => {
    const { reviews } = valider(revisions(), 3, '2026-03-09', '2026-03-09T20:00:00')
    const cible = reviews.find((review) => review.intervalInDays === 3)!
    // La graduation de la frise se place au 9, pas au 4 : c'est le rythme
    // réel qui est représenté.
    expect(dateEffective(cible)).toBe('2026-03-09')
  })

  it('retombe sur l’échéance si l’horodatage est illisible', () => {
    const [premiere] = revisions()
    expect(dateEffective({ ...premiere, completedAt: 'jamais' })).toBe('2026-03-02')
  })
})

describe('reporterRevision', () => {
  /** Reporte la révision d'un décalage, comme un écran le ferait. */
  const reporter = (reviews: Review[], intervalInDays: number, aujourdhui: string) =>
    reporterRevision(reviews, idDe(reviews, intervalInDays), aujourdhui)

  it('repousse une échéance à venir d’un jour', () => {
    // « Simple » depuis le 1er mars : J+7 tombe le 8.
    const { reviews, date } = reporter(revisions(), 7, '2026-03-05')
    expect(date).toBe('2026-03-09')
    expect(dates(reviews)[7]).toBe('2026-03-09')
  })

  it('repousse une échéance en retard à demain, pas au lendemain de sa date', () => {
    // J+3 tombait le 4 mars, on est le 10 : le report vise le 11.
    const { reviews, date } = reporter(revisions(), 3, '2026-03-10')
    expect(date).toBe('2026-03-11')
    expect(dates(reviews)[3]).toBe('2026-03-11')
  })

  it('repousse l’échéance du jour à demain', () => {
    const { date } = reporter(revisions(), 3, '2026-03-04')
    expect(date).toBe('2026-03-05')
  })

  /*
   * La différence avec le recalage après retard, et toute la raison d'être de
   * cette fonction : un report ne dit rien du rythme réel, il dit « pas
   * aujourd'hui ». Le programme n'a pas bougé, les échéances suivantes non plus.
   */
  it('ne déplace aucune autre échéance', () => {
    const depart = revisions()
    const { reviews } = reporter(depart, 3, '2026-03-10')
    const attendues = { ...dates(depart), 3: '2026-03-11' }
    expect(dates(reviews)).toEqual(attendues)
  })

  it('refuse de reporter une révision déjà faite', () => {
    const faites = valider(revisions(), 1, '2026-03-02').reviews
    const resultat = reporterRevision(faites, idDe(faites, 1), '2026-03-10')
    expect(resultat.date).toBeNull()
    expect(resultat.reviews).toBe(faites)
  })

  it('ne bouge rien sur un identifiant inconnu', () => {
    const depart = revisions()
    const resultat = reporterRevision(depart, 'introuvable', '2026-03-10')
    expect(resultat.date).toBeNull()
    expect(resultat.reviews).toBe(depart)
  })

  it('annonce la date du report avant de l’appliquer', () => {
    const [premiere] = revisions()
    expect(dateDeReport(premiere, '2026-03-01')).toBe('2026-03-03')
    expect(dateDeReport(premiere, '2026-03-20')).toBe('2026-03-21')
  })
})

describe('l’annulation restaure l’état exact', () => {
  it('rend les révisions d’avant, recalage compris', () => {
    // Le toast « Annuler » ne rejoue rien : il remet les lignes précédentes,
    // seule façon de défaire un recalage multiple sans ambiguïté.
    const avant = revisions('ultime')
    const { reviews } = valider(avant, 4, '2026-03-20')

    expect(reviews).not.toEqual(avant)
    expect(dates(avant)).toEqual(
      dates(buildReviews('sujet', DEPART, 'ultime', [], compteur('r'))),
    )
  })
})
