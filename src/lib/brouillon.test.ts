// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest'
import { brouillonVide, lireBrouillon, titreValide } from './brouillon'
import { DEFAULT_SCHEDULE } from './schedules'

const JOUR = '2026-03-01'

describe('brouillonVide', () => {
  it('part sans titre, sans catégorie, sur le programme par défaut', () => {
    expect(brouillonVide(JOUR)).toEqual({
      titre: '',
      categoryId: null,
      scheduleId: DEFAULT_SCHEDULE,
      depart: JOUR,
    })
  })
})

describe('lireBrouillon', () => {
  it('relit un brouillon complet', () => {
    const brouillon = {
      titre: 'Les dérivées',
      categoryId: 'c1',
      scheduleId: 'pousse',
      depart: '2026-04-02',
    }
    expect(lireBrouillon(brouillon, JOUR)).toEqual(brouillon)
  })

  /*
   * Le stockage est une donnée extérieure : il survit aux versions, se modifie
   * à la main, et peut contenir n'importe quoi. Chaque cas ci-dessous est un
   * état qu'on peut réellement trouver dans un onglet.
   */
  it.each([
    ['null', null],
    ['une chaîne', 'les dérivées'],
    ['un nombre', 42],
    ['un tableau', []],
    ['un objet vide', {}],
  ])('retombe sur le brouillon vide pour %s', (_, valeur) => {
    expect(lireBrouillon(valeur, JOUR)).toEqual(brouillonVide(JOUR))
  })

  it('garde les champs valides et remplace les autres', () => {
    const relu = lireBrouillon(
      { titre: 'Les dérivées', categoryId: 12, scheduleId: null, depart: 'demain' },
      JOUR,
    )
    expect(relu).toEqual({
      titre: 'Les dérivées',
      categoryId: null,
      scheduleId: DEFAULT_SCHEDULE,
      depart: JOUR,
    })
  })

  it('refuse une date qui n’a pas la forme d’une date-clé', () => {
    for (const depart of ['2026-3-1', '01/03/2026', '', '2026-03-01T00:00:00']) {
      expect(lireBrouillon({ depart }, JOUR).depart).toBe(JOUR)
    }
    expect(lireBrouillon({ depart: '2026-04-02' }, JOUR).depart).toBe('2026-04-02')
  })

  /*
   * Un programme personnel a un identifiant quelconque : on ne peut pas le
   * valider contre une liste fermée ici, seulement contre sa forme. Un
   * identifiant devenu inconnu est rattrapé plus loin, par `getSchedule`.
   */
  it('accepte l’identifiant d’un programme personnel', () => {
    expect(lireBrouillon({ scheduleId: 'p-a3f9' }, JOUR).scheduleId).toBe('p-a3f9')
  })

  it('refuse un identifiant de programme vide', () => {
    expect(lireBrouillon({ scheduleId: '' }, JOUR).scheduleId).toBe(DEFAULT_SCHEDULE)
  })
})

describe('titreValide', () => {
  it('accepte un titre écrit', () => {
    expect(titreValide('Les dérivées')).toBe(true)
  })

  it('refuse le vide et les blancs seuls', () => {
    for (const titre of ['', ' ', '   ', '\n', '\t ']) {
      expect(titreValide(titre)).toBe(false)
    }
  })
})
