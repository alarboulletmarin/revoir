import { describe, expect, it } from 'vitest'
import {
  TEINTES,
  cleCategorie,
  estTeinte,
  teinteDe,
  teinteParDefaut,
} from './categories'

describe('cleCategorie', () => {
  it('ignore la casse et les espaces autour', () => {
    expect(cleCategorie('  Mathématiques ')).toBe('mathématiques')
    expect(cleCategorie('MATHS')).toBe(cleCategorie('maths'))
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
    // Deux appareils qui écrivent la matière différemment doivent l'afficher
    // de la même couleur.
    expect(teinteParDefaut(' histoire ')).toBe(teinteParDefaut('Histoire'))
  })

  it('répartit les matières courantes sur plusieurs teintes', () => {
    const matieres = [
      'Mathématiques',
      'Histoire',
      'Anglais',
      'Physique',
      'Philosophie',
      'Biologie',
    ]
    const obtenues = new Set(matieres.map(teinteParDefaut))
    // Sans exiger l'injectivité — un hachage sur 8 valeurs collisionne —, on
    // vérifie que la répartition n'est pas dégénérée.
    expect(obtenues.size).toBeGreaterThanOrEqual(3)
  })
})

describe('teinteDe', () => {
  it('préfère le choix explicite de l’utilisateur', () => {
    expect(teinteDe('Histoire', { histoire: 'bleu' })).toBe('bleu')
  })

  it('retombe sur la teinte dérivée sans choix explicite', () => {
    expect(teinteDe('Histoire', {})).toBe(teinteParDefaut('Histoire'))
  })

  it('retrouve le choix quel que soit la casse saisie', () => {
    expect(teinteDe('  HISTOIRE ', { histoire: 'ocre' })).toBe('ocre')
  })
})

describe('estTeinte', () => {
  it('ne reconnaît que les teintes du jeu', () => {
    expect(estTeinte('bleu')).toBe(true)
    expect(estTeinte('fuchsia')).toBe(false)
    expect(estTeinte(null)).toBe(false)
  })
})
