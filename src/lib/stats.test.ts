import { describe, expect, it } from 'vitest'
import type { Review, ScheduleId, Topic } from '../types'
import { compteur } from './ids'
import { buildReviews } from './schedules'
import { activeTopics } from './sujets'
import {
  allEntries,
  chargeParDate,
  computeStats,
  entriesForDate,
  loadForDays,
  nextReviewDay,
  overdueEntries,
  progressionEntree,
  todayEntries,
  upcomingEntries,
} from './stats'

const TODAY = '2026-03-10'

interface Options {
  schedule?: ScheduleId
  archived?: boolean
  doneOffsets?: number[]
}

/**
 * Un sujet et ses révisions, comme les deux tables les rendraient. Le titre
 * sert d'identifiant : les assertions se lisent alors sans table de renvoi.
 */
function sujet(
  title: string,
  startDate: string,
  options: Options = {},
): { topic: Topic; reviews: Review[] } {
  const schedule = options.schedule ?? 'simple'
  const done = new Set(options.doneOffsets ?? [])
  return {
    topic: {
      id: title,
      categoryId: null,
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
          ? { ...review, completedAt: '2026-03-01T09:00:00.000Z' }
          : review,
    ),
  }
}

/** Aplatit plusieurs sujets en les deux collections que prennent les fonctions. */
function collections(...sujets: { topic: Topic; reviews: Review[] }[]) {
  return {
    topics: sujets.map((s) => s.topic),
    reviews: sujets.flatMap((s) => s.reviews),
  }
}

describe('sélection des sujets', () => {
  it('écarte les sujets archivés de toutes les vues', () => {
    const { topics, reviews } = collections(
      sujet('Actif', '2026-03-09'),
      sujet('Archive', '2026-03-09', { archived: true }),
    )
    expect(activeTopics(topics).map((topic) => topic.title)).toEqual(['Actif'])
    expect(allEntries(topics, reviews).every((e) => e.topic.title === 'Actif')).toBe(true)
    expect(computeStats(topics, reviews, TODAY).activeTopics).toBe(1)
    expect(computeStats(topics, reviews, TODAY).archivedTopics).toBe(1)
  })

  it('trie les révisions par date puis par titre', () => {
    const { topics, reviews } = collections(
      sujet('Zebre', '2026-03-09'),
      sujet('Abeille', '2026-03-09'),
    )
    const entries = allEntries(topics, reviews)
    expect(entries[0].topic.title).toBe('Abeille')
    expect(entries[0].review.dueDate).toBe('2026-03-10')
    expect(entries[1].topic.title).toBe('Zebre')
  })
})

describe('vues du tableau de bord', () => {
  it('classe les révisions en retard, du jour et à venir', () => {
    // Départ le 2026-03-09 : J+1 tombe aujourd'hui, J+3 le 12 mars.
    const { topics, reviews } = collections(sujet('Hooks React', '2026-03-09'))

    expect(todayEntries(topics, reviews, TODAY)).toHaveLength(1)
    expect(overdueEntries(topics, reviews, TODAY)).toHaveLength(0)
    expect(
      upcomingEntries(topics, reviews, 8, TODAY).map((entry) => entry.review.dueDate),
    ).toEqual(['2026-03-12', '2026-03-16', '2026-03-23', '2026-04-08'])
  })

  it('ne compte en retard que les révisions passées non effectuées', () => {
    const { topics, reviews } = collections(
      sujet('Chapitre 5', '2026-03-01', { doneOffsets: [1] }),
    )
    const overdue = overdueEntries(topics, reviews, TODAY)
    // J+1 (2 mars) est effectuée, J+3 (4 mars) et J+7 (8 mars) sont en retard.
    expect(overdue.map((entry) => entry.review.intervalInDays)).toEqual([3, 7])
  })

  it('limite le nombre de prochaines révisions', () => {
    const { topics, reviews } = collections(
      sujet('Vocabulaire', '2026-03-09', { schedule: 'ultime' }),
    )
    expect(upcomingEntries(topics, reviews, 3, TODAY)).toHaveLength(3)
  })

  it('retourne les révisions d’un jour précis, effectuées comprises', () => {
    const { topics, reviews } = collections(
      sujet('Histoire', '2026-03-09', { doneOffsets: [1] }),
    )
    const entries = entriesForDate(topics, reviews, '2026-03-10')
    expect(entries).toHaveLength(1)
    expect(entries[0].review.completedAt).not.toBeNull()
  })

  it('ne rattache jamais une révision au mauvais sujet', () => {
    // Deux sujets partant du même jour : leurs révisions tombent aux mêmes
    // dates, et rien dans la table ne les sépare que `topicId`.
    const { topics, reviews } = collections(
      sujet('Physique', '2026-03-09'),
      sujet('Chimie', '2026-03-09'),
    )
    for (const entry of allEntries(topics, reviews)) {
      expect(entry.review.topicId).toBe(entry.topic.id)
    }
  })
})

