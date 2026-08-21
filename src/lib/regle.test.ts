// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest'
import type { DayLoad } from './stats'
import { addDaysToKey } from './dates'
import { geometrieRegle, JOURS_REGLE, niveauRegle, reperesRegle } from './regle'

const AUJOURDHUI = '2026-03-01'

/** Une charge de `JOURS_REGLE` jours à partir d'aujourd'hui. */
const charge = (comptes: number[]): DayLoad[] =>
  comptes.map((count, index) => ({
    date: addDaysToKey(AUJOURDHUI, index),
    count,
  }))

const vide = (jours = JOURS_REGLE) => charge(Array(jours).fill(0))

describe('niveauRegle', () => {
  it('donne un palier par tranche', () => {
    expect(niveauRegle(0)).toBe('vide')
    expect(niveauRegle(1)).toBe('faible')
    expect(niveauRegle(2)).toBe('moyen')
    expect(niveauRegle(3)).toBe('fort')
  })

  it('plafonne au-delà de trois', () => {
    expect(niveauRegle(4)).toBe('fort')
    expect(niveauRegle(40)).toBe('fort')
  })

  it('traite un compte négatif comme une journée vide', () => {
    expect(niveauRegle(-1)).toBe('vide')
  })

  /*
   * Le palier ne dépend que de la journée : c'est tout l'intérêt de paliers
   * fixes plutôt que d'une hauteur proportionnelle au maximum observé.
   */
  it('ne dépend pas de ce qui entoure la journée', () => {
    const calme = geometrieRegle(charge([2, 1, 0, ...Array(11).fill(0)]), AUJOURDHUI)
    const charge2 = geometrieRegle(
      charge([2, 1, 0, 30, ...Array(10).fill(0)]),
      AUJOURDHUI,
    )
    expect(calme[0].niveau).toBe(charge2[0].niveau)
    expect(calme[1].niveau).toBe(charge2[1].niveau)
  })
})

describe('reperesRegle', () => {
  it('pose trois repères : premier, milieu, dernier', () => {
    expect(reperesRegle(JOURS_REGLE)).toEqual([0, 7, 13])
  })

  it('ne pose jamais deux repères au même endroit', () => {
    for (let jours = 1; jours <= 40; jours += 1) {
      const reperes = reperesRegle(jours)
      expect(new Set(reperes).size).toBe(reperes.length)
    }
  })

  it('garde ses repères à l’intérieur de la règle', () => {
    for (let jours = 1; jours <= 40; jours += 1) {
      for (const repere of reperesRegle(jours)) {
        expect(repere).toBeGreaterThanOrEqual(0)
        expect(repere).toBeLessThan(jours)
      }
    }
  })

  it('n’en pose qu’un quand la place manque, aucun sur une règle vide', () => {
    expect(reperesRegle(2)).toEqual([0])
    expect(reperesRegle(1)).toEqual([0])
    expect(reperesRegle(0)).toEqual([])
  })
})

describe('geometrieRegle', () => {
  it('produit une graduation par journée, dans l’ordre reçu', () => {
    const graduations = geometrieRegle(vide(), AUJOURDHUI)
    expect(graduations).toHaveLength(JOURS_REGLE)
    expect(graduations[0].date).toBe(AUJOURDHUI)
    expect(graduations.at(-1)?.date).toBe(addDaysToKey(AUJOURDHUI, JOURS_REGLE - 1))
  })

  it('garde une graduation aux journées vides', () => {
    const graduations = geometrieRegle(vide(), AUJOURDHUI)
    expect(graduations.every((g) => g.niveau === 'vide')).toBe(true)
    expect(graduations.every((g) => g.count === 0)).toBe(true)
  })

  it('ne marque qu’un seul jour comme aujourd’hui', () => {
    const graduations = geometrieRegle(vide(), AUJOURDHUI)
    expect(graduations.filter((g) => g.estAujourdhui)).toHaveLength(1)
    expect(graduations[0].estAujourdhui).toBe(true)
  })

  /*
   * Le jour tourne à minuit et l'application peut rester ouverte : la charge
   * calculée la veille ne contient plus la date du jour. La règle ne doit alors
   * mettre l'accent nulle part, jamais sur la première cellule par défaut.
   */
  it('ne marque aucun jour quand la charge ne contient pas la date du jour', () => {
    const graduations = geometrieRegle(vide(), '2026-02-28')
    expect(graduations.some((g) => g.estAujourdhui)).toBe(false)
  })

  it('reporte les repères aux bons indices', () => {
    const graduations = geometrieRegle(vide(), AUJOURDHUI)
    const indices = graduations.flatMap((g, index) => (g.repere ? [index] : []))
    expect(indices).toEqual([0, 7, 13])
  })

  it('reporte le compte de chaque journée sans le modifier', () => {
    const comptes = [2, 2, 0, 1, 0, 1, 0, 3, 0, 0, 0, 0, 2, 0]
    const graduations = geometrieRegle(charge(comptes), AUJOURDHUI)
    expect(graduations.map((g) => g.count)).toEqual(comptes)
    expect(graduations.map((g) => g.niveau)).toEqual([
      'moyen',
      'moyen',
      'vide',
      'faible',
      'vide',
      'faible',
      'vide',
      'fort',
      'vide',
      'vide',
      'vide',
      'vide',
      'moyen',
      'vide',
    ])
  })

  it('rend une règle vide sans charge', () => {
    expect(geometrieRegle([], AUJOURDHUI)).toEqual([])
  })
})
