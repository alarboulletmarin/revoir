import { describe, expect, it } from 'vitest'
import { buildReviews } from './schedules'
import { geometrieFrise } from './frise'
import { validerRevision } from './recalage'
import type { Item } from '../types'

const DEPART = '2026-03-01'

const item = (schedule: 'simple' | 'pousse' | 'ultime'): Item => ({
  id: 'element',
  title: 'Hooks React',
  category: 'Développement',
  startDate: DEPART,
  schedule,
  reviews: buildReviews(DEPART, schedule),
  archived: false,
  createdAt: '2026-03-01T09:00:00.000Z',
  updatedAt: '2026-03-01T09:00:00.000Z',
})

describe('geometrieFrise — structure', () => {
  it('produit une graduation par échéance', () => {
    const { graduations } = geometrieFrise(DEPART, item('simple').reviews, DEPART)
    expect(graduations.map((g) => g.offset)).toEqual([1, 3, 7, 14, 30])
  })

  it('place la dernière graduation exactement au bout', () => {
    for (const programme of ['simple', 'pousse', 'ultime'] as const) {
      const { graduations } = geometrieFrise(DEPART, item(programme).reviews, DEPART)
      expect(graduations.at(-1)?.position).toBeCloseTo(1, 10)
    }
  })

  it('range les graduations dans l’ordre, sans doublon de position', () => {
    const { graduations } = geometrieFrise(DEPART, item('ultime').reviews, DEPART)
    const positions = graduations.map((g) => g.position)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(new Set(positions).size).toBe(positions.length)
  })

  it('rend une frise vide sans échéance', () => {
    expect(geometrieFrise(DEPART, [], DEPART)).toEqual({
      graduations: [],
      parcours: 0,
      curseur: null,
    })
  })
})

describe('geometrieFrise — compression en racine carrée', () => {
  it('donne à chaque segment un poids égal à √jours', () => {
    const { graduations } = geometrieFrise(DEPART, item('simple').reviews, DEPART)
    // Segments : 1, 2, 4, 7 et 16 jours.
    expect(graduations.map((g) => g.poids)).toEqual([1, 2, 4, 7, 16].map(Math.sqrt))
  })

  it('empêche J+365 d’écraser les premières graduations d’Ultime', () => {
    const { graduations } = geometrieFrise(DEPART, item('ultime').reviews, DEPART)
    const dernier = graduations.at(-1)!

    // Sans compression, le segment J+180 → J+365 pèserait 185/365 ≈ 51 % de la
    // frise. La racine carrée le ramène sous le tiers, ce qui laisse une part
    // mesurable aux premiers segments.
    expect(dernier.part).toBeLessThan(0.33)
    expect(graduations[0].part).toBeGreaterThan(0.01)
  })

  it('conserve la monotonie : un segment plus long reste plus large', () => {
    const { graduations } = geometrieFrise(DEPART, item('ultime').reviews, DEPART)
    // J+1→J+2 (1 jour) < J+4→J+7 (3 jours) < J+30→J+60 (30 jours).
    expect(graduations[1].part).toBeLessThan(graduations[3].part)
    expect(graduations[3].part).toBeLessThan(graduations[6].part)
  })

  it('somme les parts à 1', () => {
    const { graduations } = geometrieFrise(DEPART, item('pousse').reviews, DEPART)
    const somme = graduations.reduce((total, g) => total + g.part, 0)
    expect(somme).toBeCloseTo(1, 10)
  })
})

describe('geometrieFrise — curseur « aujourd’hui »', () => {
  it('reste à l’origine le jour du départ', () => {
    const { curseur, parcours } = geometrieFrise(DEPART, item('simple').reviews, DEPART)
    expect(curseur).toBe(0)
    expect(parcours).toBe(0)
  })

  it('tombe exactement sur une graduation le jour de son échéance', () => {
    const geo = geometrieFrise(DEPART, item('simple').reviews, '2026-03-08')
    // Le 8 mars est J+7, la troisième graduation.
    expect(geo.curseur).toBeCloseTo(geo.graduations[2].position, 10)
  })

  it('progresse entre deux graduations', () => {
    const geo = geometrieFrise(DEPART, item('simple').reviews, '2026-03-06')
    expect(geo.curseur).toBeGreaterThan(geo.graduations[1].position)
    expect(geo.curseur).toBeLessThan(geo.graduations[2].position)
  })

  it('disparaît hors de la frise mais fige le parcours', () => {
    // Avant le départ : rien de parcouru.
    const avant = geometrieFrise(DEPART, item('simple').reviews, '2026-02-20')
    expect(avant.curseur).toBeNull()
    expect(avant.parcours).toBe(0)

    // Après la dernière échéance : frise entièrement parcourue.
    const apres = geometrieFrise(DEPART, item('simple').reviews, '2026-06-01')
    expect(apres.curseur).toBeNull()
    expect(apres.parcours).toBe(1)
  })

  it('atteint 1 le jour de la dernière échéance, curseur compris', () => {
    const geo = geometrieFrise(DEPART, item('simple').reviews, '2026-03-31')
    expect(geo.parcours).toBeCloseTo(1, 10)
    expect(geo.curseur).toBeCloseTo(1, 10)
  })
})

describe('geometrieFrise — après recalage', () => {
  it('place une graduation faite à sa date de validation', () => {
    // J+3 validée le 9 mars au lieu du 4.
    const { item: recale } = validerRevision(
      item('simple'),
      3,
      '2026-03-09',
      '2026-03-09T20:00:00',
    )
    const geo = geometrieFrise(DEPART, recale.reviews, '2026-03-09')
    const faite = geo.graduations.find((g) => g.offset === 3)!

    expect(faite.faite).toBe(true)
    expect(faite.date).toBe('2026-03-09')
    // La frise montre le rythme réel : le segment J+1 → J+3 s'est allongé de
    // 2 à 7 jours, il pèse donc plus qu'avant le retard.
    const initiale = geometrieFrise(DEPART, item('simple').reviews, DEPART)
    expect(faite.part).toBeGreaterThan(initiale.graduations[1].part)
  })

  it('supporte des dates non croissantes sans produire de position négative', () => {
    // Cas limite : une révision tardive validée après la suivante.
    const desordre = [
      { offset: 1, date: '2026-03-20', done: true, doneAt: '2026-03-20T10:00:00' },
      { offset: 3, date: '2026-03-04', done: true, doneAt: '2026-03-04T10:00:00' },
      { offset: 7, date: '2026-03-08', done: false, doneAt: null },
    ]
    const geo = geometrieFrise(DEPART, desordre, '2026-03-10')

    expect(geo.graduations.every((g) => g.position >= 0 && g.position <= 1)).toBe(true)
    expect(geo.parcours).toBeGreaterThanOrEqual(0)
    expect(geo.parcours).toBeLessThanOrEqual(1)
    expect(geo.graduations.every((g) => Number.isFinite(g.poids))).toBe(true)
  })
})