describe('loadForDays', () => {
  it('couvre exactement la fenêtre demandée à partir d’aujourd’hui', () => {
    const load = loadForDays([], [], 7, TODAY)
    expect(load).toHaveLength(7)
    expect(load[0].date).toBe(TODAY)
    expect(load.at(-1)?.date).toBe('2026-03-16')
    expect(load.every((day) => day.count === 0)).toBe(true)
  })

  it('compte les révisions restantes par jour et ignore les effectuées', () => {
    const { topics, reviews } = collections(
      sujet('A', '2026-03-09'),
      sujet('B', '2026-03-09', { doneOffsets: [1] }),
    )
    const load = loadForDays(topics, reviews, 7, TODAY)
    // Aujourd'hui : J+1 de A seulement, celui de B est déjà coché.
    expect(load[0].count).toBe(1)
    // 12 mars : J+3 des deux sujets.
    expect(load.find((day) => day.date === '2026-03-12')?.count).toBe(2)
  })
})

describe('computeStats', () => {
  it('renvoie des compteurs nuls sans sujet, sans division par zéro', () => {
    expect(computeStats([], [], TODAY)).toEqual({
      activeTopics: 0,
      archivedTopics: 0,
      doneReviews: 0,
      remainingReviews: 0,
      todayReviews: 0,
      overdueReviews: 0,
      progress: 0,
    })
  })

  it('agrège les compteurs des sujets actifs', () => {
    const { topics, reviews } = collections(
      sujet('A', '2026-03-09', { doneOffsets: [1] }),
      sujet('B', '2026-03-01', { doneOffsets: [1, 3] }),
      sujet('C', '2026-03-01', { archived: true }),
    )
    const stats = computeStats(topics, reviews, TODAY)

    expect(stats.activeTopics).toBe(2)
    expect(stats.archivedTopics).toBe(1)
    expect(stats.doneReviews).toBe(3)
    expect(stats.remainingReviews).toBe(7)
    expect(stats.progress).toBe(30)
    // A : J+1 est coché aujourd'hui, il ne reste rien à faire ce jour.
    expect(stats.todayReviews).toBe(0)
    // B : J+7 (8 mars) est passé et non coché.
    expect(stats.overdueReviews).toBe(1)
  })

  it('ne compte pas les révisions d’un sujet archivé', () => {
    const { topics, reviews } = collections(
      sujet('Archive', '2026-03-01', { archived: true, doneOffsets: [1] }),
    )
    const stats = computeStats(topics, reviews, TODAY)
    expect(stats.doneReviews).toBe(0)
    expect(stats.remainingReviews).toBe(0)
  })

  it('arrondit la progression', () => {
    // 1 révision sur 5 = 20 %, 2 sur 7 = 29 %.
    const un = collections(sujet('A', '2026-03-01', { doneOffsets: [1] }))
    expect(computeStats(un.topics, un.reviews).progress).toBe(20)

    const deux = collections(
      sujet('B', '2026-03-01', { schedule: 'pousse', doneOffsets: [1, 2] }),
    )
    expect(computeStats(deux.topics, deux.reviews).progress).toBe(29)
  })
})

