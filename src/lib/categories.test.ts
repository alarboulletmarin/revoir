import { describe, expect, it } from 'vitest'
import type { Category } from '../types'
import {
  TEINTES,
  cleCategorie,
  estTeinte,
  teinteDe,
  teinteParDefaut,
  trouverCategorie,
} from './categories'

function categorie(name: string, tint: Category['tint'] = null): Category {
  return {
    id: `cat-${name}`,
    name,
    tint,
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
