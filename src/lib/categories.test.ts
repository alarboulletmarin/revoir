// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest'
import type { Category, Topic } from '../types'
import {
  propositionsCategories,
  TEINTES,
  categorieHomonyme,
  categoriesProposees,
  cleCategorie,
  detacherCategorie,
  estTeinte,
  teinteDe,
  teinteParDefaut,
  trouverCategorie,
} from './categories'
import { compteur } from './ids'

function categorie(name: string, tint: Category['tint'] = null): Category {
  return {
    id: `cat-${name}`,
    name,
    tint,
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-03-01T09:00:00.000Z',
  }
}

function sujet(id: string, categoryId: string | null): Topic {
  return {
    id,
    categoryId,
    title: `Sujet ${id}`,
    startDate: '2026-03-01',
    scheduleId: 'simple',
    practiceStatus: 'todo',
    status: 'active',
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-03-01T09:00:00.000Z',
  }
}

describe('cleCategorie', () => {
  it('ignore la casse et les espaces autour', () => {
    expect(cleCategorie('  Mathématiques ')).toBe('mathématiques')
    expect(cleCategorie('MATHS')).toBe(cleCategorie('maths'))
  })
})

describe('trouverCategorie', () => {
  const existantes = [categorie('Histoire'), categorie('Mathématiques')]

  it('retrouve une catégorie quelle que soit la graphie saisie', () => {
    expect(trouverCategorie('  HISTOIRE ', existantes)?.name).toBe('Histoire')
  })

  it('ne rend rien pour un nom inconnu', () => {
    expect(trouverCategorie('Piano', existantes)).toBeNull()
  })

  it('ne rend rien pour une saisie vide — ce n’est pas une catégorie', () => {
    expect(trouverCategorie('   ', existantes)).toBeNull()
  })
})

describe('teinteParDefaut', () => {
  it('rend toujours une teinte du jeu', () => {
    for (const nom of ['Maths', 'Histoire', 'Anglais', '', 'Physique-chimie']) {
      expect(TEINTES).toContain(teinteParDefaut(nom))
    }
  })

  it('est stable pour un même nom', () => {
    expect(teinteParDefaut('Histoire')).toBe(teinteParDefaut('Histoire'))
  })

  it('ne dépend pas de la casse ni des espaces', () => {
    // Deux appareils qui écrivent la catégorie différemment doivent l'afficher
    // de la même couleur.
    expect(teinteParDefaut(' histoire ')).toBe(teinteParDefaut('Histoire'))
  })

  it('répartit les catégories courantes sur plusieurs teintes', () => {
    const noms = [
      'Mathématiques',
      'Histoire',
      'Anglais',
      'Physique',
      'Philosophie',
      'Biologie',
    ]
    const obtenues = new Set(noms.map(teinteParDefaut))
    // Sans exiger l'injectivité — un hachage sur 8 valeurs collisionne —, on
    // vérifie que la répartition n'est pas dégénérée.
    expect(obtenues.size).toBeGreaterThanOrEqual(3)
  })
})

describe('teinteDe', () => {
  it('préfère le choix explicite de l’utilisateur', () => {
    expect(teinteDe(categorie('Histoire', 'bleu'))).toBe('bleu')
  })

  it('retombe sur la teinte dérivée sans choix explicite', () => {
    expect(teinteDe(categorie('Histoire'))).toBe(teinteParDefaut('Histoire'))
  })

  it('ne rend aucune teinte pour un sujet sans catégorie', () => {
    expect(teinteDe(null)).toBeNull()
  })
})

describe('estTeinte', () => {
  it('ne reconnaît que les teintes du jeu', () => {
    expect(estTeinte('bleu')).toBe(true)
    expect(estTeinte('fuchsia')).toBe(false)
    expect(estTeinte(null)).toBe(false)
  })
})

