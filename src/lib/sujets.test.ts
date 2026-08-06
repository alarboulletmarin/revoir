// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest'
import type { Category, Review, ScheduleId, Topic } from '../types'
import { compteur } from './ids'
import { buildReviews } from './schedules'
import {
  CLE_SANS_CATEGORIE,
  sansCategorie,
  categoriesTriees,
  compterSujets,
  estFaite,
  grouperParCategorie,
  prochaineEcheance,
  prochaineRevision,
  revisionsDe,
  revisionsParSujet,
  topicProgress,
} from './sujets'

function categorie(name: string): Category {
  return {
    id: `cat-${name.toLowerCase()}`,
    name,
    tint: null,
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-03-01T09:00:00.000Z',
  }
}

const MATHS = categorie('Mathématiques')
const HISTOIRE = categorie('Histoire')
const CATEGORIES = [MATHS, HISTOIRE]

function sujet(
  title: string,
  categoryId: string | null,
  options: {
    startDate?: string
    archived?: boolean
    schedule?: ScheduleId
    doneOffsets?: number[]
  } = {},
): { topic: Topic; reviews: Review[] } {
  const startDate = options.startDate ?? '2026-03-01'
  const schedule = options.schedule ?? 'simple'
  const done = new Set(options.doneOffsets ?? [])
  return {
    topic: {
      id: title,
      categoryId,
      title,
      startDate,
      scheduleId: schedule,
      practiceStatus: 'todo',
      status: options.archived ? 'archived' : 'active',
      createdAt: '2026-03-01T09:00:00.000Z',
      updatedAt: '2026-03-01T09:00:00.000Z',
    },
    reviews: buildReviews(title, startDate, schedule, [], compteur(`${title}-r`)).map(
      (review) =>
        done.has(review.intervalInDays)
          ? { ...review, completedAt: '2026-03-02T09:00:00.000Z' }
          : review,
    ),
  }
}

function collections(...sujets: { topic: Topic; reviews: Review[] }[]) {
  return {
    topics: sujets.map((s) => s.topic),
    reviews: sujets.flatMap((s) => s.reviews),
  }
}

describe('revisionsParSujet', () => {
  it('rattache chaque révision à son sujet', () => {
    const { reviews } = collections(
      sujet('Dérivées', MATHS.id),
      sujet('Révolution', HISTOIRE.id),
    )
    const parSujet = revisionsParSujet(reviews)

    expect([...parSujet.keys()].sort()).toEqual(['Dérivées', 'Révolution'])
    expect(parSujet.get('Dérivées')).toHaveLength(5)
  })

  it('remet chaque groupe dans l’ordre du programme', () => {
    // La base rend les lignes dans l'ordre de leurs clés, qui ne veut rien
    // dire : c'est `position` qui porte l'ordre.
    const { reviews } = collections(sujet('Dérivées', MATHS.id))
    const melangees = [...reviews].reverse()

    expect(
      revisionsParSujet(melangees)
        .get('Dérivées')!
        .map((review) => review.position),
    ).toEqual([1, 2, 3, 4, 5])
  })

  it('ne rend rien pour un sujet sans révision', () => {
    expect(revisionsParSujet([]).get('Dérivées')).toBeUndefined()
    expect(revisionsDe('Dérivées', [])).toEqual([])
  })
})

describe('estFaite', () => {
  it('ne tient qu’à l’horodatage', () => {
    const { reviews } = collections(sujet('A', null, { doneOffsets: [1] }))
    expect(reviews.filter(estFaite)).toHaveLength(1)
    expect(estFaite(reviews[0])).toBe(true)
    expect(estFaite(reviews[1])).toBe(false)
  })
})

