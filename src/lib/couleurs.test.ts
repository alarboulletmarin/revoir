// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, describe, expect, it } from 'vitest'
import {
  contrasteSurFond,
  contrasteSurPapier,
  couleurAffichee,
  couleurRetenue,
  couleurTexte,
  estCouleurPersonnalisee,
  repereOklab,
  type CouleurPersonnalisee,
} from './couleurs'
import { FOND, definirThemeResolu } from '../state/theme'

/** Les huit teintes de la section 3 bis, telles qu'écrites dans tokens.css. */
const HUIT: CouleurPersonnalisee[] = [
  '#4a6572',
  '#6b5b7b',
  '#5a6b3c',
  '#7a5b45',
  '#3f6389',
  '#3e6b68',
  '#7a5470',
  '#75632a',
]

/** Des couleurs franches, aux quatre coins de la roue. */
const VIVES = ['#ff0000', '#ff8800', '#00ff00', '#00ffee', '#0000ff', '#ff00aa']

/** Des couleurs pâles : c'est là que tout se joue. */
const PALES = ['#ffb6c1', '#ffee88', '#d8f0ff', '#fff8dc', '#e8e0f8']

describe('estCouleurPersonnalisee', () => {
  it('accepte un hexadécimal à six chiffres, quelle que soit la casse', () => {
    expect(estCouleurPersonnalisee('#4a6572')).toBe(true)
    expect(estCouleurPersonnalisee('#4A6572')).toBe(true)
  })

  it('refuse tout le reste', () => {
    expect(estCouleurPersonnalisee('#abc')).toBe(false)
    expect(estCouleurPersonnalisee('bleu')).toBe(false)
    expect(estCouleurPersonnalisee('rgb(0,0,0)')).toBe(false)
    expect(estCouleurPersonnalisee(null)).toBe(false)
    expect(estCouleurPersonnalisee('#12345g')).toBe(false)
  })
})