describe('categorieHomonyme', () => {
  const existantes = [categorie('Histoire'), categorie('Mathématiques')]

  it('signale un doublon quelle que soit la graphie', () => {
    expect(categorieHomonyme('  HISTOIRE ', existantes)?.name).toBe('Histoire')
  })

  it('laisse passer un nom libre', () => {
    expect(categorieHomonyme('Piano', existantes)).toBeNull()
  })

  it('ne bloque pas une catégorie sur son propre nom', () => {
    // Se renommer « HISTOIRE » en gardant son identifiant doit passer :
    // sinon corriger une majuscule serait impossible.
    expect(categorieHomonyme('HISTOIRE', existantes, 'cat-Histoire')).toBeNull()
  })

  it('bloque encore le nom d’une autre catégorie', () => {
    expect(
      categorieHomonyme('Mathématiques', existantes, 'cat-Histoire')?.name,
    ).toBe('Mathématiques')
  })
})

describe('categoriesProposees', () => {
  it('livre six catégories', () => {
    expect(propositionsCategories()).toHaveLength(6)
  })

  it('leur donne six teintes distinctes', () => {
    /*
     * C'est la raison d'être des teintes explicites : laissés au hachage de
     * `teinteParDefaut`, ces six noms ne produisent que cinq couleurs — deux
     * catégories livrées ensemble seraient jumelles dès le premier écran.
     */
    const teintes = new Set(propositionsCategories().map(({ tint }) => tint))
    expect(teintes.size).toBe(6)
    for (const teinte of teintes) expect(TEINTES).toContain(teinte)
  })

  it('ne propose jamais deux fois le même nom', () => {
    const cles = new Set(propositionsCategories().map(({ name }) => cleCategorie(name)))
    expect(cles.size).toBe(propositionsCategories().length)
  })

  it('matérialise des catégories complètes et horodatées', () => {
    const maintenant = '2026-08-05T10:00:00.000Z'
    const construites = categoriesProposees(maintenant, compteur('c'))

    expect(construites.map((c) => c.id)).toEqual([
      'c-1',
      'c-2',
      'c-3',
      'c-4',
      'c-5',
      'c-6',
    ])
    for (const construite of construites) {
      // `tint` renseigné : ce sont des catégories créées avec leur couleur,
      // pas des catégories qui l'héritent de leur nom.
      expect(construite.tint).not.toBeNull()
      expect(construite.createdAt).toBe(maintenant)
      expect(construite.updatedAt).toBe(maintenant)
    }
  })
})

describe('detacherCategorie', () => {
  const maintenant = '2026-08-05T10:00:00.000Z'
  const sujets = [
    sujet('a', 'cat-1'),
    sujet('b', 'cat-2'),
    sujet('c', 'cat-1'),
    sujet('d', null),
  ]

  it('ne rend que les sujets de la catégorie visée', () => {
    expect(detacherCategorie('cat-1', sujets, maintenant).map((t) => t.id)).toEqual([
      'a',
      'c',
    ])
  })

  it('les rend au groupe « Sans catégorie » sans rien supprimer', () => {
    const detaches = detacherCategorie('cat-1', sujets, maintenant)
    for (const detache of detaches) {
      expect(detache.categoryId).toBeNull()
      expect(detache.status).toBe('active')
      expect(detache.scheduleId).toBe('simple')
      expect(detache.startDate).toBe('2026-03-01')
    }
    expect(detaches.map((t) => t.title)).toEqual(['Sujet a', 'Sujet c'])
  })

  it('horodate la modification, du même instant pour tous', () => {
    // Un geste de l'utilisateur est un instant : deux dates différentes
    // laisseraient croire à deux modifications.
    for (const detache of detacherCategorie('cat-1', sujets, maintenant)) {
      expect(detache.updatedAt).toBe(maintenant)
    }
  })

  it('ne touche pas aux sujets des autres catégories', () => {
    const detaches = detacherCategorie('cat-1', sujets, maintenant)
    expect(detaches.some((t) => t.id === 'b' || t.id === 'd')).toBe(false)
  })

  it('ne rend rien pour une catégorie qui ne porte aucun sujet', () => {
    expect(detacherCategorie('cat-9', sujets, maintenant)).toEqual([])
  })

  it('emporte aussi les sujets archivés', () => {
    // Ils portent la catégorie eux aussi : un désarchivage la ferait
    // réapparaître alors qu'elle n'existe plus.
    const archive = { ...sujet('e', 'cat-1'), status: 'archived' as const }
    const detaches = detacherCategorie('cat-1', [...sujets, archive], maintenant)
    expect(detaches.map((t) => t.id)).toContain('e')
  })
})