describe('grouperParCategorie', () => {
  it('rassemble les sujets d’une même catégorie', () => {
    const { topics, reviews } = collections(
      sujet('Dérivées', MATHS.id),
      sujet('Intégrales', MATHS.id),
      sujet('Révolution', HISTOIRE.id),
    )
    const groupes = grouperParCategorie(CATEGORIES, topics, reviews)

    expect(groupes.map((groupe) => groupe.nom)).toEqual(['Histoire', 'Mathématiques'])
    expect(groupes[1].topics).toHaveLength(2)
  })

  it('range les sujets sans catégorie dans leur propre groupe, en dernier', () => {
    const { topics, reviews } = collections(
      sujet('Sonate', null),
      sujet('Révolution', HISTOIRE.id),
    )
    const groupes = grouperParCategorie(CATEGORIES, topics, reviews)

    expect(groupes.map((groupe) => groupe.nom)).toEqual(['Histoire', sansCategorie()])
    expect(groupes.at(-1)?.cle).toBe(CLE_SANS_CATEGORIE)
    expect(groupes.at(-1)?.categorie).toBeNull()
  })

  it('range aussi sans catégorie un sujet qui en désigne une disparue', () => {
    const { topics, reviews } = collections(sujet('Orphelin', 'cat-effacée'))
    const groupes = grouperParCategorie(CATEGORIES, topics, reviews)

    expect(groupes).toHaveLength(1)
    expect(groupes[0].nom).toBe(sansCategorie())
  })

  it('écarte les sujets archivés', () => {
    const { topics, reviews } = collections(
      sujet('Dérivées', MATHS.id),
      sujet('Ancien', MATHS.id, { archived: true }),
    )
    const groupes = grouperParCategorie(CATEGORIES, topics, reviews)

    expect(groupes[0].topics.map((topic) => topic.title)).toEqual(['Dérivées'])
  })

  it('ne produit aucun groupe pour une catégorie sans sujet actif', () => {
    const { topics, reviews } = collections(sujet('Dérivées', MATHS.id))
    const groupes = grouperParCategorie(CATEGORIES, topics, reviews)

    expect(groupes.map((groupe) => groupe.nom)).toEqual(['Mathématiques'])
  })

  it('compte les révisions restantes du groupe et annonce sa prochaine échéance', () => {
    const { topics, reviews } = collections(
      sujet('Dérivées', MATHS.id, { doneOffsets: [1, 3] }),
      sujet('Intégrales', MATHS.id, { startDate: '2026-03-05' }),
    )
    const [groupe] = grouperParCategorie(CATEGORIES, topics, reviews)

    // 5 − 2 restantes pour Dérivées, 5 pour Intégrales.
    expect(groupe.restantes).toBe(8)
    // Dérivées : J+7 au 8 mars. Intégrales : J+1 au 6 mars.
    expect(groupe.prochaine).toBe('2026-03-06')
  })

  it('classe les sujets par prochaine échéance, les terminés en dernier', () => {
    const { topics, reviews } = collections(
      sujet('Tardif', MATHS.id, { startDate: '2026-03-20' }),
      sujet('Fini', MATHS.id, { doneOffsets: [1, 3, 7, 14, 30] }),
      sujet('Proche', MATHS.id, { startDate: '2026-03-01' }),
    )
    const [groupe] = grouperParCategorie(CATEGORIES, topics, reviews)

    expect(groupe.topics.map((topic) => topic.title)).toEqual([
      'Proche',
      'Tardif',
      'Fini',
    ])
  })
})

describe('prochaineRevision', () => {
  it('rend la première échéance non faite', () => {
    const { reviews } = collections(sujet('A', null, { doneOffsets: [1] }))
    expect(prochaineRevision(reviews)?.intervalInDays).toBe(3)
    expect(prochaineEcheance(reviews)).toBe('2026-03-04')
  })

  it('rend null quand tout est fait', () => {
    const { reviews } = collections(
      sujet('A', null, { doneOffsets: [1, 3, 7, 14, 30] }),
    )
    expect(prochaineRevision(reviews)).toBeNull()
    expect(prochaineEcheance(reviews)).toBeNull()
  })

  it('prend la date la plus proche, même hors de l’ordre du programme', () => {
    // Après un recalage, les échéances ne sont plus forcément croissantes.
    const { reviews } = collections(sujet('A', null))
    const decalees = reviews.map((review) =>
      review.intervalInDays === 1 ? { ...review, dueDate: '2026-04-30' } : review,
    )
    expect(prochaineEcheance(decalees)).toBe('2026-03-04')
  })
})

describe('topicProgress', () => {
  it('mesure la progression d’un seul sujet', () => {
    expect(topicProgress(collections(sujet('A', null)).reviews)).toBe(0)
    expect(
      topicProgress(
        collections(sujet('A', null, { doneOffsets: [1, 3, 7, 14, 30] })).reviews,
      ),
    ).toBe(100)
  })

  it('vaut zéro quand il n’y a aucune révision', () => {
    expect(topicProgress([])).toBe(0)
  })
})

describe('catégories', () => {
  it('les trie par nom', () => {
    expect(categoriesTriees(CATEGORIES).map((c) => c.name)).toEqual([
      'Histoire',
      'Mathématiques',
    ])
  })

  it('compte les sujets d’une catégorie, archivés compris', () => {
    const { topics } = collections(
      sujet('Dérivées', MATHS.id),
      sujet('Ancien', MATHS.id, { archived: true }),
      sujet('Révolution', HISTOIRE.id),
    )
    expect(compterSujets(MATHS.id, topics)).toBe(2)
    expect(compterSujets(HISTOIRE.id, topics)).toBe(1)
  })
})
