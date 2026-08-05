import { describe, expect, it } from 'vitest'
import type { Item, ScheduleId } from '../types'
import { buildReviews } from './schedules'
import { SANS_MATIERE, grouperParMatiere, prochaineEcheance } from './matieres'

function makeItem(
  title: string,
  category: string,
  startDate = '2026-03-01',
  options: { archived?: boolean; schedule?: ScheduleId; doneOffsets?: number[] } = {},
): Item {
  const schedule = options.schedule ?? 'simple'
  const done = new Set(options.doneOffsets ?? [])
  return {
    id: title,
    title,
    category,
    startDate,
    schedule,
    reviews: buildReviews(startDate, schedule).map((review) =>
      done.has(review.offset)
        ? { ...review, done: true, doneAt: '2026-03-02T09:00:00.000Z' }
        : review,
    ),
    archived: options.archived ?? false,
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-03-01T09:00:00.000Z',
  }
}

describe('grouperParMatiere', () => {
  it('rassemble les éléments d’une même matière', () => {
    const groupes = grouperParMatiere([
      makeItem('Dérivées', 'Mathématiques'),
      makeItem('Intégrales', 'Mathématiques'),
      makeItem('Révolution', 'Histoire'),
    ])

    expect(groupes.map((g) => g.nom)).toEqual(['Histoire', 'Mathématiques'])
    expect(groupes[1].items).toHaveLength(2)
  })

  it('réunit les orthographes qui ne diffèrent que par la casse', () => {
    const groupes = grouperParMatiere([
      makeItem('A', 'Maths'),
      makeItem('B', 'maths'),
      makeItem('C', '  MATHS  '),
    ])
    expect(groupes).toHaveLength(1)
    expect(groupes[0].items).toHaveLength(3)
  })

  it('trie les matières par nom, « Sans matière » en dernier', () => {
    const groupes = grouperParMatiere([
      makeItem('A', ''),
      makeItem('B', 'Zoologie'),
      makeItem('C', 'Anglais'),
    ])
    expect(groupes.map((g) => g.nom)).toEqual(['Anglais', 'Zoologie', SANS_MATIERE])
  })

  it('écarte les éléments archivés', () => {
    const groupes = grouperParMatiere([
      makeItem('A', 'Histoire'),
      makeItem('B', 'Histoire', '2026-03-01', { archived: true }),
    ])
    expect(groupes[0].items).toHaveLength(1)
  })

  it('compte les révisions restantes du groupe', () => {
    const groupes = grouperParMatiere([
      makeItem('A', 'Histoire', '2026-03-01', { doneOffsets: [1, 3] }),
      makeItem('B', 'Histoire'),
    ])
    // « Simple » fait 5 révisions : 3 restantes pour A, 5 pour B.
    expect(groupes[0].restantes).toBe(8)
  })

  it('classe les éléments d’un groupe par prochaine échéance', () => {
    const groupes = grouperParMatiere([
      makeItem('Tard', 'Histoire', '2026-04-01'),
      makeItem('Tôt', 'Histoire', '2026-03-01'),
    ])
    expect(groupes[0].items.map((item) => item.title)).toEqual(['Tôt', 'Tard'])
  })

  it('renvoie la première échéance du groupe', () => {
    const groupes = grouperParMatiere([
      makeItem('Tard', 'Histoire', '2026-04-01'),
      makeItem('Tôt', 'Histoire', '2026-03-01'),
    ])
    expect(groupes[0].prochaine).toBe('2026-03-02')
  })

  it('range les éléments terminés en fin de groupe', () => {
    const groupes = grouperParMatiere([
      makeItem('Fini', 'Histoire', '2026-03-01', { doneOffsets: [1, 3, 7, 14, 30] }),
      makeItem('En cours', 'Histoire', '2026-04-01'),
    ])
    expect(groupes[0].items.map((item) => item.title)).toEqual(['En cours', 'Fini'])
  })

  it('ne rend aucun groupe sans élément actif', () => {
    expect(grouperParMatiere([])).toEqual([])
    expect(
      grouperParMatiere([makeItem('A', 'Histoire', '2026-03-01', { archived: true })]),
    ).toEqual([])
  })
})

describe('prochaineEcheance', () => {
  it('rend la première révision non faite', () => {
    expect(prochaineEcheance(makeItem('A', 'X', '2026-03-01'))).toBe('2026-03-02')
    expect(
      prochaineEcheance(makeItem('A', 'X', '2026-03-01', { doneOffsets: [1] })),
    ).toBe('2026-03-04')
  })

  it('rend null quand tout est fait', () => {
    const fini = makeItem('A', 'X', '2026-03-01', { doneOffsets: [1, 3, 7, 14, 30] })
    expect(prochaineEcheance(fini)).toBeNull()
  })
})
