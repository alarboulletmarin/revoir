import { describe, expect, it } from 'vitest'
import type { Item, ScheduleId } from '../types'
import { buildReviews } from './schedules'
import {
  activeItems,
  allEntries,
  chargeParDate,
  computeStats,
  entriesForDate,
  itemProgress,
  loadForDays,
  nextReviewDay,
  overdueEntries,
  todayEntries,
  upcomingEntries,
  usedCategories,
} from './stats'

const TODAY = '2026-03-10'

function makeItem(
  title: string,
  startDate: string,
  options: {
    schedule?: ScheduleId
    category?: string
    archived?: boolean
    doneOffsets?: number[]
  } = {},
): Item {
  const schedule = options.schedule ?? 'simple'
  const done = new Set(options.doneOffsets ?? [])
  return {
    id: title,
    title,
    category: options.category ?? 'Études',
    startDate,
    schedule,
    reviews: buildReviews(startDate, schedule).map((review) =>
      done.has(review.offset)
        ? { ...review, done: true, doneAt: '2026-03-01T09:00:00.000Z' }
        : review,
    ),
    archived: options.archived ?? false,
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-03-01T09:00:00.000Z',
  }
}

describe('sélection des éléments', () => {
  it('écarte les éléments archivés de toutes les vues', () => {
    const items = [
      makeItem('Actif', '2026-03-09'),
      makeItem('Archive', '2026-03-09', { archived: true }),
    ]
    expect(activeItems(items).map((item) => item.title)).toEqual(['Actif'])
    expect(allEntries(items).every((entry) => entry.item.title === 'Actif')).toBe(true)
    expect(computeStats(items, TODAY).activeItems).toBe(1)
    expect(computeStats(items, TODAY).archivedItems).toBe(1)
  })

  it('trie les révisions par date puis par titre', () => {
    const entries = allEntries([
      makeItem('Zebre', '2026-03-09'),
      makeItem('Abeille', '2026-03-09'),
    ])
    expect(entries[0].item.title).toBe('Abeille')
    expect(entries[0].review.date).toBe('2026-03-10')
    expect(entries[1].item.title).toBe('Zebre')
  })
})

describe('vues du tableau de bord', () => {
  it('classe les révisions en retard, du jour et à venir', () => {
    // Départ le 2026-03-09 : J+1 tombe aujourd'hui, J+3 le 12 mars.
    const items = [makeItem('Hooks React', '2026-03-09')]

    expect(todayEntries(items, TODAY)).toHaveLength(1)
    expect(overdueEntries(items, TODAY)).toHaveLength(0)
    expect(upcomingEntries(items, 8, TODAY).map((entry) => entry.review.date)).toEqual([
      '2026-03-12',
      '2026-03-16',
      '2026-03-23',
      '2026-04-08',
    ])
  })

  it('ne compte en retard que les révisions passées non effectuées', () => {
    const items = [makeItem('Chapitre 5', '2026-03-01', { doneOffsets: [1] })]
    const overdue = overdueEntries(items, TODAY)
    // J+1 (2 mars) est effectuée, J+3 (4 mars) et J+7 (8 mars) sont en retard.
    expect(overdue.map((entry) => entry.review.offset)).toEqual([3, 7])
  })

  it('limite le nombre de prochaines révisions', () => {
    const items = [makeItem('Vocabulaire', '2026-03-09', { schedule: 'ultime' })]
    expect(upcomingEntries(items, 3, TODAY)).toHaveLength(3)
  })

  it('retourne les révisions d’un jour précis, effectuées comprises', () => {
    const items = [makeItem('Histoire', '2026-03-09', { doneOffsets: [1] })]
    const entries = entriesForDate(items, '2026-03-10')
    expect(entries).toHaveLength(1)
    expect(entries[0].review.done).toBe(true)
  })
})

describe('loadForDays', () => {
  it('couvre exactement la fenêtre demandée à partir d’aujourd’hui', () => {
    const load = loadForDays([], 7, TODAY)
    expect(load).toHaveLength(7)
    expect(load[0].date).toBe(TODAY)
    expect(load.at(-1)?.date).toBe('2026-03-16')
    expect(load.every((day) => day.count === 0)).toBe(true)
  })

  it('compte les révisions restantes par jour et ignore les effectuées', () => {
    const items = [
      makeItem('A', '2026-03-09'),
      makeItem('B', '2026-03-09', { doneOffsets: [1] }),
    ]
    const load = loadForDays(items, 7, TODAY)
    // Aujourd'hui : J+1 de A seulement, celui de B est déjà coché.
    expect(load[0].count).toBe(1)
    // 12 mars : J+3 des deux éléments.
    expect(load.find((day) => day.date === '2026-03-12')?.count).toBe(2)
  })
})