describe('couleurRetenue', () => {
  /*
   * L'engagement principal : la couleur choisie est la couleur retenue. Rien
   * n'est assombri ni désaturé pour ressembler aux huit teintes intégrées.
   */
  it('rend la couleur choisie, sans y toucher', () => {
    // Un rouge franc reste ce rouge, un rose pâle reste ce rose.
    expect(couleurRetenue('#ff0000')).toBe('#ff0000')
    expect(couleurRetenue('#ffb6c1')).toBe('#ffb6c1')
    for (const teinte of HUIT) expect(couleurRetenue(teinte)).toBe(teinte)
  })

  /*
   * Le contrat en une phrase : on ne touche à une couleur que si elle est
   * invisible, et alors on la descend jusqu'au seuil, pas plus bas. Formulé
   * comme une propriété plutôt qu'avec une liste : c'est la mesure de la
   * couleur d'entrée qui décide, pas une intuition sur son nom.
   */
  it('ne touche qu’à ce qui serait invisible, et du minimum', () => {
    for (const couleur of [...VIVES, ...PALES, '#ffffff', '#000000']) {
      const retenue = couleurRetenue(couleur)
      if (contrasteSurPapier(couleur as CouleurPersonnalisee) >= 1.4) {
        expect(retenue).toBe(couleur.toLowerCase())
      } else {
        expect(contrasteSurPapier(retenue)).toBeGreaterThanOrEqual(1.39)
        expect(contrasteSurPapier(retenue)).toBeLessThan(1.6)
      }
    }
  })

  it('garde la teinte de ce qu’elle descend', () => {
    // Un jaune très clair reste jaune, il ne vire pas au gris.
    const [rouge, vert, bleu] = canaux(couleurRetenue('#ffffe0'))
    expect(rouge).toBeGreaterThan(bleu)
    expect(vert).toBeGreaterThan(bleu)
  })

  it('rend une valeur exploitable pour une saisie qui n’est pas une couleur', () => {
    expect(couleurRetenue('pas une couleur')).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('normalise la casse, pour que deux écritures soient une seule couleur', () => {
    expect(couleurRetenue('#FF00AA')).toBe('#ff00aa')
  })
})

describe('couleurTexte', () => {
  /*
   * L'autre engagement : quelle que soit la couleur, son libellé se lit. C'est
   * la seule raison pour laquelle une couleur est parfois assombrie — et elle
   * ne l'est que là, dans l'encre, jamais sur la pastille.
   */
  it('rend lisible sur le papier n’importe quelle couleur', () => {
    for (const couleur of [...VIVES, ...PALES, '#ffffff']) {
      expect(contrasteSurPapier(couleurTexte(couleur as CouleurPersonnalisee))).toBeGreaterThanOrEqual(
        4.49,
      )
    }
  })

  it('laisse intacte une couleur qui se lit déjà', () => {
    for (const teinte of HUIT) {
      expect(couleurTexte(teinte)).toBe(teinte)
    }
    expect(couleurTexte('#0000ff')).toBe('#0000ff')
  })

  it('assombrit du minimum : la couleur reste reconnaissable', () => {
    // Un rose pâle donne un rose foncé, pas un brun quelconque.
    const encre = couleurTexte('#ffb6c1')
    const [rouge, vert, bleu] = canaux(encre)
    expect(rouge).toBeGreaterThan(vert)
    expect(bleu).toBeGreaterThan(vert)
    // Juste ce qu'il faut, pas davantage.
    expect(contrasteSurPapier(encre)).toBeLessThan(5.2)
  })

  it('conserve la teinte choisie', () => {
    const [rouge, , bleu] = canaux(couleurTexte('#d8f0ff'))
    expect(bleu).toBeGreaterThan(rouge)
  })

  it('est idempotente', () => {
    for (const couleur of [...PALES, '#ffffff']) {
      const encre = couleurTexte(couleur as CouleurPersonnalisee)
      expect(couleurTexte(encre)).toBe(encre)
    }
  })
})

describe('registre des huit teintes', () => {
  /*
   * Elles ne passent plus par aucune normalisation — elles sont stockées par
   * leur nom. Ce relevé reste là parce qu'il documente la palette : si ces
   * bornes bougent, c'est tokens.css qui a changé.
   */
  it('tient dans une bande étroite de clarté et de chroma', () => {
    for (const teinte of HUIT) {
      const { clarte, chroma } = repereOklab(teinte)
      expect(clarte).toBeGreaterThanOrEqual(0.485)
      expect(clarte).toBeLessThanOrEqual(0.51)
      expect(chroma).toBeGreaterThanOrEqual(0.037)
      expect(chroma).toBeLessThanOrEqual(0.08)
    }
  })

  it('se lit en texte sans retouche', () => {
    for (const teinte of HUIT) {
      expect(contrasteSurPapier(teinte)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('sur le papier de nuit', () => {
  // Le thème clair est celui par défaut, et le reste de la suite en dépend.
  afterEach(() => definirThemeResolu('clair'))

  /*
   * Le sens de l'ajustement dépend du fond. Assombrir un bleu marine sur un
   * papier de nuit le rendrait invisible pile là où le thème clair le lisait
   * enfin : la clarté monte au lieu de descendre.
   */
  it('éclaircit au lieu d’assombrir', () => {
    definirThemeResolu('sombre')
    const encre = couleurTexte('#1a2b6b')
    expect(contrasteSurFond(encre, FOND.sombre)).toBeGreaterThanOrEqual(4.49)
    expect(repereOklab(encre).clarte).toBeGreaterThan(repereOklab('#1a2b6b').clarte)
  })

  it('laisse intacte une couleur qui s’y lit déjà', () => {
    definirThemeResolu('sombre')
    for (const pale of ['#ffb6c1', '#ffee88', '#d8f0ff']) {
      expect(couleurTexte(pale as CouleurPersonnalisee)).toBe(pale)
    }
  })

  it('remonte au seuil de visibilité une pastille trop sombre', () => {
    definirThemeResolu('sombre')
    const pastille = couleurAffichee('#0b0a09')
    expect(contrasteSurFond(pastille, FOND.sombre)).toBeGreaterThanOrEqual(1.39)
    expect(contrasteSurFond(pastille, FOND.sombre)).toBeLessThan(1.7)
  })

  it('conserve la teinte choisie en montant', () => {
    definirThemeResolu('sombre')
    const [rouge, , bleu] = canaux(couleurTexte('#0a1a5a'))
    expect(bleu).toBeGreaterThan(rouge)
  })

  /*
   * Ce qui part en base ne dépend pas de l'écran sur lequel on l'a choisi :
   * sinon la même catégorie vaudrait deux valeurs selon le thème actif au
   * moment de la création, et un export ne se rejouerait plus à l'identique.
   */
  it('n’influence pas la couleur enregistrée', () => {
    definirThemeResolu('clair')
    const enClair = couleurRetenue('#ffffff')
    definirThemeResolu('sombre')
    expect(couleurRetenue('#ffffff')).toBe(enClair)
    expect(couleurRetenue('#0b0a09')).toBe('#0b0a09')
  })
})

function canaux(hex: CouleurPersonnalisee): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}
