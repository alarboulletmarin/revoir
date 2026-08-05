// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest'
import { compteur } from './ids'
import {
  completionLegacy,
  normaliserV3,
  type ItemLegacy,
  type ReviewLegacy,
} from './migration'

function revision(
  offset: number,
  date: string,
  fait: { done?: boolean; doneAt?: string | null } = {},
): ReviewLegacy {
  return {
    offset,
    date,
    done: fait.done ?? false,
    doneAt: fait.doneAt ?? null,
  }
}

function element(
  id: string,
  category: string,
  reviews: ReviewLegacy[] = [],
  options: { archived?: boolean; schedule?: string } = {},
): ItemLegacy {
  return {
    id,
    title: `Titre de ${id}`,
    category,
    startDate: '2026-03-01',
    schedule: options.schedule ?? 'simple',
    reviews,
    archived: options.archived ?? false,
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-03-02T09:00:00.000Z',
  }
}

describe('completionLegacy', () => {
  it('rend l’horodatage d’une révision cochée', () => {
    expect(completionLegacy(revision(1, '2026-03-02', {
      done: true,
      doneAt: '2026-03-02T09:00:00.000Z',
    }))).toBe('2026-03-02T09:00:00.000Z')
  })

  it('invente midi pour une révision cochée sans horodatage', () => {
    expect(completionLegacy(revision(1, '2026-03-02', { done: true }))).toBe(
      '2026-03-02T12:00:00.000Z',
    )
  })

  it('ignore un horodatage porté par une révision non cochée', () => {
    expect(completionLegacy(revision(1, '2026-03-02', {
      doneAt: '2026-03-02T09:00:00.000Z',
    }))).toBeNull()
  })
})

describe('normaliserV3', () => {
  it('crée une catégorie par matière rencontrée', () => {
    const { categories, topics } = normaliserV3(
      [element('a', 'Mathématiques'), element('b', 'Histoire')],
      {},
      compteur('c'),
    )

    expect(categories.map((categorie) => categorie.name)).toEqual([
      'Mathématiques',
      'Histoire',
    ])
    expect(topics[0].categoryId).toBe(categories[0].id)
    expect(topics[1].categoryId).toBe(categories[1].id)
  })

  it('réunit deux graphies sous une seule catégorie, la première l’emportant', () => {
    const { categories, topics } = normaliserV3(
      [element('a', 'Maths'), element('b', 'maths'), element('c', 'MATHS')],
      {},
      compteur('c'),
    )

    expect(categories).toHaveLength(1)
    expect(categories[0].name).toBe('Maths')
    expect(new Set(topics.map((topic) => topic.categoryId))).toEqual(
      new Set([categories[0].id]),
    )
  })

  it('laisse sans catégorie un élément dont la matière est vide ou blanche', () => {
    const { categories, topics } = normaliserV3(
      [element('a', ''), element('b', '   ')],
      {},
      compteur('c'),
    )

    expect(categories).toHaveLength(0)
    expect(topics.every((topic) => topic.categoryId === null)).toBe(true)
  })

  it('reporte la teinte choisie sur la catégorie, et laisse null sans choix', () => {
    const { categories } = normaliserV3(
      [element('a', 'Développement'), element('b', 'Histoire')],
      { développement: 'bleu' },
      compteur('c'),
    )

    expect(categories[0].tint).toBe('bleu')
    expect(categories[1].tint).toBeNull()
  })

  it('abandonne une teinte dont plus aucune matière ne porte le nom', () => {
    const { categories } = normaliserV3(
      [element('a', 'Histoire')],
      { piano: 'olive' },
      compteur('c'),
    )

    expect(categories).toHaveLength(1)
    expect(categories[0].name).toBe('Histoire')
  })

  it('conserve l’identifiant de l’élément comme identifiant du sujet', () => {
    const { topics } = normaliserV3([element('abc-123', 'Piano')], {}, compteur('c'))

    expect(topics[0].id).toBe('abc-123')
  })

  it('numérote les révisions par leur rang dans le tableau', () => {
    const { reviews } = normaliserV3(
      [
        element('a', 'Piano', [
          revision(1, '2026-03-02'),
          revision(3, '2026-03-04'),
          revision(7, '2026-03-08'),
        ]),
      ],
      {},
      compteur('c'),
    )

    expect(reviews.map((review) => review.position)).toEqual([1, 2, 3])
    expect(reviews.map((review) => review.intervalInDays)).toEqual([1, 3, 7])
    expect(reviews.map((review) => review.dueDate)).toEqual([
      '2026-03-02',
      '2026-03-04',
      '2026-03-08',
    ])
    expect(reviews.every((review) => review.topicId === 'a')).toBe(true)
  })

  it('garde deux révisions de même décalage comme deux lignes', () => {
    const { reviews } = normaliserV3(
      [element('a', 'Piano', [revision(7, '2026-03-08'), revision(7, '2026-03-09')])],
      {},
      compteur('c'),
    )

    expect(reviews).toHaveLength(2)
    expect(reviews.map((review) => review.position)).toEqual([1, 2])
  })

  it('traduit `archived` en statut du sujet', () => {
    const { topics } = normaliserV3(
      [element('a', 'Piano', [], { archived: true }), element('b', 'Piano')],
      {},
      compteur('c'),
    )

    expect(topics[0].status).toBe('archived')
    expect(topics[1].status).toBe('active')
  })

  it('donne à tous les sujets migrés une pratique à faire', () => {
    const { topics } = normaliserV3([element('a', 'Piano')], {}, compteur('c'))

    expect(topics[0].practiceStatus).toBe('todo')
  })

  it('conserve un identifiant de programme inconnu plutôt que de le corriger', () => {
    const { topics } = normaliserV3(
      [element('a', 'Piano', [], { schedule: 'programme-disparu' })],
      {},
      compteur('c'),
    )

    expect(topics[0].scheduleId).toBe('programme-disparu')
  })

  it('accepte un élément sans aucune révision', () => {
    const { topics, reviews } = normaliserV3([element('a', 'Piano')], {}, compteur('c'))

    expect(topics).toHaveLength(1)
    expect(reviews).toHaveLength(0)
  })

  it('ne perd aucune révision sur un jeu complet', () => {
    const items = [
      element('a', 'Maths', [
        revision(1, '2026-03-02', { done: true, doneAt: '2026-03-02T09:00:00.000Z' }),
        revision(3, '2026-03-04', { done: true }),
        revision(7, '2026-03-08'),
      ]),
      element('b', '', [revision(1, '2026-03-02')]),
    ]

    const { categories, topics, reviews } = normaliserV3(items, {}, compteur('c'))

    expect(categories).toHaveLength(1)
    expect(topics).toHaveLength(2)
    expect(reviews).toHaveLength(4)
    expect(reviews.filter((review) => review.completedAt !== null)).toHaveLength(2)
  })
})