describe('computeStats', () => {
  it('renvoie des compteurs nuls sans élément, sans division par zéro', () => {
    expect(computeStats([], TODAY)).toEqual({
      activeItems: 0,
      archivedItems: 0,
      doneReviews: 0,
      remainingReviews: 0,
      todayReviews: 0,
      overdueReviews: 0,
      progress: 0,
    })
  })

  it('agrège les compteurs des éléments actifs', () => {
    const items = [
      makeItem('A', '2026-03-09', { doneOffsets: [1] }),
      makeItem('B', '2026-03-01', { doneOffsets: [1, 3] }),
      makeItem('C', '2026-03-01', { archived: true }),
    ]
    const stats = computeStats(items, TODAY)

    expect(stats.activeItems).toBe(2)
    expect(stats.archivedItems).toBe(1)
    expect(stats.doneReviews).toBe(3)
    expect(stats.remainingReviews).toBe(7)
    expect(stats.progress).toBe(30)
    // A : J+1 est coché aujourd'hui, il ne reste rien à faire ce jour.
    expect(stats.todayReviews).toBe(0)
    // B : J+7 (8 mars) est passe et non coché.
    expect(stats.overdueReviews).toBe(1)
  })

  it('arrondit la progression', () => {
    // 1 révision sur 5 = 20 %, 2 sur 7 = 29 %.
    expect(computeStats([makeItem('A', '2026-03-01', { doneOffsets: [1] })]).progress).toBe(
      20,
    )
    expect(
      computeStats([
        makeItem('B', '2026-03-01', { schedule: 'pousse', doneOffsets: [1, 2] }),
      ]).progress,
    ).toBe(29)
  })
})

describe('itemProgress', () => {
  it('mesure la progression d’un seul élément', () => {
    expect(itemProgress(makeItem('A', '2026-03-01'))).toBe(0)
    expect(itemProgress(makeItem('A', '2026-03-01', { doneOffsets: [1, 3, 7, 14, 30] }))).toBe(
      100,
    )
  })

  it('vaut zéro quand il n’y a aucune révision', () => {
    expect(itemProgress({ ...makeItem('A', '2026-03-01'), reviews: [] })).toBe(0)
  })
})

describe('usedCategories', () => {
  it('liste les catégories distinctes, triées, sans les vides', () => {
    const items = [
      makeItem('A', '2026-03-01', { category: 'Langues' }),
      makeItem('B', '2026-03-01', { category: 'Études' }),
      makeItem('C', '2026-03-01', { category: 'Langues' }),
      makeItem('D', '2026-03-01', { category: '  ' }),
    ]
    expect(usedCategories(items)).toEqual(['Études', 'Langues'])
  })
})

describe('chargeParDate', () => {
  it('compte les révisions déjà planifiées sur chaque date demandée', () => {
    // Trois éléments partant du 1er mars en « simple » : chacun pose une
    // révision le 2, le 4, le 8, le 15 et le 31 mars.
    const items = [
      makeItem('A', '2026-03-01'),
      makeItem('B', '2026-03-01'),
      makeItem('C', '2026-03-01'),
    ]
    const charge = chargeParDate(items, ['2026-03-04', '2026-03-08', '2026-03-09'])

    expect(charge.get('2026-03-04')).toBe(3)
    expect(charge.get('2026-03-08')).toBe(3)
    expect(charge.get('2026-03-09')).toBe(0)
  })

  it('rend une entrée pour chaque date, même vide', () => {
    const charge = chargeParDate([], ['2026-03-04', '2026-03-05'])
    expect([...charge.keys()]).toEqual(['2026-03-04', '2026-03-05'])
    expect([...charge.values()]).toEqual([0, 0])
  })

  it('ignore les éléments archivés et les révisions déjà faites', () => {
    const items = [
      makeItem('A', '2026-03-01', { archived: true }),
      makeItem('B', '2026-03-01', { doneOffsets: [3] }),
      makeItem('C', '2026-03-01'),
    ]
    // Le 4 mars est le J+3 : A est archivé, B l'a déjà fait, reste C.
    expect(chargeParDate(items, ['2026-03-04']).get('2026-03-04')).toBe(1)
  })

  it('exclut l’élément en cours de modification', () => {
    const items = [makeItem('A', '2026-03-01'), makeItem('B', '2026-03-01')]
    // makeItem utilise le titre comme identifiant.
    expect(chargeParDate(items, ['2026-03-04'], 'A').get('2026-03-04')).toBe(1)
  })
})

describe('nextReviewDay', () => {
  it('trouve le prochain jour chargé et son effectif', () => {
    // Départ le 8 mars : J+1 tombe le 9, soit demain pour un « aujourd'hui »
    // au 10 mars… donc on prend un départ qui pose des dates futures.
    const items = [makeItem('A', '2026-03-10'), makeItem('B', '2026-03-10')]
    expect(nextReviewDay(items, TODAY)).toEqual({ date: '2026-03-11', count: 2 })
  })

  it('saute les jours dont les révisions sont déjà faites', () => {
    const items = [makeItem('A', '2026-03-10', { doneOffsets: [1] })]
    expect(nextReviewDay(items, TODAY)).toEqual({ date: '2026-03-13', count: 1 })
  })

  it('ne rend rien quand plus aucune révision n’est planifiée', () => {
    expect(nextReviewDay([], TODAY)).toBeNull()
    expect(
      nextReviewDay([makeItem('A', '2026-03-10', { archived: true })], TODAY),
    ).toBeNull()
  })
})
