import { describe, expect, it } from 'vitest'
import type { Review, ScheduleId, Topic } from '../types'
import { compteur } from './ids'
import { buildReviews } from './schedules'
import {
  colonnesCategorie,
  etatRevision,
  lignesCategorie,
  resumeCategorie,
  statsCategorie,
} from './suivi'

const TODAY = '2026-03-10'

function sujet(
  title: string,
  options: {
    startDate?: string
    schedule?: ScheduleId
    doneOffsets?: number[]
  } = {},
): { topic: Topic; reviews: Review[] } {
  const startDate = options.startDate ?? '2026-03-09'
  const schedule = options.schedule ?? 'simple'
  const done = new Set(options.doneOffsets ?? [])
  return {
    topic: {
      id: title,
      categoryId: 'cat',
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
          ? { ...review, completedAt: '2026-03-09T09:00:00.000Z' }
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

/** Les états d'une ligne, lus en un coup d'œil comme sur l'écran. */
function etats(
  topics: Topic[],
  reviews: Review[],
  mode: 'compact' | 'intervalles',
  titre: string,
) {
  const colonnes = colonnesCategorie(topics, reviews, mode)
  const ligne = lignesCategorie(topics, reviews, colonnes, TODAY).find(
    (candidate) => candidate.topic.title === titre,
  )!
  return ligne.cellules.map((cellule) => cellule.etat)
}

describe('colonnesCategorie — mode intervalles', () => {
  it('prend l’union des écarts de la catégorie, triée', () => {
    // Simple : 1 3 7 14 30. Poussé : 1 2 4 7 14 30 60.
    const { topics, reviews } = collections(
      sujet('A'),
      sujet('B', { schedule: 'pousse' }),
    )
    expect(
      colonnesCategorie(topics, reviews, 'intervalles').map((c) => c.libelle),
    ).toEqual(['J+1', 'J+2', 'J+3', 'J+4', 'J+7', 'J+14', 'J+30', 'J+60'])
  })

  it('ne compte qu’une fois un écart partagé', () => {
    const { topics, reviews } = collections(sujet('A'), sujet('B'))
    expect(colonnesCategorie(topics, reviews, 'intervalles')).toHaveLength(5)
  })

  it('décrit chaque colonne dans son unité naturelle', () => {
    const { topics, reviews } = collections(sujet('A'))
    const colonnes = colonnesCategorie(topics, reviews, 'intervalles')
    expect(colonnes.map((c) => c.description)).toEqual([
      'Révision à 1 j',
      'Révision à 3 j',
      'Révision à 1 sem.',
      'Révision à 2 sem.',
      'Révision à 1 mois',
    ])
  })

  it('ne rend aucune colonne pour une catégorie sans révision', () => {
    expect(colonnesCategorie([], [], 'intervalles')).toEqual([])
  })
})

describe('colonnesCategorie — mode compact', () => {
  it('numérote les rangs jusqu’au plus long programme de la catégorie', () => {
    const { topics, reviews } = collections(
      sujet('A'),
      sujet('B', { schedule: 'ultime' }),
    )
    const colonnes = colonnesCategorie(topics, reviews, 'compact')
    expect(colonnes).toHaveLength(10)
    expect(colonnes.map((c) => c.libelle).slice(0, 3)).toEqual(['R1', 'R2', 'R3'])
  })

  it('tient dans moins de colonnes que le mode intervalles', () => {
    // C'est sa raison d'être : sur un téléphone, l'union des écarts déborde.
    const { topics, reviews } = collections(
      sujet('A'),
      sujet('B', { schedule: 'pousse' }),
      sujet('C', { schedule: 'ultime' }),
    )
    expect(colonnesCategorie(topics, reviews, 'compact').length).toBeLessThan(
      colonnesCategorie(topics, reviews, 'intervalles').length,
    )
  })
})

describe('etatRevision', () => {
  const { reviews } = collections(sujet('A', { startDate: '2026-03-09' }))
  const [j1, j3] = reviews

  it('reconnaît la révision du jour', () => {
    // Départ le 9 mars : J+1 tombe le 10, soit aujourd'hui.
    expect(etatRevision(j1, TODAY)).toBe('aujourdhui')
  })

  it('reconnaît une révision à venir', () => {
    expect(etatRevision(j3, TODAY)).toBe('avenir')
  })

  it('reconnaît un retard', () => {
    expect(etatRevision({ ...j1, dueDate: '2026-03-01' }, TODAY)).toBe('retard')
  })

  it('laisse « faite » l’emporter, même sur une date passée', () => {
    // Une révision validée en retard reste faite : le retard ne s'applique
    // qu'à ce qui reste à faire.
    expect(
      etatRevision(
        { ...j1, dueDate: '2026-03-01', completedAt: '2026-03-05T09:00:00.000Z' },
        TODAY,
      ),
    ).toBe('faite')
  })
})

describe('lignesCategorie', () => {
  it('rend une cellule par colonne, sans trou', () => {
    const { topics, reviews } = collections(
      sujet('A'),
      sujet('B', { schedule: 'ultime' }),
    )
    const colonnes = colonnesCategorie(topics, reviews, 'intervalles')
    for (const ligne of lignesCategorie(topics, reviews, colonnes, TODAY)) {
      expect(ligne.cellules).toHaveLength(colonnes.length)
    }
  })

  it('marque « hors programme » un écart que le sujet n’a pas', () => {
    // A suit Simple (1 3 7 14 30), B suit Poussé (1 2 4 7 14 30 60).
    // Colonnes : J+1 J+2 J+3 J+4 J+7 J+14 J+30 J+60.
    const { topics, reviews } = collections(
      sujet('A', { doneOffsets: [1] }),
      sujet('B', { schedule: 'pousse' }),
    )
    expect(etats(topics, reviews, 'intervalles', 'A')).toEqual([
      'faite',
      'hors-programme',
      'avenir',
      'hors-programme',
      'avenir',
      'avenir',
      'avenir',
      'hors-programme',
    ])
  })

  it('marque « hors programme » la queue d’une ligne courte, en mode compact', () => {
    const { topics, reviews } = collections(
      sujet('Court'),
      sujet('Long', { schedule: 'ultime' }),
    )
    const lus = etats(topics, reviews, 'compact', 'Court')
    expect(lus).toHaveLength(10)
    expect(lus.slice(5)).toEqual(Array(5).fill('hors-programme'))
  })

  it('rend les états d’une ligne du plus avancé au plus lointain', () => {
    const { topics, reviews } = collections(
      sujet('Dérivées', { startDate: '2026-03-09', doneOffsets: [1] }),
    )
    // J+1 est faite, J+3 tombe le 12 mars, le reste plus tard.
    expect(etats(topics, reviews, 'compact', 'Dérivées')).toEqual([
      'faite',
      'avenir',
      'avenir',
      'avenir',
      'avenir',
    ])
  })

  it('joint à chaque ligne les révisions du sujet, dans l’ordre du programme', () => {
    const { topics, reviews } = collections(sujet('A'))
    const colonnes = colonnesCategorie(topics, reviews, 'compact')
    const [ligne] = lignesCategorie(topics, reviews, colonnes, TODAY)

    expect(ligne.revisions.map((review) => review.position)).toEqual([1, 2, 3, 4, 5])
  })

  it('rattache chaque cellule à la révision du bon sujet', () => {
    // Deux sujets partant du même jour : leurs échéances coïncident, et seule
    // la clé de rattachement les sépare.
    const { topics, reviews } = collections(sujet('Physique'), sujet('Chimie'))
    const colonnes = colonnesCategorie(topics, reviews, 'intervalles')
    for (const ligne of lignesCategorie(topics, reviews, colonnes, TODAY)) {
      for (const cellule of ligne.cellules) {
        if (cellule.review) expect(cellule.review.topicId).toBe(ligne.topic.id)
      }
    }
  })
})

describe('statsCategorie', () => {
  it('compte les sujets, les retards et la progression', () => {
    const { topics, reviews } = collections(
      // Départ le 1er mars : J+1 (2 mars) et J+3 (4 mars) sont passées.
      sujet('A', { startDate: '2026-03-01', doneOffsets: [1] }),
      sujet('B', { startDate: '2026-03-09' }),
    )
    expect(statsCategorie(topics, reviews, TODAY)).toEqual({
      sujets: 2,
      // A : J+3 (4 mars) et J+7 (8 mars) non faites et passées.
      enRetard: 2,
      // 1 faite sur 10.
      progression: 10,
    })
  })

  it('ne compte pas les révisions d’un sujet absent de la catégorie', () => {
    const dedans = collections(sujet('A'))
    const dehors = collections(sujet('B', { startDate: '2026-01-01' }))
    expect(
      statsCategorie(dedans.topics, [...dedans.reviews, ...dehors.reviews], TODAY)
        .enRetard,
    ).toBe(0)
  })

  it('ne divise pas par zéro sur une catégorie sans révision', () => {
    expect(statsCategorie([], [], TODAY)).toEqual({
      sujets: 0,
      enRetard: 0,
      progression: 0,
    })
  })
})

describe('resumeCategorie', () => {
  it('écrit les trois chiffres', () => {
    expect(resumeCategorie({ sujets: 8, enRetard: 3, progression: 62 })).toBe(
      '8 sujets · 3 révisions en retard · 62 % terminé',
    )
  })

  it('tait le retard quand il n’y en a pas', () => {
    // « Le retard n'accuse pas » : annoncer « 0 en retard » serait rappeler un
    // problème à qui n'en a aucun.
    expect(resumeCategorie({ sujets: 1, enRetard: 0, progression: 0 })).toBe(
      '1 sujet · 0 % terminé',
    )
  })

  it('accorde le singulier', () => {
    expect(resumeCategorie({ sujets: 1, enRetard: 1, progression: 50 })).toBe(
      '1 sujet · 1 révision en retard · 50 % terminé',
    )
  })
})
