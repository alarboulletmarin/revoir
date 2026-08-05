import { describe, expect, it } from 'vitest'
import {
  contrasteSurPapier,
  estCouleurPersonnalisee,
  normaliserCouleur,
  repereOklab,
  type CouleurPersonnalisee,
} from './couleurs'

/** Les huit teintes de la section 3 bis, telles qu'écrites dans tokens.css. */
const HUIT: CouleurPersonnalisee[] = [
  '#4A6572',
  '#6B5B7B',
  '#5A6B3C',
  '#7A5B45',
  '#3F6389',
  '#3E6B68',
  '#7A5470',
  '#75632A',
]

/** De quoi éprouver le registre : les extrêmes de la roue, plus deux gris. */
const EXTREMES = [
  '#FF0000',
  '#FF8800',
  '#FFEE00',
  '#00FF00',
  '#00FFEE',
  '#0000FF',
  '#8800FF',
  '#FF00AA',
  '#FFFFFF',
  '#000000',
  '#808080',
]

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

describe('registre des huit teintes', () => {
  // Ce que la normalisation vise. Si ces bornes bougent, c'est la palette de
  // tokens.css qui a changé, et couleurs.ts doit suivre.
  it('tient dans une bande étroite de clarté et de chroma', () => {
    for (const teinte of HUIT) {
      const { clarte, chroma } = repereOklab(teinte)
      expect(clarte).toBeGreaterThanOrEqual(0.485)
      expect(clarte).toBeLessThanOrEqual(0.51)
      expect(chroma).toBeGreaterThanOrEqual(0.037)
      expect(chroma).toBeLessThanOrEqual(0.08)
    }
  })
})

describe('normaliserCouleur', () => {
  it('rend toujours un hexadécimal exploitable', () => {
    expect(normaliserCouleur('#FF0000')).toMatch(/^#[0-9a-f]{6}$/)
    expect(normaliserCouleur('pas une couleur')).toMatch(/^#[0-9a-f]{6}$/)
  })

  /*
   * Le cœur du contrat : quelle que soit la couleur choisie, elle sort dans le
   * registre des huit. C'est ce qui autorise la couleur libre sans faire
   * dérailler la section 3 bis.
   */
  it('pose toute couleur dans le registre des huit', () => {
    for (const couleur of EXTREMES) {
      const { clarte, chroma } = repereOklab(normaliserCouleur(couleur))
      expect(clarte).toBeCloseTo(0.497, 2)
      expect(chroma).toBeLessThanOrEqual(0.08)
    }
  })

  it('la rend lisible en texte sur le papier', () => {
    for (const couleur of EXTREMES) {
      const ratio = contrasteSurPapier(normaliserCouleur(couleur))
      expect(ratio).toBeGreaterThanOrEqual(4.5)
      expect(ratio).toBeLessThanOrEqual(6.5)
    }
  })

  it('conserve la teinte choisie', () => {
    // Un bleu franc reste bleu : c'est son canal dominant qui le dit.
    const [rouge, vert, bleu] = canaux(normaliserCouleur('#0000FF'))
    expect(bleu).toBeGreaterThan(rouge)
    expect(bleu).toBeGreaterThan(vert)

    const [r2, v2, b2] = canaux(normaliserCouleur('#00FF00'))
    expect(v2).toBeGreaterThan(r2)
    expect(v2).toBeGreaterThan(b2)
  })

  it('ne teinte pas un gris', () => {
    // Une couleur neutre a une teinte arbitraire : lui imposer la chroma
    // plancher en ferait un vieux rose.
    for (const gris of ['#808080', '#FFFFFF', '#000000']) {
      const [rouge, vert, bleu] = canaux(normaliserCouleur(gris))
      expect(rouge).toBe(vert)
      expect(vert).toBe(bleu)
    }
  })

  /*
   * Le passage par huit bits fait dériver d'une unité au plus au premier
   * report ; ensuite la couleur ne bouge plus. C'est ce qui permet de
   * renormaliser à l'import sans faire glisser les couleurs à chaque
   * aller-retour.
   */
  it('atteint un point fixe', () => {
    for (const couleur of EXTREMES) {
      const une = normaliserCouleur(couleur)
      const deux = normaliserCouleur(une)
      expect(normaliserCouleur(deux)).toBe(deux)
      expect(ecartMaximal(une, deux)).toBeLessThanOrEqual(1)
    }
  })

  it('laisse une teinte déjà dans le registre à sa place', () => {
    // Les huit ne passent jamais par là en production — elles sont stockées
    // par leur nom —, mais elles font le meilleur des cas de contrôle.
    for (const teinte of HUIT) {
      expect(ecartMaximal(teinte, normaliserCouleur(teinte))).toBeLessThanOrEqual(8)
    }
  })
})

function canaux(hex: CouleurPersonnalisee): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function ecartMaximal(a: CouleurPersonnalisee, b: CouleurPersonnalisee): number {
  const gauche = canaux(a)
  return Math.max(...canaux(b).map((valeur, index) => Math.abs(valeur - gauche[index])))
}