describe('chargeParDate', () => {
  it('compte les révisions déjà planifiées sur chaque date demandée', () => {
    // Trois sujets partant du 1er mars en « simple » : chacun pose une
    // révision le 2, le 4, le 8, le 15 et le 31 mars.
    const { topics, reviews } = collections(
      sujet('A', '2026-03-01'),
      sujet('B', '2026-03-01'),
      sujet('C', '2026-03-01'),
    )
    const charge = chargeParDate(topics, reviews, [
      '2026-03-04',
      '2026-03-08',
      '2026-03-09',
    ])

    expect(charge.get('2026-03-04')).toBe(3)
    expect(charge.get('2026-03-08')).toBe(3)
    expect(charge.get('2026-03-09')).toBe(0)
  })

  it('rend une entrée pour chaque date, même vide', () => {
    const charge = chargeParDate([], [], ['2026-03-04', '2026-03-05'])
    expect([...charge.keys()]).toEqual(['2026-03-04', '2026-03-05'])
    expect([...charge.values()]).toEqual([0, 0])
  })

  it('ignore les sujets archivés et les révisions déjà faites', () => {
    const { topics, reviews } = collections(
      sujet('A', '2026-03-01', { archived: true }),
      sujet('B', '2026-03-01', { doneOffsets: [3] }),
      sujet('C', '2026-03-01'),
    )
    // Le 4 mars est le J+3 : A est archivé, B l'a déjà fait, reste C.
    expect(chargeParDate(topics, reviews, ['2026-03-04']).get('2026-03-04')).toBe(1)
  })

  it('exclut le sujet en cours de modification', () => {
    const { topics, reviews } = collections(
      sujet('A', '2026-03-01'),
      sujet('B', '2026-03-01'),
    )
    expect(chargeParDate(topics, reviews, ['2026-03-04'], 'A').get('2026-03-04')).toBe(1)
  })
})

describe('nextReviewDay', () => {
  it('trouve le prochain jour chargé et son effectif', () => {
    const { topics, reviews } = collections(
      sujet('A', '2026-03-10'),
      sujet('B', '2026-03-10'),
    )
    expect(nextReviewDay(topics, reviews, TODAY)).toEqual({
      date: '2026-03-11',
      count: 2,
    })
  })

  it('saute les jours dont les révisions sont déjà faites', () => {
    const { topics, reviews } = collections(
      sujet('A', '2026-03-10', { doneOffsets: [1] }),
    )
    expect(nextReviewDay(topics, reviews, TODAY)).toEqual({
      date: '2026-03-13',
      count: 1,
    })
  })

  it('ne rend rien quand plus aucune révision n’est planifiée', () => {
    expect(nextReviewDay([], [], TODAY)).toBeNull()
    const archive = collections(sujet('A', '2026-03-10', { archived: true }))
    expect(nextReviewDay(archive.topics, archive.reviews, TODAY)).toBeNull()
  })
})

describe('progressionEntree', () => {
  // Programme « simple » : J+1, J+3, J+7, J+14, J+30 depuis le 1er mars.
  const chapitre = sujet('Chapitre 4', '2026-03-01')
  const rang = (offset: number) =>
    progressionEntree(
      chapitre.reviews.find((r) => r.intervalInDays === offset)!,
      chapitre.reviews,
    )

  it('situe la révision dans son programme', () => {
    expect(rang(1)).toEqual({ rang: 1, total: 5, suivante: '2026-03-04' })
    expect(rang(7)).toEqual({ rang: 3, total: 5, suivante: '2026-03-15' })
  })

  it('ne promet plus rien après la dernière échéance', () => {
    expect(rang(30)).toEqual({ rang: 5, total: 5, suivante: null })
  })

  it('saute les échéances déjà faites', () => {
    const avance = sujet('Chapitre 5', '2026-03-01', { doneOffsets: [3, 7] })
    // J+3 et J+7 sont cochées : la prochaine à faire est J+14, le 15 mars.
    expect(progressionEntree(avance.reviews[0], avance.reviews).suivante).toBe(
      '2026-03-15',
    )
  })

  it('prend la plus proche des dates restantes, quel que soit leur ordre', () => {
    // Le recalage après retard réécrit les dates : rien ne garantit qu'elles
    // restent croissantes. Ici J+3 est repoussée au 20 mars, derrière J+7 :
    // c'est le 8 mars qu'il faut annoncer, pas le 20.
    const decale = sujet('Chapitre 6', '2026-03-01')
    decale.reviews[1] = { ...decale.reviews[1], dueDate: '2026-03-20' }
    expect(progressionEntree(decale.reviews[0], decale.reviews).suivante).toBe(
      '2026-03-08',
    )
  })
})
