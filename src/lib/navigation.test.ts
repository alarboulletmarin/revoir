// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest'
import { cheminInterne, identifiantCree } from './navigation'

describe('cheminInterne', () => {
  it('accepte un chemin interne', () => {
    expect(cheminInterne({ retour: '/nouveau/categorie' })).toBe('/nouveau/categorie')
    // La racine est un retour valide : c'est une des trois vues.
    expect(cheminInterne({ retour: '/' })).toBe('/')
  })

  /*
   * Le cas qui justifie la fonction : un routeur qui ne regarderait que le
   * premier caractère accepterait ces adresses, et l'application sortirait
   * d'elle-même après une création.
   */
  it('refuse ce qui sort de l’application', () => {
    for (const retour of [
      '//exemple.com',
      'https://exemple.com',
      '\\\\exemple.com',
      '/\\exemple.com',
      'javascript:alert(1)',
      'nouveau/categorie',
    ]) {
      expect(cheminInterne({ retour })).toBe(null)
    }
  })

  it('refuse tout ce qui n’est pas un objet portant une chaîne', () => {
    for (const valeur of [null, undefined, 'ok', 42, [], {}, { retour: 3 }, { retour: null }]) {
      expect(cheminInterne(valeur)).toBe(null)
    }
  })
})

describe('identifiantCree', () => {
  it('rend l’identifiant attendu', () => {
    expect(identifiantCree({ categorieCreee: 'c1' }, 'categorieCreee')).toBe('c1')
  })

  it('ignore une autre clé', () => {
    expect(identifiantCree({ programmeCree: 'p1' }, 'categorieCreee')).toBe(null)
  })

  it('refuse le vide et ce qui n’est pas une chaîne', () => {
    for (const valeur of [null, undefined, {}, { x: '' }, { x: 12 }, { x: [] }, 'x']) {
      expect(identifiantCree(valeur, 'x')).toBe(null)
    }
  })
})
