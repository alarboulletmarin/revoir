// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest'
import type { Category, Review, ScheduleId, Topic } from '../types'
import { compteur } from './ids'
import { buildReviews } from './schedules'
import { fromKey } from './dates'
import { densite, deplacementClavier, grilleDuMois } from './calendrier'

const CATEGORIES: Category[] = ['Études', 'Travail'].map((name) => ({
  id: `cat-${name}`,
  name,
  tint: null,
  createdAt: '2026-03-01T09:00:00.000Z',
  updatedAt: '2026-03-01T09:00:00.000Z',
}))

function sujet(
  title: string,
  startDate: string,
  options: { schedule?: ScheduleId; doneOffsets?: number[]; category?: string } = {},
): { topic: Topic; reviews: Review[] } {
  const schedule = options.schedule ?? 'simple'
  const done = new Set(options.doneOffsets ?? [])
  const categorie =
    CATEGORIES.find((candidate) => candidate.name === (options.category ?? 'Études')) ??
    null
  return {
    topic: {
      id: title,
      categoryId: categorie?.id ?? null,
      title,
      startDate,
      scheduleId: schedule,
      practiceStatus: 'todo',
      status: 'active',
      createdAt: '2026-03-01T09:00:00.000Z',
      updatedAt: '2026-03-01T09:00:00.000Z',
    },
    reviews: buildReviews(title, startDate, schedule, [], compteur(`${title}-r`)).map(
      (review) =>
        done.has(review.intervalInDays)
          ? { ...review, completedAt: '2026-03-01T09:00:00.000Z' }
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

describe('grilleDuMois', () => {
  it('couvre des semaines entières, du lundi au dimanche', () => {
    // Mars 2026 commence un dimanche : la grille ouvre le lundi 23 février.
    const grille = grilleDuMois([], [], CATEGORIES, fromKey('2026-03-01'))
    expect(grille.length % 7).toBe(0)
    expect(grille[0].cle).toBe('2026-02-23')
    expect(grille[0].dansLeMois).toBe(false)
    expect(grille.find((jour) => jour.cle === '2026-03-01')?.dansLeMois).toBe(true)
  })

  it('compte les révisions du jour et celles qui restent à faire', () => {
    const { topics, reviews } = collections(
      sujet('A', '2026-03-01'),
      sujet('B', '2026-03-01', { doneOffsets: [3] }),
    )
    // Le 4 mars est le J+3 des deux sujets, dont un déjà coché.
    const jour = grilleDuMois(topics, reviews, CATEGORIES, fromKey('2026-03-01')).find(
      (candidat) => candidat.cle === '2026-03-04',
    )
    expect(jour).toMatchObject({ total: 2, restantes: 1 })
  })

  it('rend les catégories du jour dans l’ordre de la liste', () => {
    // allEntries trie par date puis par titre : Anatomie avant Barème.
    const { topics, reviews } = collections(
      sujet('Barème fiscal', '2026-03-01', { category: 'Travail' }),
      sujet('Anatomie', '2026-03-01', { category: 'Études' }),
      sujet('Sonate', '2026-03-01', { category: 'aucune' }),
    )
    const jour = grilleDuMois(topics, reviews, CATEGORIES, fromKey('2026-03-01')).find(
      (candidat) => candidat.cle === '2026-03-04',
    )
    // Un sujet sans catégorie laisse un `null` : c'est à l'affichage de décider
    // qu'il ne se teinte pas, pas à la grille de l'effacer.
    expect(jour?.categories.map((categorie) => categorie?.name ?? null)).toEqual([
      'Études',
      'Travail',
      null,
    ])
  })

  it('laisse les catégories vides quand le jour n’a rien', () => {
    const jour = grilleDuMois([], [], CATEGORIES, fromKey('2026-03-01'))[0]
    expect(jour.categories).toEqual([])
  })

  it('ignore les révisions des sujets archivés', () => {
    const { topics, reviews } = collections(sujet('A', '2026-03-01'))
    const archives = topics.map((topic) => ({ ...topic, status: 'archived' as const }))
    const grille = grilleDuMois(archives, reviews, CATEGORIES, fromKey('2026-03-01'))
    expect(grille.every((jour) => jour.total === 0)).toBe(true)
  })
})

describe('densite', () => {
  it('plafonne à trois points, quel que soit l’effectif', () => {
    expect([0, 1, 2, 3, 4, 12].map(densite)).toEqual([0, 1, 2, 3, 3, 3])
  })
})

describe('deplacementClavier', () => {
  it('déplace d’un jour et d’une semaine', () => {
    expect(deplacementClavier('2026-03-10', 'ArrowLeft')).toBe('2026-03-09')
    expect(deplacementClavier('2026-03-10', 'ArrowRight')).toBe('2026-03-11')
    expect(deplacementClavier('2026-03-10', 'ArrowUp')).toBe('2026-03-03')
    expect(deplacementClavier('2026-03-10', 'ArrowDown')).toBe('2026-03-17')
  })

  it('va aux deux bouts de la semaine française', () => {
    // Le 10 mars 2026 est un mardi : lundi 9, dimanche 15.
    expect(deplacementClavier('2026-03-10', 'Home')).toBe('2026-03-09')
    expect(deplacementClavier('2026-03-10', 'End')).toBe('2026-03-15')
  })

  it('change de mois sans déborder sur le suivant', () => {
    expect(deplacementClavier('2026-03-10', 'PageUp')).toBe('2026-02-10')
    expect(deplacementClavier('2026-03-10', 'PageDown')).toBe('2026-04-10')
    // Le 31 mars n'existe pas en avril : date-fns rabat sur le 30.
    expect(deplacementClavier('2026-03-31', 'PageDown')).toBe('2026-04-30')
  })

  it('franchit les mois et les années par les flèches', () => {
    expect(deplacementClavier('2026-02-28', 'ArrowRight')).toBe('2026-03-01')
    expect(deplacementClavier('2026-01-01', 'ArrowLeft')).toBe('2025-12-31')
  })

  it('laisse passer les touches qui ne le concernent pas', () => {
    expect(deplacementClavier('2026-03-10', 'Enter')).toBeNull()
    expect(deplacementClavier('2026-03-10', 'Escape')).toBeNull()
    expect(deplacementClavier('2026-03-10', 'a')).toBeNull()
  })
})
