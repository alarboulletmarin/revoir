// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, describe, expect, it } from 'vitest'
import { fr } from './fr'
import { en } from './en'
import {
  LANGUES,
  comparerTextes,
  definirLangueActive,
  estLangue,
  langueActive,
  localeActive,
  textes,
} from '.'
import {
  formatCompact,
  formatEcheance,
  formatLong,
  formatRelative,
  formatShort,
  debutSemaine,
} from '../lib/dates'
import { decrireEcart, decrirePortee, listerDecalages, nommerEcart, SCHEDULES } from '../lib/schedules'
import { joursSemaine } from '../lib/calendrier'
import { resumeCategorie } from '../lib/suivi'

// Le français est la langue par défaut, et le reste de la suite en dépend.
afterEach(() => definirLangueActive('fr'))

/**
 * La forme d'un dictionnaire, sans ses valeurs : les chemins de ses feuilles et
 * ce qu'elles sont. Une chaîne et une fonction ne sont pas interchangeables —
 * l'une s'affiche, l'autre s'appelle —, et l'arité d'une fonction fait partie
 * de son contrat.
 */
function forme(valeur: unknown, prefixe = ''): string[] {
  if (typeof valeur === 'function') return [`${prefixe}: fn/${valeur.length}`]
  if (Array.isArray(valeur)) {
    return valeur.flatMap((entree, index) => forme(entree, `${prefixe}[${index}]`))
  }
  if (typeof valeur === 'object' && valeur !== null) {
    return Object.entries(valeur)
      .flatMap(([cle, sous]) => forme(sous, prefixe === '' ? cle : `${prefixe}.${cle}`))
      .sort()
  }
  return [`${prefixe}: ${typeof valeur}`]
}

describe('dictionnaires', () => {
  /*
   * TypeScript le vérifie déjà à la compilation ; ce test le vérifie sur les
   * valeurs, y compris ce que le typage ne voit pas — un tableau plus court
   * d'une entrée, une fonction qui a perdu un argument.
   */
  it('ont exactement la même forme', () => {
    expect(forme(en)).toEqual(forme(fr))
  })

  it('n’ont aucune chaîne vide', () => {
    const vides = (dictionnaire: unknown, chemin = ''): string[] => {
      if (typeof dictionnaire === 'string') return dictionnaire === '' ? [chemin] : []
      if (typeof dictionnaire !== 'object' || dictionnaire === null) return []
      return Object.entries(dictionnaire).flatMap(([cle, valeur]) =>
        vides(valeur, chemin === '' ? cle : `${chemin}.${cle}`),
      )
    }
    expect(vides(fr)).toEqual([])
    expect(vides(en)).toEqual([])
  })

  it('couvrent toutes les langues annoncées', () => {
    expect(LANGUES.every(estLangue)).toBe(true)
    for (const langue of LANGUES) {
      definirLangueActive(langue)
      expect(langueActive()).toBe(langue)
      expect(textes().etiquette).toBe(langue)
      expect(localeActive()).toBeDefined()
    }
  })

  it('refuse ce qui n’est pas une langue', () => {
    expect(estLangue('de')).toBe(false)
    expect(estLangue('FR')).toBe(false)
    expect(estLangue(null)).toBe(false)
  })
})

describe('dates selon la langue', () => {
  it('n’écrit pas les champs dans le même ordre', () => {
    definirLangueActive('fr')
    expect(formatLong('2026-03-14')).toBe('14 mars 2026')
    expect(formatCompact('2026-03-14')).toBe('14/03')

    definirLangueActive('en')
    expect(formatLong('2026-03-14')).toBe('March 14, 2026')
    expect(formatCompact('2026-03-14')).toBe('03/14')
    expect(formatShort('2026-03-14')).toBe('Sat, Mar 14')
  })

  it('exprime les écarts en langage courant', () => {
    definirLangueActive('en')
    const today = '2026-03-10'
    expect(formatRelative(today, today)).toBe('today')
    expect(formatRelative('2026-03-11', today)).toBe('tomorrow')
    expect(formatRelative('2026-03-07', today)).toBe('3 days ago')
    expect(formatRelative('2026-03-22', today)).toBe('in 12 days')
  })

  it('n’ajoute l’année que hors de l’année de référence', () => {
    definirLangueActive('en')
    expect(formatEcheance('2026-08-08', '2026-03-10')).toBe('August 8')
    expect(formatEcheance('2027-03-08', '2026-03-10')).toBe('March 8, 2027')
  })

  /*
   * La semaine ne commence pas le même jour partout. La rangée d'initiales est
   * dérivée du même début que la grille : elles ne peuvent pas se décaler.
   */
  it('ne commence pas la semaine le même jour', () => {
    definirLangueActive('fr')
    expect(debutSemaine().weekStartsOn).toBe(1)
    expect(joursSemaine()).toEqual(['L', 'M', 'M', 'J', 'V', 'S', 'D'])

    definirLangueActive('en')
    expect(debutSemaine().weekStartsOn).toBe(0)
    expect(joursSemaine()).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S'])
  })
})

describe('programmes selon la langue', () => {
  it('compte en jours dans la langue de l’interface', () => {
    definirLangueActive('en')
    expect(listerDecalages([1, 3, 7])).toBe('D+1 · D+3 · D+7')
    expect(nommerEcart(7)).toBe('1 wk')
    expect(nommerEcart(90)).toBe('3 mos')
    expect(nommerEcart(365)).toBe('1 yr')
    expect(decrireEcart(1)).toBe('1 day after the start date')
    expect(decrirePortee([1, 90])).toBe('over three months')
    expect(decrirePortee([1, 730])).toBe('over 2 years')
  })

  /*
   * Les trois intégrés lisent leur nom à l'accès : construits à l'import du
   * module, ils resteraient sinon figés dans la langue du démarrage.
   */
  it('renomme les trois intégrés sans les reconstruire', () => {
    definirLangueActive('fr')
    expect(SCHEDULES.map((programme) => programme.label)).toEqual([
      'Simple',
      'Poussé',
      'Ultime',
    ])
    expect(SCHEDULES[0].description).toBe('sur un mois')

    definirLangueActive('en')
    expect(SCHEDULES.map((programme) => programme.label)).toEqual([
      'Simple',
      'Extended',
      'Ultimate',
    ])
    expect(SCHEDULES[0].description).toBe('over one month')
  })
})

describe('résumé d’une catégorie', () => {
  it('tait le retard à zéro, dans les deux langues', () => {
    definirLangueActive('fr')
    expect(resumeCategorie({ sujets: 8, enRetard: 3, progression: 62 })).toBe(
      '8 sujets · 3 révisions en retard · 62 % terminé',
    )
    expect(resumeCategorie({ sujets: 1, enRetard: 0, progression: 0 })).toBe(
      '1 sujet · 0 % terminé',
    )

    definirLangueActive('en')
    expect(resumeCategorie({ sujets: 8, enRetard: 3, progression: 62 })).toBe(
      '8 topics · 3 reviews overdue · 62% done',
    )
    expect(resumeCategorie({ sujets: 1, enRetard: 0, progression: 0 })).toBe(
      '1 topic · 0% done',
    )
  })
})

describe('pluriel', () => {
  /*
   * Zéro ne se dit pas pareil : le français reste au singulier, l'anglais passe
   * au pluriel. C'est la raison pour laquelle chaque dictionnaire porte sa
   * propre règle plutôt qu'un gabarit commun à trous.
   */
  it('traite le zéro selon la langue', () => {
    expect(fr.commun.revisions(0)).toBe('0 révision')
    expect(en.commun.revisions(0)).toBe('0 reviews')
    expect(fr.commun.revisions(1)).toBe('1 révision')
    expect(en.commun.revisions(1)).toBe('1 review')
    expect(fr.commun.revisions(2)).toBe('2 révisions')
    expect(en.commun.revisions(2)).toBe('2 reviews')
  })
})

describe('comparerTextes', () => {
  it('trie selon la langue active, pas selon le navigateur', () => {
    definirLangueActive('fr')
    expect(comparerTextes('éclair', 'zèbre')).toBeLessThan(0)
    expect(['Zèbre', 'Abeille', 'Étude'].sort(comparerTextes)).toEqual([
      'Abeille',
      'Étude',
      'Zèbre',
    ])
  })
})
